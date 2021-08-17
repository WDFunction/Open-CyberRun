import { Collection, ObjectId, Document, Timestamp } from "mongodb";
import { CyberRun } from "../app";
import { Level, LevelMap } from "./level";
import { User } from "./user";

export interface Game {
  _id: ObjectId
  name: string;
  cover: string;
  startAt: Date;
  endedAt: Date;
  ended: boolean;
  type: "meta" | "speedrun"
  map: string;
}


export default class GameModule {
  core: CyberRun
  col: Collection<Game>
  constructor(core: CyberRun) {
    this.core = core

    this.col = this.core.db.collection<Game>('game')
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

  async list() {
    let list = await this.col.find().toArray()
    return list
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

  /**
   * 获取用户提交次数
   */
  async countUserTries(gameId: ObjectId, userId: ObjectId): Promise<number> {
    return this.core.log.col.find({
      type: {
        $ne: "join"
      },
      userId,
      gameId
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

  async info(level: Level, userId?: ObjectId): Promise<string[]> {
    let game = await this.get(level.gameId)
    let levels = await this.core.level.levelCol.find({
      gameId: game._id
    }).toArray()
    let finished = await this.isUserFinished(game, userId)
    if (finished) {
      return ['您已完赛']
    }
    if (game.type === 'speedrun') {
      const count = await this.countTries(game._id)
      const countPlayers = await this.countPlayers(game)
      const userCount = userId ? (await this.countUserTries(game._id, userId)) : 0
      const distance = userId ? (await this.core.user.getMinDistance(userId, game._id)) : 0
      let globalDistances = await this.getUserDistances(game._id)

      // 从排名最后开始减
      let rank = globalDistances.map(v => v.count).reduce((a, b) => a + b, 0)
      for (const gd of globalDistances) {
        if (distance < gd._id) {
          rank -= gd.count
        }
      }
      console.log(distance, rank, globalDistances)
      return [
        //`当前关卡用时`,
        `当前排名 ${rank}/${countPlayers}`,
        //'全局用时',
        //'剩余比赛时长',
        `当前关卡人数 ${await this.getLevelUsers(level)}`,
        `当前尝试次数: ${userCount}`,
        `全局尝试次数: ${count}`
      ]
    } else {
      return ['当前积分', '完成题目数', '剩余比赛时间', '当前题目难度系数', '本题预估分数', '当前尝试次数', '全局尝试次数']
    }
  }

  async getPassedLogs(gameId: ObjectId){
    let end = await this.core.level.levelCol.findOne({
      gameId,
      type: {$in: ["meta", "end"]}
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
      {$match: {gameId: game._id, type: {$ne: "join"}}},
      {$group: {_id: '$userId', count: {$count: {}}}}
    ]).toArray()
    const userAvgTries = userTriesCount.map(v => v.count).reduce((a,b) => a+b, 0) / userTriesCount.length
  

    const passedLogs = await this.getPassedLogs(game._id)
    const startLogs = await this.core.log.col.find({
      userId: {$in: passedLogs.map(v => v.userId)},
      type: "join"
    }).toArray()
    // in ms
    // end time - start time, get average
    const passedTime = passedLogs.map(v => v.createdAt.valueOf() - startLogs.find(s => s.userId.equals(v.userId)).createdAt.valueOf()).reduce((a,b) => a+b,0) / passedLogs.length

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
}