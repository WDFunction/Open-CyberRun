import { Collection, ObjectId, Document, Timestamp } from "mongodb";
import { CyberRun } from "../app";
import { Level, LevelMap } from "./level";
import { User } from "./user";
import { Logger } from '../logger'

export interface Point {
  _id: ObjectId
  type: "bonus" | "finish"
  createdAt: Date
  params: Record<string, number>
  version: number
  userId: ObjectId
  gameId: ObjectId
  levelId: ObjectId
}
export default class PointModule {
  core: CyberRun
  col: Collection<Point>
  logger = new Logger('point')
  interval: any
  constructor(core: CyberRun) {
    this.core = core

    this.col = this.core.db.collection<Point>('point')
    this.logger.info('init')
    this.interval = setInterval(this.checkout.bind(this), 60000)
    this.logger.info('created interval')
    this.checkout()
  }

  runningTask = false
  async checkout() {
    if (this.runningTask) return;
    let list = await this.core.game.col.find({
      ended: false,
      endedAt: { $lte: new Date() }
    }).toArray()
    if (!list.length) return;
    this.runningTask = true
    for await (const game of list) {
      this.logger.info('checkout game %s', game._id.toString())
    }
    this.runningTask = false
  }
}