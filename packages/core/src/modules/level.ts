import { Collection, ObjectId } from "mongodb";
import { Logger } from "../logger";
import { CyberRun } from "../app";
import { Game } from "./game";
import Graph from 'graph-data-structure'


export interface Level {
  _id: ObjectId
  gameId: ObjectId;
  title: string;
  content: string;
  // type: "start" | "end" | "normal" | "meta"
  distance: number
  mapPoint: { x: number; y: number }
  difficulty?: number // meta mode only
  submitCount?: number // meta mode only
  cooldown?: number
  alias?: string
}

export interface LevelMap {
  _id: ObjectId;
  fromLevelId: ObjectId;
  toLevelId: ObjectId;
  answers: RegExp[];
}

export default class LevelModule {
  core: CyberRun
  levelCol: Collection<Level>
  mapCol: Collection<LevelMap>
  logger: Logger = new Logger('core')
  constructor(core: CyberRun) {
    this.core = core

    this.levelCol = core.db.collection<Level>('level')
    this.mapCol = core.db.collection<LevelMap>('levelMap')
    this.logger.info('init')
  }

  async get(id: ObjectId) {
    let level = await this.levelCol.findOne({ _id: id })
    return level
  }

  /**
   * 前端 获取关卡
   */
  async getGameLevels(gameId: ObjectId, userId?: ObjectId) {
    let game = await this.core.game.get(gameId)
    if (!game) {
      throw new Error("比赛不存在")
    }
    let levels = await this.levelCol.find({
      gameId
    }).toArray()

    // 速度爆炸 优化下
    for (const [index, level] of levels.entries()) {
      if (!await this.core.game.canAccessLevel(userId, level._id)) {
        delete levels[index]
      }
    }

    let rtnLevels: Partial<Level>[] = levels.filter(v => v).map(v => ({
      mapPoint: v.mapPoint,
      title: v.title,
      _id: v._id,
      alias: v.alias
    }))
    return rtnLevels
  }

  /**
   * 获取关卡输入框数
   */
  async getLevelMaxAnswersCount(id: ObjectId) {
    let mostRecord = await this.mapCol.aggregate<{ size: number }>([
      { $match: { fromLevelId: id } },
      { $unwind: '$answers' },
      { $group: { _id: '$fromLevelId', answers: { $push: '$answers' }, size: { $sum: 1 } } },
      { $sort: { size: 1 } },
      { $limit: 1 }
    ]).toArray()
    return mostRecord[0]?.size ?? 0
  }

  async verifyAnswer(fromLevelId: ObjectId, answers: string[], userId: ObjectId): Promise<[Game, Level]> {
    let level = await this.levelCol.findOne({ _id: fromLevelId })
    let game = await this.core.game.get(level.gameId)
    let finished = await this.core.game.isUserFinished(game, userId)
    if (finished) {
      this.logger.info('verify answer: user %s has finished the game %s', userId.toString(), game._id.toString())
      throw new Error("您已通关游戏")
    }
    if (level.cooldown) {
      let last = await this.core.log.col.findOne({
        levelId: level._id,
        userId,
        createdAt: { $gte: new Date(new Date().valueOf() - level.cooldown * 1000) }
      })
      if (last) {
        throw new Error("冷却中")
      }
    }
    // @TODO not safe
    const addedFields = answers.map((v, i) => {
      return [`resultObject${i}`, {
        $regexMatch: {
          input: v, regex:
            { $arrayElemAt: ['$answers', i] }
        }
      }]
    })
    let matchedMap = await this.mapCol.aggregate([
      { $match: { fromLevelId } },
      {
        $addFields: Object.fromEntries(addedFields)
      },
      { $match: Object.fromEntries(addedFields.map(v => [v[0], true])) },
      { $unset: addedFields.map(v => v[0]) }
    ]).toArray()

    if (matchedMap.length === 0) {
      this.core.log.col.insertOne({
        userId, levelId: fromLevelId, type: "failed", createdAt: new Date(), gameId: game._id, answers
      })
      throw new Error("回答错误")
    }

    if (game.ended && new Date().valueOf() > game.endedAt.valueOf()) {
      await this.core.point.calcAfterEnded(game, fromLevelId, userId)
    }
    let nextLevel = await this.get(matchedMap[0].toLevelId)
    this.core.log.col.insertOne({
      userId, levelId: fromLevelId, type: "passed", createdAt: new Date(),
      newLevelId: nextLevel._id, gameId: game._id, answers
    })
    if (game.type === "speedrun") {
      this.core.user.setMinDistance(userId, game._id, nextLevel.distance)
    }
    return [game, nextLevel]
  }

