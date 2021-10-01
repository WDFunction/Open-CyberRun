import { ObjectId } from "mongodb";
import { Game } from "./game";
import { CyberRun } from "../app";
import { Logger } from '../logger'

export default class PlatformModule {
  core: CyberRun
  logger = new Logger('platform')
  constructor(core: CyberRun) {
    this.core = core
    this.logger.info('init')
  }

  async ensureUser(wxUserId: string) {
    let user = await this.core.user.col.findOne({
      wxOpenId: wxUserId
    })
    this.logger.info('ensure user %s -> %o', wxUserId, user
    )
    if (user) return user;
    await this.core.user.col.insertOne({
      createdAt: new Date(),
      wxOpenId: wxUserId,
      username: wxUserId
    })
    user = await this.core.user.col.findOne({
      wxOpenId: wxUserId
    })
    return user
  }

  async games() {
    let list = await this.core.game.list()
    return list.map(v => `[${v.alias ?? v._id.toString()}] ${v.name}`).join("\n")
  }

  async getGameLevels(wxUserId: string, gameId: string) {
    let user = await this.ensureUser(wxUserId)
    let levels = await this.core.level.getGameLevels(new ObjectId(gameId), user._id)
    return levels.map(v => `[${v.alias ?? v._id.toString()}] ${v.title}`).join("\n")
  }

  async joinGame(wxUserId: string, gameId: string) {
    let game: Game
    if (ObjectId.isValid(gameId)) {
      game = await this.core.game.get(new ObjectId(gameId))
    } else {
      let game2 = await this.core.game.col.findOne({
        alias: gameId
      })
      game = await this.core.game.get(game2._id)
    }
    await this.core.log.joinGame((await this.ensureUser(wxUserId))._id, game)
    return game
  }

  async getLevel(userId: string, _levelId: string): Promise<[boolean, ObjectId, string]> {
    let user = await this.ensureUser(userId)
    let levelId: ObjectId
    if (ObjectId.isValid(_levelId)) {
      levelId = new ObjectId(_levelId)
    } else {
      levelId = (await this.core.level.levelCol.findOne({
        alias: _levelId
      }))?._id
    }
    if (!await this.core.game.canAccessLevel(user._id, levelId)) {
      return [false, levelId, '你不配']
    }
    let level = await this.core.level.get(levelId)
    return [true, levelId, `${level.title}
    
    ${level.content}`]
  }

  async verifyAnswer(userId: string, levelId: string, answers: string[]) {
    return await this.core.level.verifyAnswer(new ObjectId(levelId), answers, (await this.ensureUser(userId))._id)
  }

  async info(userId: string, levelId: string) {
    let id = new ObjectId(levelId)
    let level = await this.core.level.get(id)
    let info = await this.core.game.info(
      level,
      (await this.ensureUser(userId))._id
    )
    return info.join("\n")
  }

  async updateUserToken(userId: ObjectId, token: string) {
    await this.core.user.col.updateOne({
      _id: userId
    }, {
      $set: {
        password: token
      }
    })
  }
}