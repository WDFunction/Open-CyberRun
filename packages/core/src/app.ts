import { Db, MongoClient } from "mongodb";
import JWTModule from "./modules/jwt";
import UserModule from "./modules/user";

export class CyberRun {
  client: MongoClient
  db: Db

  user: UserModule
  jwt: JWTModule

  constructor() {
    
  }

  async start() {
    const uri = "mongodb://localhost"

    this.client = new MongoClient(uri)
    await this.client.connect()
    this.db = await this.client.db('cyberrun')

    this.user = new UserModule(this)
    this.jwt = new JWTModule(this)
  }
}