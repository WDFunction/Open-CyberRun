import { Collection, ObjectId } from "mongodb";
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
  constructor(core: CyberRun) {
    this.core = core

    this.col = this.core.db.collection<Log>('log')
  }

  async joinGame(userId: ObjectId, gameId: ObjectId) {
    let start = await this.core.level.levelCol.findOne({
      gameId, type: "start"
    })
    this.col.updateOne({
      userId, gameId, newLevelId: start._id
    }, {
      $setOnInsert: {
        type: "join", createdAt: new Date()
      }
    }, {
      upsert: true
    })
    this.core.user.setMinDistance(userId, gameId, start.distance)
  }

  async adminGetWithUsers(gameId: ObjectId) {
    let list = await this.col.aggregate([
      {
        $match: { gameId }
      },
      {
        $sort: { _id: -1 }
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
        $unset: ["userId", "user.email", "user.password"]
      }
    ]).toArray()
    return list
  }
}