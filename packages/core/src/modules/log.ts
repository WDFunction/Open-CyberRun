import { Collection, ObjectId } from "mongodb";
import { Logger } from "../logger";
import { CyberRun } from "../app";

export interface Log {
  _id: ObjectId;
  userId: ObjectId;
  gameId?: ObjectId;
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
  logger = new Logger('log')
  constructor(core: CyberRun) {
    this.core = core

    this.col = this.core.db.collection<Log>('log')
    this.logger.info('init')
  }

  /**
   * 加入比赛
   */
  async joinGame(userId: ObjectId, gameId: ObjectId) {
    let maxDistance = (await this.core.level.levelCol.find({
      gameId
    }).sort("distance", -1).limit(1).toArray())[0].distance
    await this.col.updateOne({
      userId, gameId, type: "join"
    }, {
      $setOnInsert: {
        type: "join", createdAt: new Date()
      }
    }, {
      upsert: true
    })
    await this.core.user.setMinDistance(userId, gameId, maxDistance)
  }

  async adminGetWithUsers(gameId: ObjectId, skip = 0) {
    let list = await this.col.aggregate([
      {
        $match: { gameId }
      },
      {
        $sort: { _id: -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: 20
      },
      {
        $lookup: {
          from: "user",
          localField: "userId",
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