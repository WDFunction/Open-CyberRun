import { Collection, ObjectId, Document } from "mongodb";
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
    let levels = await this.core.level.levelCol.find({ gameId }).toArray()
    let maps = await this.core.level.mapCol.find({
      fromLevelId: {
        $in: levels.map(v => v._id)
      }
    }).toArray()
    let passed = await this.core.level.checkUserPassed(userId, levels.map(v => v._id))
    let startLevel = levels.find(v => v.type === "start")
    let level = levels.find(v => v._id.equals(levelId))
    if (level.type === "start") return true;

    let toThisLevelMaps = maps.filter(v => v.toLevelId.equals(levelId)).map(v => v.fromLevelId).filter(v => passed[v.toString()]).length
    // @TODO 应该还有问题 懒得写了
    if (toThisLevelMaps) {
      return true
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

  async countUserTries(gameId: ObjectId, userId: ObjectId): Promise<number> {
    return this.core.log.col.find({
      type: {
        $ne: "join"
      },
      userId,
      gameId
    }).count()
  }

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
    }
    return true
  }

  async info(level: Level, userId?: ObjectId): Promise<string[]> {
    let game = await this.get(level.gameId)
    let finished = await this.isUserFinished(game, userId)
    if (finished) {
      return ['您已完赛']
    }
    if (game.type === 'speedrun') {
      const count = await this.countTries(game._id)
      const userCount = userId ? (await this.countUserTries(game._id, userId)) : 0
      return [`当前关卡用时`, '当前排名', '全局用时', '剩余比赛时长', '当前关卡人数', `当前尝试次数: ${userCount}`, `全局尝试次数: ${count}`]
    } else {
      return ['当前积分', '完成题目数', '剩余比赛时间', '当前题目难度系数', '本题预估分数', '当前尝试次数', '全局尝试次数']
    }
  }
}