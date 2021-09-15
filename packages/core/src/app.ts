import { Db, MongoClient } from "mongodb";
import Config from "./components/config";
import GameModule from "./modules/game";
import JWTModule from "./modules/jwt";
import LevelModule from "./modules/level";
import LogModule from "./modules/log";
import PointModule from "./modules/point";
import UserModule from "./modules/user";
import '@cyberrun/koishi'

export class CyberRun {
  client: MongoClient
  db: Db

  user: UserModule
  jwt: JWTModule
  game: GameModule
  level: LevelModule
  log: LogModule
  point: PointModule

  config: Config

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
  }

  async stop() {
    await this.client.close()
  }
}