import { Collection, ObjectId, Document, Timestamp, LEGAL_TCP_SOCKET_OPTIONS } from "mongodb";
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
    if (!process.env.CI) {
      this.interval = setInterval(this.checkout.bind(this), 60000)
      this.logger.info('created interval')
    }
  }

  runningTask = false
  async checkout() {
    if (this.runningTask) return;
    let list = await this.core.game.col.find({
      ended: { $ne: true },
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
    await this.col.deleteMany({
      gameId: game._id
    })
    let levels = await this.core.level.levelCol.find({
      gameId: game._id
    }).toArray()
    const TL = (game.endedAt.valueOf() - game.startedAt.valueOf()) / 3600 / 1000
    if (game.type === "speedrun") {
      levels = [await this.core.game.getEndLevel(game._id)]
    }
    for await (const level of levels) {
      let finished = await this.core.log.col.aggregate([
        { $match: { levelId: level._id, type: "passed", createdAt: { $lte: game.endedAt } } },
        {
          $group: {
            _id: '$userId', document: {
              $first: "$$ROOT"
            }
          }
        },
        {
          $replaceRoot: { newRoot: '$document' }
        },
        { $sort: { createdAt: 1 } },
      ]).toArray()
      this.logger.info('finished level %s list: %o', level.title, finished)

      const L = game.type === "speedrun" ? game.difficulty : level.difficulty
      const STY = game.type === "speedrun" ? game.submitCount : level.submitCount
      // ????????????????????????0??? ?????????????????????
      const C = (await this.core.log.col.aggregate<{ count: number }>([
        { $match: { levelId: level._id } },
        { $group: { _id: '$userId' } },
        { $count: 'count' }
      ]).next())?.count
      for (const [R, item] of finished.entries()) {
        const T = (item.createdAt.valueOf() - game.startedAt.valueOf()) / 3600 / 1000

        const RP = 1 - (R - 1) / C
        const TY = R === 0 ? (await this.core.log.col.count({
          gameId: game._id,
          userId: item.userId,
          levelId: item.levelId,
          type: { $ne: "join" }
        })) : 0
        const params = {
          L, TL, STY, C, R, T, RP, TY
        }
        const [version, SPTS, BPTS] = this.calc(params)

        this.logger.info('user %s: %o, result: %o', item.userId, params, { SPTS, BPTS, version })

        await this.col.updateOne({
          type: "finish",
          userId: item.userId,
          timeout: false,
          gameId: game._id,
          levelId: level._id
        }, {
          $set: {
            createdAt: new Date(),
            params,
            version,
            value: SPTS
          }
        }, {
          upsert: true
        })
        if (R === 0) {
          await this.col.updateOne({
            type: "bonus",
            userId: item.userId,
            timeout: false,
            gameId: game._id,
            levelId: level._id
          }, {
            $set: {
              createdAt: new Date(),
              params,
              version,
              value: BPTS
            }
          }, {
            upsert: true
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
    this.logger.debug('pts params %o', data)
    // version spts btps
    const RP = 1 - (data.R - 1) / data.C
    const SPTS = 1000 * (1 + (data.L - 1) * 0.1) * (1 + RP * 0.25) * (0.75 + 0.25 * (data.TL - data.T) / data.TL)
    const BPTS = SPTS * 0.1 * (1 / (data.TY - data.STY + 1))
    return [1,
      SPTS,
      BPTS
    ]
  }

  async calcAfterEnded(game: Game, levelId: ObjectId, userId: ObjectId) {
    let level = await this.core.level.levelCol.findOne({ _id: levelId })
    const endLevel = await this.core.game.getEndLevel(game._id)
    if (game.type === "speedrun" && level._id.equals(endLevel._id)) {
      const L = game.difficulty!
      const value = 10 * 0.25 * (1 + (L - 1) * 0.1) * 100
      await this.col.updateOne({
        type: 'finish',
        userId,
        timeout: true,
        gameId: game._id
      }, {
        $set: {
          createdAt: new Date(),
          params: { L },
          version: 1,
          value
        }
      }, {
        upsert: true
      })
    } else if (game.type === "meta") {
      const L = level.difficulty!
      const value = 10 * 0.25 * (1 + (L - 1) * 0.1) * 100
      await this.col.updateOne({
        type: 'finish',
        userId,
        timeout: true,
        gameId: game._id,
        levelId: levelId
      }, {
        $set: {
          createdAt: new Date(),
          params: { L },
          version: 1,
          value
        }
      }, {
        upsert: true
      })
    }
  }

  async adminList(gameId: ObjectId) {
    let list = await this.col.aggregate([
      {
        $match: {
          gameId
        }
      },
      {
        $group: {
          _id: '$userId',
          point: { $sum: '$value' }
        }
      },
      { $sort: { point: -1 } },
      {
        $lookup: {
          from: "user",
          localField: "_id",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $addFields: {
          user: {
            $arrayElemAt: ["$user", 0]
          }
        }
      },
      {
        $unset: ["userId", "user.password"]
      }
    ]).toArray()
    return list
  }
}