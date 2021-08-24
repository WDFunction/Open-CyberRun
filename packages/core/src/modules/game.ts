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

type FirstArgument<T> = T extends (arg1: infer U, ...args: any[]) => any ? U : any;

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

  async canAccessMeta(userId: ObjectId, gameId: ObjectId) {
    let normalLevels = await this.core.level.levelCol.find({
      gameId,
      type: { $ne: "meta" }
    }).toArray()
    let passed = await this.core.level.checkUserPassed(userId, normalLevels.map(v => v._id))
    return Object.values(passed).filter(v => !v).length === 0
  }

  async canAccessLevel(userId: ObjectId, gameId: ObjectId, levelId: ObjectId) {
    let game = await this.core.game.get(gameId)
    if (game.type === "meta") {
      let levels = await this.core.level.levelCol.find({
        gameId,
        type: "normal"
      }).toArray()
      let passed = await this.core.level.checkUserPassed(userId, levels.map(v => v._id))
      if (levels.find(v => v._id.equals(levelId))) {
        // 是普通关卡
        return true;
      }

      // 是meta
      if (Object.values(passed).filter(v => v).length === Object.values(passed).length) {
        return true;
      }
    } else {
      let levels = await this.core.level.levelCol.find({ gameId }).toArray()
      let level = levels.find(v => v._id.equals(levelId))
      if (level.type === "start") return true;

      let ca = await this.core.level.canAccessLevels(gameId, userId)
      if (ca.find(v => v.equals(level._id))) return true;
    }

    return false
  }

  async getByLevel(levelId: ObjectId) {
    let level = await this.core.level.get(levelId)
    let game = await this.get(level.gameId)
    return game
  }

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

  async get(id: ObjectId) {
    let item = await this.col.findOne({ _id: id })
    return item
  }

  async getStartLevel(gameId: ObjectId) {
    let level = await this.core.level.levelCol.findOne({
      gameId, type: "start"
    })
    return level
  }

  async countTries(gameId: ObjectId): Promise<number> {
    return this.core.log.col.find({
      type: {
        $ne: "join"
      },
      gameId
    }).count()
  }

  async countLevelTries(levelId: ObjectId): Promise<number> {
    return this.core.log.col.find({
      type: {
        $ne: "join"
      },
      levelId
    }).count()
  }

  /**
   * 获取用户提交次数
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
   * 用户是否完赛
   */
  async isUserFinished(game: Game, userId: ObjectId): Promise<boolean> {
    if (game.type === 'speedrun') {
      let endLevel = await this.core.level.levelCol.findOne({
        type: "end",
        gameId: game._id
      })
      let passed = await this.core.log.col.count({
        userId,
        newLevelId: endLevel._id
      })
      return passed >= 1
    } else {
      let endLevel = await this.core.level.levelCol.findOne({
        type: "meta",
        gameId: game._id
      })
      let passed = await this.core.log.col.count({
        userId,
        levelId: endLevel._id
      })
      return passed >= 1
    }
    return true
  }

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

  async playerJoinTime(userId: ObjectId, gameId: ObjectId) {
    let log = await this.core.log.col.findOne({
      gameId, userId, type: "join"
    })
    return log.createdAt
  }

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
    if (level.type === "start") {
      let join = await this.playerJoinTime(userId, level.gameId)
      return new Date().valueOf() - join.valueOf()
    }
    return new Date().valueOf() - enterLevel.createdAt.valueOf()
  }

  /**
   * 用户完成题数量
   */
  async getUserFinishedCount(gameId: ObjectId) {
    return 0
  }

  async info(level: Level, userId: ObjectId): Promise<string[]> {
    let game = await this.get(level.gameId)
    /*let levels = await this.core.level.levelCol.find({
      gameId: game._id
    }).toArray()*/
    let finished = await this.isUserFinished(game, userId)
    if (finished) {
      return ['您已完赛']
    }

    const userGameCount = userId ? (await this.countUserGameTries(game._id, userId)) : 0
    const userLevelCount = userId ? (await this.countUserLevelTries(level._id, userId)) : 0
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
        `当前关卡人数 ${await this.getLevelUsers(level)}`,
        `关卡提交次数: ${userLevelCount}`,
        `比赛提交次数: ${userGameCount}`,
        `关卡全局尝试次数: ${await this.countLevelTries(level._id)}`,
        `比赛全局提交次数: ${await this.countTries(game._id)}`
      ]
    } else {
      await this.updateMetaOnline(level._id, userId)
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
    const C = await this.getMetaOnline(level._id) || await this.countPlayers(game) // 总人数

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

  // meta only
  async guessGamePoint(userId: ObjectId, game: Game) {
    const levels = await this.core.level.levelCol.find({
      gameId: game._id
    }).toArray()
    let result = 0
    for (const level of levels) {
      let [SPTS] = await this.guessLevelPoint(userId, game, level)
      this.logger.info('guess game point, level %s: %d', level._id, SPTS)
      result += SPTS
    }
    return result
  }

  async getPassedLogs(gameId: ObjectId) {
    let end = await this.core.level.levelCol.findOne({
      gameId,
      type: { $in: ["meta", "end"] }
    })
    let passedLogs = await this.core.log.col.find({
      newLevelId: end._id,
      type: "passed"
    }).toArray()
    return passedLogs
  }

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

    if (game.type === "speedrun") {
      for (let level of levels) {
        level.onlineCount = await this.getLevelUsers(level)

        // TODO 优化
        let users = await this.core.log.col.aggregate<{
          _id: ObjectId
          count: number
        }>([
          { $match: { levelId: level._id } },
          { $group: { _id: "$userId", count: { $sum: 1 } } }
        ]).toArray()

        level.avgSubmit = (users.map(v => v.count).reduce((a, b) => a + b, 0) / users.length) || 0
      }
    } else {
      for (let level of levels) {
        level.onlineCount = 0
        level.avgSubmit = 0
      }
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

  async updateMetaOnline(levelId: ObjectId, userId: ObjectId) {
    await this.onlineCol.updateOne({
      levelId, userId
    }, {
      $set: {
        updatedAt: new Date()
      }
    }, {
      upsert: true
    })
  }

  async getMetaOnline(levelId: ObjectId) {
    return this.onlineCol.find({
      updatedAt: { $gte: new Date(new Date().valueOf() - 10000) },
      levelId
    }).count()
  }
}