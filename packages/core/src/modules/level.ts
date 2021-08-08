import { Collection, ObjectId } from "mongodb";
import { CyberRun } from "../app";
import { Game } from "./game";

export interface Level {
  _id: ObjectId
  gameId: ObjectId;
  title: string;
  content: string;
  type: "start" | "end" | "normal" | "meta"
}

export interface LevelMap {
  _id: ObjectId;
  fromLevelId: ObjectId;
  toLevelId: ObjectId;
  answers: RegExp[];
}

export default class LevelModule {
  core: CyberRun
  levelCol: Collection<Level>
  mapCol: Collection<LevelMap>
  constructor(core: CyberRun) {
    this.core = core

    this.levelCol = core.db.collection<Level>('level')
    this.mapCol = core.db.collection<LevelMap>('levelMap')
  }

  async get(id: ObjectId) {
    let level = await this.levelCol.findOne({ _id: id })
    return level
  }

  async getMetaGameLevels(gameId: ObjectId) {
    // @TODO not meta game check
    let levels = await this.levelCol.find({
      gameId,
      type: { $ne: 'meta' }
    }).map(v => {
      delete v.content
      return v
    }).toArray()
    return levels
  }

  async getLevelMaxAnswersCount(id: ObjectId) {
    let mostRecord = await this.mapCol.aggregate<{ size: number }>([
      { $match: { fromLevelId: id } },
      { $unwind: '$answers' },
      { $group: { _id: '$fromLevelId', answers: { $push: '$answers' }, size: { $sum: 1 } } },
      { $sort: { size: 1 } },
      { $limit: 1 }
    ]).toArray()
    return mostRecord[0]?.size ?? 0
  }

  async verifyAnswer(fromLevelId: ObjectId, answers: string[], userId: ObjectId): Promise<[Game, Level]> {
    let game = await this.core.game.getByLevel(fromLevelId)
    // @TODO not safe
    const addedFields = answers.map((v, i) => {
      return [`resultObject${i}`, {
        $regexMatch: {
          input: v, regex:
            { $arrayElemAt: ['$answers', i] }
        }
      }]
    })
    let matchedMap = await this.mapCol.aggregate([
      { $match: { fromLevelId } },
      {
        $addFields: Object.fromEntries(addedFields)
      },
      { $match: Object.fromEntries(addedFields.map(v => [v[0], true])) },
      { $unset: addedFields.map(v => v[0]) }
    ]).toArray()

    if (matchedMap.length === 0) {
      this.core.log.col.insertOne({
        userId, levelId: fromLevelId, type: "failed", createdAt: new Date(), gameId: game._id
      })
      throw new Error("回答错误")
    }

    if (game.type === 'speedrun') {
      let nextLevel = await this.get(matchedMap[0].toLevelId)
      this.core.log.col.insertOne({
        userId, levelId: fromLevelId, type: "passed", createdAt: new Date(),
        newLevelId: nextLevel._id, gameId: game._id
      })
      return [game, nextLevel]
    } else {
      this.core.log.col.insertOne({
        userId, levelId: fromLevelId, type: "passed", createdAt: new Date(), gameId: game._id
      })
      return [game, null]
    }
  }

  async checkUserPassed(userId: ObjectId, levelIds: ObjectId[]): Promise<Record<string, boolean>> {
    let data = await this.levelCol.aggregate<{
      _id: ObjectId;
      result: boolean
    }>(
      [
        {
          $match: {
            _id: {
              $in: levelIds
            }
          }
        },
        { $project: { _id: 1 } },
        {
          $lookup: {
            from: "log",
            let: { userId, levelId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$userId", "$$userId"] },
                      { $eq: ["$$levelId", "$levelId"] }
                    ]
                  }
                }
              }
            ],
            as: "list"
          }
        },
        {
          $addFields: {
            result: {
              $cond: {
                if: { $size: '$list' },
                then: true,
                else: false
              }
            }
          }
        },
        {
          $unset: 'list'
        }
      ]
    ).toArray()
    return Object.fromEntries(data.map(v => [v._id.toString(), v.result]))
  }
}