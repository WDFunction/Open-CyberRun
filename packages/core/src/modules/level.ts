import { Collection, ObjectId } from "mongodb";
import { Logger } from "../logger";
import { CyberRun } from "../app";
import { Game } from "./game";

export interface Level {
  _id: ObjectId
  gameId: ObjectId;
  title: string;
  content: string;
  type: "start" | "end" | "normal" | "meta"
  distance: number
  mapPoint: { x: number; y: number }
  difficulty?: number // meta mode only
  submitCount?: number // meta mode only
  cooldown?: number
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

  // 获取用户可访问的关卡
  async canAccessLevels(gameId: ObjectId, userId: ObjectId) {
    let ids = await this.core.log.col.aggregate([
      {
        $match: { userId, gameId, type: "passed" }
      },
      { $group: { _id: "$newLevelId" } }
    ]).toArray()
    return ids.map(v => v._id)
  }

  async getGameLevels(gameId: ObjectId, userId?: ObjectId) {
    let game = await this.core.game.get(gameId)
    if (!game) {
      throw new Error("比赛不存在")
    }
    if (game.type === "speedrun") {
      let levels = await this.levelCol.find({
        gameId
      }).toArray()
      let ca = userId ? await this.canAccessLevels(gameId, userId) : []
      levels = levels.filter(v => {
        if (v.type === "start") return true
        if (ca.find(c => c.equals(v._id))) return true
        return false
      })
      let rtnLevels: Partial<Level>[] = levels.map(v => ({
        mapPoint: v.mapPoint,
        title: v.title,
        _id: v._id
      }))

      return rtnLevels
    } else {
      let levels = await this.levelCol.find({
        gameId
      }).toArray()
      let rtnLevels: Partial<Level>[] = levels.map(v => ({
        mapPoint: v.mapPoint,
        title: v.title,
        _id: v._id
      }))
      return rtnLevels
    }
  }

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
    let game = await this.core.game.getByLevel(fromLevelId)
    let finished = await this.core.game.isUserFinished(game, userId)
    if (finished) {
      this.logger.info('verify answer: user %s has finished the game %s', userId.toString(), game._id.toString())
      throw new Error("您已通关游戏")
    }
    let level = await this.levelCol.findOne({ _id: fromLevelId })
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

    await this.core.point.calcAfterEnded(game, fromLevelId, userId)

    if (game.type === 'speedrun') {
      let nextLevel = await this.get(matchedMap[0].toLevelId)
      this.core.log.col.insertOne({
        userId, levelId: fromLevelId, type: "passed", createdAt: new Date(),
        newLevelId: nextLevel._id, gameId: game._id, answers
      })
      this.core.user.setMinDistance(userId, game._id, nextLevel.distance)
      return [game, nextLevel]
    } else {
      this.core.log.col.insertOne({
        userId, levelId: fromLevelId, type: "passed", createdAt: new Date(), gameId: game._id, answers
      })
      return [game, null]
    }
  }

  async checkUserPassed(userId: ObjectId, levelIds: ObjectId[]): Promise<Record<string, boolean>> {
    let data = await this.levelCol.aggregate<{
      _id: ObjectId;
      result: boolean
    }>(
      [
        {
          $match: {
            _id: {
              $in: levelIds
            }
          }
        },
        { $project: { _id: 1 } },
        {
          $lookup: {
            from: "log",
            let: { userId, levelId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$userId", "$$userId"] },
                      { $eq: ["$$levelId", "$levelId"] },
                      {
                        $eq: ["$type", "passed"]
                      }
                    ]
                  }
                }
              }
            ],
            as: "list"
          }
        },
        {
          $addFields: {
            result: {
              $cond: {
                if: { $size: '$list' },
                then: true,
                else: false
              }
            }
          }
        },
        {
          $unset: 'list'
        }
      ]
    ).toArray()
    // this.logger.info('check user passed, %o', data)
    return Object.fromEntries(data.map(v => [v._id.toString(), v.result]))
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

  async adminGetMaps(gameId: ObjectId) {
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
      type: 'normal',
      distance: -1,
      difficulty: 5,
      submitCount: 5,
      gameId: data.gameId,
      mapPoint: {
        x: data.x, y: data.y
      }
    })
    return r.insertedId
  }

  async adminAddMap(data: {
    fromLevelId: ObjectId
    toLevelId: ObjectId
  }) {
    let r = await this.mapCol.insertOne({
      toLevelId: data.toLevelId,
      fromLevelId: data.fromLevelId,
      answers: [/^Example$/]
    })
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
    if (list.length === 0 || (list.length === 1 && list?.[0]?.trim() === "")) {
      await this.mapCol.deleteOne({ _id: mapId })
    } else {

      await this.mapCol.updateOne({ _id: mapId }, {
        $set: {
          answers: list.map(v => new RegExp(v))
        }
      })
    }
  }

  async adminGet(id: ObjectId) {
    return this.levelCol.findOne({ _id: id })
  }

  async adminUpdate(levelId: ObjectId, data: Pick<Level, 'content' | 'title' | 'difficulty' | 'submitCount'>) {
    await this.levelCol.updateOne({
      _id: levelId
    }, {
      $set: data
    })
  }
}