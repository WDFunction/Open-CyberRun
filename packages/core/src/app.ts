import { Db, MongoClient } from "mongodb";
import Config from "./components/config";
import GameModule from "./modules/game";
import JWTModule from "./modules/jwt";
import LevelModule from "./modules/level";
import LogModule from "./modules/log";
import PointModule from "./modules/point";
import UserModule from "./modules/user";
import PlatformModule from "./modules/platform";
import {default as initKoishi} from '@cyberrun/koishi'
import {App} from 'koishi'
import Router from '@koa/router'
export class CyberRun {
  client: MongoClient
  db: Db

  user: UserModule
  jwt: JWTModule
  game: GameModule
  level: LevelModule
  log: LogModule
  point: PointModule
  platform: PlatformModule

  config: Config
  koishiRouter: Router
  koishi: App

  constructor(ci?: boolean) {
    if (ci) {
      process.env.CI ||= "true"
    }
  }

  async start() {
    this.config = new Config()
    const uri = (await this.config.get()).mongodb.connection

    this.client = new MongoClient(uri)
    await this.client.connect()
    this.db = await this.client.db('cyberrun')

    this.user = new UserModule(this)
    await this.user.loadModule()
    this.jwt = new JWTModule(this)
    this.game = new GameModule(this)
    this.level = new LevelModule(this)
    this.log = new LogModule(this)
    this.point = new PointModule(this)
    this.platform = new PlatformModule(this)
    this.koishi = await initKoishi(this)
    this.koishiRouter = this.koishi.router
  }

  async stop() {
    await this.client.close()
  }
}