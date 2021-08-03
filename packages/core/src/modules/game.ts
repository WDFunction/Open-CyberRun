import { Collection, ObjectId, Document } from "mongodb";
import { CyberRun } from "../app";

export interface Game {
  _id: ObjectId
  name: string;
  cover: string;
  startAt: Date;
  endedAt: Date;
  ended: boolean;
}


export default class GameModule {
  core: CyberRun
  col: Collection<Game>
  constructor(core: CyberRun) {
    this.core = core

    this.col = this.core.db.collection<Game>('game')
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