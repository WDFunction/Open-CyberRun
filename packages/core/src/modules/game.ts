import { Collection, ObjectId, Document, Timestamp } from "mongodb";
import { CyberRun } from "../app";
import { Level, LevelMap } from "./level";
import { User } from "./user";
import { Logger } from '../logger'
import { CalcType } from "./point";

export interface Game {
  _id: ObjectId
  name: string;
  cover: string;
  startedAt: Date;
  endedAt: Date;
  ended: boolean;
  type: "meta" | "speedrun"
  map: string;
  difficulty?: number // speedrun mode only
  submitCount?: number // speedrun mode only
}

export interface Online {
  _id: ObjectId
  gameId?: ObjectId
  levelId: ObjectId
  userId: ObjectId
  updatedAt: Date
}


export default class GameModule {
  core: CyberRun
  col: Collection<Game>
  onlineCol: Collection<Online>
  logger = new Logger('game')
  constructor(core: CyberRun) {
    this.core = core

    this.col = this.core.db.collection<Game>('game')
    this.onlineCol = this.core.db.collection<Online>('online')
    /*this.onlineCol.createIndex({
      updateAt: 1
    }, {
      expireAfterSeconds: 10
    })*/

    this.logger.info('init')
  }

  /**
   * 能否访问关卡
   */
  async canAccessLevel(userId: ObjectId, levelId: ObjectId) {
    // let game = await this.core.game.get(gameId)
    let maps = await this.core.level.mapCol.find({
      $or: [{
        fromLevelId: levelId
      }, {
        toLevelId: levelId
      }]
    }).toArray()
    const isFirstLevel = maps.filter(v => v.toLevelId.equals(levelId)).length === 0
    if (isFirstLevel) {
      this.logger.info('%s is first level', levelId)
      return true
    }

    // 不是第一关 看levelMap 之前的关卡必须要都passed
    let toThisMaps = maps.filter(v => v.toLevelId.equals(levelId))

    let toThisLogs = await this.core.log.col.aggregate([
      { $match: { userId, newLevelId: levelId, type: "passed" } },
      {
        $group: {
          _id: '$levelId', document: {
            $first: "$$ROOT"
          }
        }
      },
      {
        $replaceRoot: { newRoot: '$document' }
      }
    ]).toArray()

    const isEqualSet = (a: string[], b: string[]): boolean => {
      const union = new Set([...a, ...b])
      return union.size === a.length && union.size === b.length;
    }

    this.logger.info('%s not first level, verify maps and logs: %o %o', levelId, toThisMaps.map(v => v.fromLevelId),
      toThisLogs.map(v => v.levelId))
    if (isEqualSet(
      toThisMaps.map(v => v.fromLevelId.toString()),
      toThisLogs.map(v => v.levelId.toString())
    )) {
      return true
    }
    return false
  }

  /**
   * 前端获取比赛列表
   */
  async list(): Promise<Partial<Game>[]> {
    let list = await this.col.find().toArray()
    return list.map(v => ({
      _id: v._id,
      cover: v.cover,
      name: v.name,
      startedAt: v.startedAt,
      type: v.type,
      ended: v.ended
    }))
  }

  /**
   * 获取比赛(验证开始时间)
   */
  async get(id: ObjectId) {
    let item = await this.col.findOne({
      _id: id,
      startedAt: {
        $lte: new Date()
      }
    })
    return item
  }

  /**
   * 比赛全局提交次数
   */
  async countTries(gameId: ObjectId): Promise<number> {
    return this.core.log.col.find({
      type: {
        $ne: "join"
      },
      gameId
    }).count()
  }

  /**
   * 关卡全局提交次数
   */
  async countLevelTries(levelId: ObjectId): Promise<number> {
    return this.core.log.col.find({
      type: {
        $ne: "join"
      },
      levelId
    }).count()
  }

  /**
   * 比赛用户提交次数
   */
  async countUserGameTries(gameId: ObjectId, userId: ObjectId): Promise<number> {
    return this.core.log.col.find({
      type: {
        $ne: "join"
      },
      userId,
      gameId
    }).count()
  }

  /**
   * 关卡用户提交次数
   */
  async countUserLevelTries(levelId: ObjectId, userId: ObjectId): Promise<number> {
    return this.core.log.col.find({
      type: {
        $ne: "join"
      },
      userId,
      levelId
    }).count()
  }