  async adminWordcloud(id: ObjectId) {
    let logs = await this.core.log.col.aggregate<{
      _id: string
      value: number
    }>([
      { $match: { answers: { $ne: null }, levelId: id } },
      { $unwind: "$answers" },
      { $group: { _id: '$answers', value: { $count: {} } } },
      { $sort: { value: -1 } }
    ]).toArray()
    return logs.map(v => ({
      text: v._id,
      value: v.value
    }))
  }

  async adminGetMaps(gameId: ObjectId): Promise<[Level[], LevelMap[]]> {
    let levels = await this.levelCol.find({
      gameId
    }).toArray()
    let maps = await this.mapCol.find({
      fromLevelId: { $in: levels.map(v => v._id) }
    }).toArray()
    return [levels, maps]
  }

  async adminUpdateLevelPoint(levelId: ObjectId, data: Level['mapPoint']) {
    await this.levelCol.updateOne({
      _id: levelId
    }, {
      $set: {
        mapPoint: data
      }
    })
  }

  async adminAdd(data: {
    x: number, y: number,
    gameId: ObjectId
  }) {
    let r = await this.levelCol.insertOne({
      title: new Date().valueOf().toString(),
      content: '',
      distance: -1,
      difficulty: 1,
      submitCount: 1,
      gameId: data.gameId,
      cooldown: 10,
      mapPoint: {
        x: data.x, y: data.y
      }
    })
    return r.insertedId
  }

  validateMapAndLevels(levels: Level[], maps: LevelMap[]): boolean {
    let endLevels = []
    // has multiple end level
    for (const level of levels) {
      // 没有这一关的出口关卡
      if (maps.filter(v => v.toLevelId.equals(level._id)).length >= 1 &&
        maps.filter(v => v.fromLevelId.equals(level._id)).length === 0) {
        endLevels.push(level)
      }
    }
    if (endLevels.length >= 2) {
      throw new Error("有多个结束关")
    }

    const graph = Graph()
    for (const level of levels) {
      graph.addNode(level._id.toString())
    }
    for (const map of maps) {
      graph.addEdge(map.fromLevelId.toString(), map.toLevelId.toString())
    }
    if (graph.hasCycle()) {
      throw new Error("关卡有回环")
    }

    return true
  }

  async adminAddMap(data: {
    gameId: ObjectId
    fromLevelId: ObjectId
    toLevelId: ObjectId
  }) {
    const [levels, maps] = await this.adminGetMaps(data.gameId)
    const insert = {
      toLevelId: data.toLevelId,
      fromLevelId: data.fromLevelId,
      answers: [/^Example$/]
    } as LevelMap
    this.validateMapAndLevels(levels, [...maps, insert])
    let r = await this.mapCol.insertOne(insert)
    return r.insertedId
  }

  async adminDelete(levelId: ObjectId) {
    await this.levelCol.deleteOne({ _id: levelId })
    await this.mapCol.deleteMany({
      fromLevelId: levelId
    })
    await this.mapCol.deleteMany({
      toLevelId: levelId
    })
    await this.core.log.col.deleteMany({
      levelId
    })
    await this.core.log.col.deleteMany({
      newLevelId: levelId
    })
  }

  async stringifyMap(mapId: ObjectId) {
    let item = await this.mapCol.findOne({
      _id: mapId
    })
    return item.answers.map(v => v.source)
  }

  async adminUpdateMap(mapId: ObjectId, list: string[]) {
    let map = await this.mapCol.findOne({ _id: mapId })
    let level = await this.levelCol.findOne({ _id: map.fromLevelId })
    if (list.length === 0 || (list.length === 1 && list?.[0]?.trim() === "")) {
      await this.mapCol.deleteOne({ _id: mapId })
    } else {

      await this.mapCol.updateOne({ _id: mapId }, {
        $set: {
          answers: list.map(v => new RegExp(v))
        }
      })
    }
    try {
      await this.core.game.updateLevelDistances(level.gameId)
    } catch (e) {
      throw new Error(`保存成功, 距离计算失败 ` + e.message)
    }
  }

  async adminGet(id: ObjectId) {
    return this.levelCol.findOne({ _id: id })
  }

  async adminUpdate(levelId: ObjectId, data: Pick<Level, 'content' | 'title' | 'difficulty' | 'submitCount' | 'alias'>) {
    await this.levelCol.updateOne({
      _id: levelId
    }, {
      $set: data
    })
  }
}