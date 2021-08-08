import { Collection, ObjectId, Document } from "mongodb";
import { CyberRun } from "../app";

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

  async canAccessMeta(userId: ObjectId, gameId: ObjectId){
    let normalLevels = await this.core.level.levelCol.find({
      gameId,
      type: {$ne: "meta"}
    }).toArray()
    let passed = await this.core.level.checkUserPassed(userId, normalLevels.map(v => v._id))
    return Object.values(passed).filter(v => !v).length === 0
  }

  async getByLevel(levelId: ObjectId){
    let level = await this.core.level.get(levelId)
    let game = await this.get(level.gameId)
    return game
  }

  async list(){
    let list = await this.col.find().toArray()
    return list
  }

  async get(id: ObjectId){
    let item = await this.col.findOne({_id: id})
    return item
  }

  async getStartLevel(gameId: ObjectId){
    let level = await this.core.level.levelCol.findOne({
      gameId, type: "start"
    })
    return level
  }
}