  /**
   * 获取结束关
   */
  async getEndLevel(gameId: ObjectId) {
    let levels = await this.core.level.levelCol.find({
      gameId
    }).toArray()
    let maps = await this.core.level.mapCol.find({
      $or: [{
        toLevelId: { $in: levels.map(v => v._id) }
      }, {
        fromLevelId: { $in: levels.map(v => v._id) }
      }]
    }).toArray()
    for (const level of levels) {
      // 没有这一关的出口关卡
      if (maps.filter(v => v.toLevelId.equals(level._id)).length === 1 &&
        maps.filter(v => v.fromLevelId.equals(level._id)).length === 0) {
        return level
      }
    }
  }

  /**
   * 用户是否完赛
   */
  async isUserFinished(game: Game, userId: ObjectId): Promise<boolean> {
    let endLevel = await this.getEndLevel(game._id)
    this.logger.info('end level %o', endLevel)
    let log = await this.core.log.col.count({
      userId, newLevelId: endLevel._id, type: "passed"
    })
    return log >= 1
  }

  /**
   * 参与用户数
   */
  async countPlayers(game: Game) {
    return this.core.log.col.count({
      gameId: game._id,
      type: "join"
    })
  }

  /**
   * 各用户到终点的距离统计
   */
  async getUserDistances(gameId: ObjectId): Promise<{
    _id: number,
    count: number
  }[]> {
    let data = await this.core.user.col.aggregate<{
      _id: number,
      count: number
    }>([
      {
        $match: { [`gameData.${gameId}.minDistance`]: { $ne: null } }
      },
      { $group: { _id: `$gameData.${gameId}.minDistance`, count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray()
    return data
  }

  /**
   * 获取某一关的用户数
   */
  async getLevelUsers(level: Level): Promise<number> {
    // 进入下一关的人数 - 进入这一关的人数
    let toNextLevelCount = (await this.core.log.col.aggregate<{ result: number }>([
      {
        $match: {
          levelId: level._id,
          type: "passed"
        }
      },
      {
        $group: { _id: "$userId" }
      },
      {
        $count: "result"
      }
    ]).next())?.result ?? 0
    let toThisLevelCount = (await this.core.log.col.aggregate<{ result: number }>([
      {
        $match: {
          newLevelId: level._id,
          type: { $in: ["join", "passed"] }
        }
      },
      {
        $group: { _id: "$userId" }
      },
      {
        $count: "result"
      }
    ]).next())?.result ?? 0
    return toThisLevelCount - toNextLevelCount
  }


  /**
   * 用户参加时间(第一次heartbeat)
   */
  async playerJoinTime(userId: ObjectId, gameId: ObjectId) {
    let log = await this.core.log.col.findOne({
      gameId, userId, type: "join"
    })
    return log.createdAt
  }

  /**
   * 用户在某一关的耗时(speedrun模式)
   */
  async playerLevelTimeUsage(userId: ObjectId, level: Level) {
    let enterLevel = await this.core.log.col.findOne({
      newLevelId: level._id,
      type: "passed",
      userId
    })
    let leaveLevel = await this.core.log.col.findOne({
      levelId: level._id,
      type: "passed",
      userId
    })
    if (leaveLevel) {
      return leaveLevel.createdAt.valueOf() - enterLevel.createdAt.valueOf()
    }
    if (enterLevel) {
      return new Date().valueOf() - enterLevel.createdAt.valueOf()
    }
    // is start level
    let join = await this.playerJoinTime(userId, level.gameId)
    return new Date().valueOf() - join.valueOf()
  }

  /**
   * 前端 获取侧边栏信息
   */
  async info(level: Level, userId: ObjectId): Promise<string[]> {
    let game = await this.get(level.gameId)
    await this.core.log.joinGame(userId, level.gameId)
    /*let levels = await this.core.level.levelCol.find({
      gameId: game._id
    }).toArray()*/
    let finished = await this.isUserFinished(game, userId)
    if (finished) {
      return ['您已完赛']
    }
    if (!await this.canAccessLevel(userId, level._id)) {
      return ['']
    }

    const userGameCount = userId ? (await this.countUserGameTries(game._id, userId)) : 0
    const userLevelCount = userId ? (await this.countUserLevelTries(level._id, userId)) : 0

    await this.updateOnline(level._id, userId)

    if (game.type === 'speedrun') {
      const countPlayers = await this.countPlayers(game)
      const distance = userId ? (await this.core.user.getMinDistance(userId, game._id)) : 0
      let globalDistances = await this.getUserDistances(game._id)

      // 从排名最后开始减
      let rank = globalDistances.map(v => v.count).reduce((a, b) => a + b, 0)
      // this.logger.info('rank %d', rank)
      for (const gd of globalDistances) {
        if (distance < gd._id) {
          rank -= gd.count
        }
      }
      const levelUsage = await this.playerLevelTimeUsage(userId, level)
      const joinTime = await this.playerJoinTime(userId, level.gameId)
      const timeUsage = new Date().valueOf() - joinTime.valueOf()
      return [
        `当前关卡用时 ${levelUsage / 1000}秒`,
        `当前排名 ${rank}/${countPlayers}`,
        `全局用时 ${timeUsage / 1000}秒`,
        //'剩余比赛时长',
        `当前关卡人数 ${await this.getLevelUsers(level) || await this.getOnline(level._id)}`,
        `关卡提交次数: ${userLevelCount}`,
        `比赛提交次数: ${userGameCount}`,
        `关卡全局尝试次数: ${await this.countLevelTries(level._id)}`,
        `比赛全局提交次数: ${await this.countTries(game._id)}`
      ]
    } else {
      // 这里应该要考虑meta 但是完成meta后就不显示了 先不考虑
      // 完成题目数
      let finishedCount = await this.core.log.col.aggregate<{ count: number }>([
        {
          $match: {
            gameId: game._id, userId, type: {
              $ne: "join"
            }
          }
        },
        { $group: { _id: '$levelId' } },
        { $count: 'count' }
      ]).next()
      this.logger.info('game %o', game)


      const gamePTS = await this.guessGamePoint(userId, game)
      // game
      await this.core.point.liveCol.updateOne({
        gameId: game._id
      }, {
        $set: {
          value: gamePTS,
          updatedAt: new Date()
        }
      }, {
        upsert: true
      })

      // const isFirst = (await this.core.log.col.count({
      //   levelId: level._id, type: "passed"
      // })) === 0

      const [SPTS, BPTS, params] = await this.guessLevelPoint(userId, game, level)

      return [`本题预估积分 ${Math.floor(SPTS * 100) / 100}`,
      `完赛预估积分 ${Math.floor(gamePTS * 100) / 100}`,
      `完成题目数 ${finishedCount?.count || 0}`,
      `剩余比赛时间 ${Math.floor((params.TL - params.T) * 100) / 100}小时`,
      `当前题目难度系数 ${level.difficulty || '未设置'}`,
      `当前关卡人数 ${params.C}`,
      `关卡提交次数: ${userLevelCount}`,
      `比赛提交次数: ${userGameCount}`,
      `关卡全局尝试次数: ${await this.countLevelTries(level._id)}`,
      `比赛全局提交次数: ${await this.countTries(game._id)}`]
    }
  }

  /**
   * 预估关卡分数
   */
  async guessLevelPoint(userId: ObjectId, game: Game, level: Level): Promise<[number, number, CalcType]> {
    // 此题完成的人数
    let finishedThisCount = (await this.core.log.col.aggregate<{ count: number }>([
      {
        $match: {
          levelId: level._id,
          type: "passed"
        }
      },
      { $group: { _id: '$userId' } },
      { $count: 'count' }
    ]).next())?.count || 0

    const L = level.difficulty || 1 // 难度系数
    const R = finishedThisCount + 1 // 结算排名 由完成题数排行计算
    const C = await this.getOnline(level._id) || await this.countPlayers(game) // 总人数

    const T = (new Date().valueOf() - game.startedAt.valueOf()) / 3600 / 1000
    const TL = (game.endedAt.valueOf() - game.startedAt.valueOf()) / 3600 / 1000
    const TY = await this.core.log.col.count({
      userId, levelId: level._id
    })
    const STY = level.submitCount

    const params = {
      L, R, C, T, TL, TY, STY
    }

    const [, SPTS, BPTS] = this.core.point.calc(params)
    return [SPTS, BPTS, params]
  }

  /**
   * 预估比赛分数 (meta)
   */
  async guessGamePoint(userId: ObjectId, game: Game) {
    let levels = await this.core.level.levelCol.find({
      gameId: game._id
    }).toArray()
    let endLevel = await this.getEndLevel(game._id)
    levels = levels.filter(v => !v._id.equals(endLevel._id))
    let result = 0
    for (const level of levels) {
      let [SPTS] = await this.guessLevelPoint(userId, game, level)
      this.logger.info('guess game point, level %s: %d', level._id, SPTS)
      result += SPTS
    }
    return result
  }

  /**
   * 获取通关用户的 log 列表
   */
  async getPassedLogs(gameId: ObjectId) {
    let end = await this.getEndLevel(gameId)
    let passedLogs = await this.core.log.col.find({
      $or: [{
        newLevelId: end._id,
        type: "passed"
      },
      {
        levelId: end._id,
        type: "passed"
      }]
    }).toArray()
    return passedLogs
  }

  /**
   * 幕后统计信息
   */
  async adminStats(gameId: ObjectId) {
    let game = await this.get(gameId)
    let levels: NewLevel[] = await this.core.level.levelCol.find({
      gameId: game._id
    }).toArray()
    type NewLevel = Level & {
      avgSubmit: number;
      onlineCount: number;
    }
    let totalTries = await this.core.log.col.count({
      gameId,
      type: { $ne: "join" }
    })

    for await (let level of levels) {
      level.onlineCount = await this.getOnline(level._id)
      level.avgSubmit = (await this.countLevelTries(level._id)) / (await this.getMetaSubmitUserCount(level._id))
      // 先不管效率了 能用就行
    }

    const userTriesCount = await this.core.log.col.aggregate<{
      _id: ObjectId
      count: number
    }>([
      { $match: { gameId: game._id, type: { $ne: "join" } } },
      { $group: { _id: '$userId', count: { $count: {} } } }
    ]).toArray()
    const userAvgTries = userTriesCount.map(v => v.count).reduce((a, b) => a + b, 0) / userTriesCount.length


    const passedLogs = await this.getPassedLogs(game._id)
    const startLogs = await this.core.log.col.find({
      userId: { $in: passedLogs.map(v => v.userId) },
      type: "join"
    }).toArray()
    // in ms
    // end time - start time, get average
    const passedTime = passedLogs.map(v => v.createdAt.valueOf() - startLogs.find(s => s.userId.equals(v.userId)).createdAt.valueOf()).reduce((a, b) => a + b, 0) / passedLogs.length

    return {
      stats: {
        totalTries,
        userAvgTries,
        passedCount: passedLogs.length,
        avgPassedTime: passedTime
      },
      levels
    }
  }


  /**
   * 关卡提交用户数量
   */
  async getMetaSubmitUserCount(levelId: ObjectId) {
    return (await this.core.log.col.aggregate<{ count: number }>([
      { $match: { levelId, type: { $ne: 'join' } } },
      { $group: { _id: '$userId' } },
      { $count: 'count' }
    ]).next())?.count ?? 0
  }

  /**
   * 更新在线状态
   */
  async updateOnline(levelId: ObjectId, userId: ObjectId) {
    return this.onlineCol.updateOne({
      levelId, userId
    }, {
      $set: {
        updatedAt: new Date()
      }
    }, {
      upsert: true
    })
  }

  /**
   * 获取关卡在线人数
   */
  async getOnline(levelId: ObjectId) {
    return this.onlineCol.find({
      updatedAt: { $gte: new Date(new Date().valueOf() - 10000) },
      levelId
    }).count()
  }

  /**
   * 幕后修改比赛
   */
  async adminUpdate(gameId: ObjectId, data: {
    startedAt: string
    endedAt: string
  } & Pick<Game, 'map' | 'cover' | 'type' | 'difficulty' | 'submitCount'>) {
    return this.col.updateOne({ _id: gameId }, {
      $set: {
        ...data, ...{
          startedAt: new Date(data.startedAt),
          endedAt: new Date(data.endedAt)
        }
      }
    })
  }

  /**
   * 幕后新建比赛
   */
  async adminNew() {
    return this.col.insertOne({
      name: new Date().valueOf().toString(),
      type: "speedrun",
      startedAt: new Date(),
      endedAt: new Date(new Date().valueOf() + 3600 * 24 * 1000),
      ended: false,
      map: '',
      cover: ''
    })
  }

  /**
   * 幕后删除比赛
   */
  async adminDelete(gameId: ObjectId) {
    await this.col.deleteOne({ _id: gameId })
    const levels = await this.core.level.levelCol.find({
      gameId
    }).toArray()
    const ids = levels.map(v => v._id)
    await this.core.level.levelCol.deleteMany({
      gameId
    })
    await this.core.level.mapCol.deleteMany({
      $or: [{
        fromLevelId: { $in: ids }
      }, {
        toLevelId: { $in: ids }
      }]
    })
    await this.core.log.col.deleteMany({
      gameId
    })
    await this.core.point.col.deleteMany({
      gameId
    })
    await this.core.point.liveCol.deleteMany({
      gameId
    })
    await this.core.game.onlineCol.deleteMany({
      gameId
    })
    return true
  }
}