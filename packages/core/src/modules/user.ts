import { Collection, Db, ObjectId } from "mongodb";
import { CyberRun } from "../app";
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import nodemailer, { Transporter } from 'nodemailer'
import Config from "../components/config";
import { Logger } from '../logger'
import { Point } from "./point";
export interface User {
  _id: ObjectId;
  email: string;
  email_verified: boolean;
  email_verify_token: string;
  // @TODO verify expires
  username: string;
  password: string;
  createdAt: Date;
  admin?: boolean;
  gravatar?: string;

  gameData?: Record<string, {
    minDistance: number
  }>
}

export default class UserModule {
  core: CyberRun
  public col: Collection<User>
  transport: Transporter
  logger = new Logger('user')
  constructor(core: CyberRun) {
    this.core = core
    this.col = core.db.collection<User>('user')

    this.logger.info('init')
  }

  async loadModule() {
    let r = await Config.get()
    this.transport = nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 465,
      auth: {
        user: 'apikey',
        pass: r.sendgrid.apikey
      }
    })

  }

  // [is new user, token]
  async init(data: Pick<User, 'email' | 'password'>): Promise<[boolean, string]> {
    // @TODO check email
    let u = await this.col.findOne({ email: data.email })
    if (u) {
      if (!bcrypt.compareSync(data.password, u.password)) {
        return [false, null]
      }
      let t = await this.core.jwt.create(u._id)
      return [false, t]
    }

    data.password = bcrypt.hashSync(data.password)
    const email_verify_token = nanoid()
    let inserted = await this.col.insertOne({
      email: data.email,
      username: nanoid(),
      password: data.password,
      email_verified: false,
      email_verify_token,
      createdAt: new Date()
    })

    const root = (await Config.get()).root

    await this.transport.sendMail({
      from: 'CyberRun <cyberrun@wd-api.com>',
      to: data.email,
      subject: 'CyberRun用户激活',
      html: `<b>以下为您的激活链接</b><br>${root}user/email_verify/${email_verify_token}`
    })

    let t = await this.core.jwt.create(inserted.insertedId)
    return [true, t]
  }

  async emailVerify(token: string) {
    let u = await this.col.findOne({ email_verify_token: token })
    if (!u) return false;

    await this.col.updateOne(u, { $set: { email_verified: true, email_verify_token: '' } })
    return true
  }

  /**
   * 获取离终点的距离(数据库里设置的)
   */
  async getMinDistance(userId: ObjectId, gameId: ObjectId) {
    let u = await this.col.findOne({ _id: userId })
    let data = u.gameData?.[gameId.toString()]?.minDistance
    if (!data) {
      let record = await this.core.level.levelCol.find({
        gameId
      }).sort({ distance: -1 }).limit(1).next()
      data = record.distance
    }
    return data
  }

  async setMinDistance(userId: ObjectId, gameId: ObjectId, distance: number) {
    return this.col.updateOne({ _id: userId }, {
      $set: {
        gameData: {
          [gameId.toString()]: {
            minDistance: distance
          }
        }
      }
    })
  }

  async record(gameId: ObjectId, userId: ObjectId) {
    let logs = await this.core.log.col.aggregate([
      { $match: { gameId, userId, type: "passed" } },
      {
        $group: {
          _id: '$levelId', document: {
            $first: "$$ROOT"
          }
        }
      },
      {
        $replaceRoot: { newRoot: '$document' }
      },
      { $sort: { createdAt: -1 } }
    ]).toArray()
    const game = await this.core.game.get(gameId)
    if (!game) {
      throw new Error("比赛不存在")
    }
    let points
    if (game.ended) {
      points = (await this.core.point.col.find({
        gameId, userId
      }).project<{ type: Pick<Point, 'type'>, value: number }>({
        type: 1,
        value: 1,
        levelId: 1
      }).toArray()).map(v => {
        v.value = Math.floor(v.value * 100) / 100
        return v
      })
    }
    let levels = await this.core.level.levelCol.find({
      gameId
    }).project({
      _id: 1,
      title: 1
    }).toArray()
    return {
      logs, points, game, levels
    }
  }
}