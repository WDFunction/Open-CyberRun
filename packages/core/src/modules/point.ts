import { Collection, ObjectId, Document, Timestamp } from "mongodb";
import { CyberRun } from "../app";
import { Level, LevelMap } from "./level";
import { User } from "./user";
import { Game } from './game'
import { Logger } from '../logger'

export interface Point {
  _id: ObjectId
  type: "bonus" | "finish"
  value: number
  timeout: boolean
  createdAt: Date
  params: Record<string, number>
  version: number
  userId: ObjectId
  gameId: ObjectId
  levelId?: ObjectId
}

export interface LivePoint {
  _id: ObjectId
  gameId: ObjectId
  userId: ObjectId
  updatedAt: Date
  value: number
}

export type CalcType = {
  L: number
  R: number,
  C: number,
  T: number,
  TL: number,
  TY: number,
  STY: number
}

export default class PointModule {
  core: CyberRun
  col: Collection<Point>
  liveCol: Collection<LivePoint>
  logger = new Logger('point')
  interval: any
  constructor(core: CyberRun) {
    this.core = core

    this.col = this.core.db.collection<Point>('point')
    this.liveCol = this.core.db.collection<LivePoint>('livePoint')
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
      await this.checkoutGame(game)
    }
    this.runningTask = false
  }

  async checkoutGame(game: Game) {
    this.logger.info('checkout game %o', game)
    let levels = await this.core.level.levelCol.find({
      gameId: game._id
    }).toArray()

    if (game.type === "speedrun") {
      const endLevel = levels.find(v => v.type === "end")!
      let finished = await this.core.log.col.aggregate([
        { $match: { newLevelId: endLevel._id, type: "passed" } },
        {
          $group: {
            _id: '$userId', document: {
              $first: "$$ROOT"
            }
          }
        },
        {
          $replaceRoot: { newRoot: '$document' }
        }
      ]).toArray()
      this.logger.info('finished list: %o', finished)

      const L = game.difficulty!
      const TL = (game.endedAt.valueOf() - game.startedAt.valueOf()) / 3600 / 1000
      const STY = game.submitCount!
      const C = await this.core.game.countPlayers(game)
      for (const [R, item] of finished.entries()) {
        const T = (item.createdAt.valueOf() - game.startedAt.valueOf()) / 3600 / 1000

        const RP = 1 - (R - 1) / C

        // 大概能放进aggregate
        const TY = await this.core.log.col.count({
          gameId: game._id,
          userId: item.userId,
          type: { $ne: "join" }
        })

        const params = {
          L, TL, STY, C, R, T, RP, TY
        }
        const [version, SPTS, BPTS] = this.calc(params)

        this.logger.info('user %s: %o', item.userId, params)

        await this.col.insertOne({
          type: "finish",
          userId: item.userId,
          timeout: false,
          createdAt: new Date(),
          params,
          version,
          gameId: game._id,
          value: SPTS
        })
        if (BPTS) {
          await this.col.insertOne({
            type: "bonus",
            userId: item.userId,
            timeout: false,
            createdAt: new Date(),
            params,
            version,
            gameId: game._id,
            value: BPTS
          })
        }
      }
    }
    await this.core.game.col.updateOne({
      _id: game._id
    }, {
      $set: {
        ended: true
      }
    })
  }

  calc(data: CalcType) {
    this.logger.info('pts params %o', data)
    // version spts btps
    const RP = 1 - (data.R - 1) / data.C
    const SPTS = 1000 * (1 + (data.L - 1) * 0.1) * (1 + RP * 0.25) * (0.75 + 0.25 * (data.TL - data.T) / data.TL)
    const BPTS = SPTS * 0.1 * (1 / (data.TY - data.STY + 1))
    return [1,
      SPTS,
      BPTS
    ]
  }
}