import { ObjectId } from "mongodb";
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
    if (user) return true;
    await this.core.user.col.insertOne({
      createdAt: new Date(),
      wxOpenId: wxUserId,
      username: wxUserId
    })
    return true
  }

  async games(){
    let list = await this.core.game.list()
    return list.map(v => `${v._id.toString()} ${v.name}`).join("\n")
  }

  async getGameLevels(wxUserId: string, gameId: string){
    let user = await this.core.user.col.findOne({
      wxOpenId: wxUserId
    })
    let levels = await this.core.level.getGameLevels(new ObjectId(gameId), user._id)
    return levels.map(v => v.title).join("\n")
  }
}