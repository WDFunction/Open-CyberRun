import { Collection, ObjectId, Document } from "mongodb";
import { CyberRun } from "../app";
import { LevelMap } from "./level";

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
    if(toThisLevelMaps){
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
}