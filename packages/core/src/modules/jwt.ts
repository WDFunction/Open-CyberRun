import { Collection, ObjectId } from "mongodb"
import { CyberRun } from "../app";
import jwt from 'jsonwebtoken'
import { Logger } from '../logger'
import { User } from "./user";

export interface JWT {
  userId: ObjectId;
  token: string;
}

// @TODO: edit
const KEY = "HelloWorld"

export default class JWTModule {
  core: CyberRun
  col: Collection<JWT>
  logger = new Logger('jwt')
  constructor(core: CyberRun) {
    this.core = core
    this.col = core.db.collection<JWT>('jwt')
    this.logger.info('init')
  }

  async create(userId: ObjectId) {
    let token = jwt.sign({}, KEY)
    await this.col.insertOne({
      userId, token
    })
    return token
  }

  async verify(token: string): Promise<null | Partial<User>> {
    try {
      jwt.verify(token, KEY)
    } catch (e) {
      return null
    }
    let record = await this.col.findOne({ token })
    let user = await this.core.user.col.findOne({ _id: record.userId })
    delete user.password
    return user
  }
}