import { Collection, ObjectId } from "mongodb";
import { CyberRun } from "../app";

export interface Log {
  _id: ObjectId;
  userId: ObjectId;
  gameId: ObjectId;
  levelId?: ObjectId;
  ip?: string;
  type: "passed" | "failed" | "join"
  createdAt: Date;
  newLevelId?: ObjectId;
  answers?: string[]
}

export default class LogModule {
  core: CyberRun
  col: Collection<Log>
  constructor(core: CyberRun) {
    this.core = core

    this.col = this.core.db.collection<Log>('log')
  }

  async joinGame(userId: ObjectId, gameId: ObjectId){
    this.col.insertOne({
      userId, gameId, type: "join", createdAt: new Date()
    })
  }
}