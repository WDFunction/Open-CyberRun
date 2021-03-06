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
  email?: string;
  email_verified?: boolean;
  email_verify_token?: string;
  // @TODO verify expires
  username: string;
  password?: string;
  createdAt: Date;
  admin?: boolean;
  gravatar?: string;

  wxOpenId?: string;
}

export interface GameData {
  _id: ObjectId
  userId: ObjectId
  gameId: ObjectId
  distance: number
}

export default class UserModule {
  core: CyberRun
  public col: Collection<User>
  public gameDataCol: Collection<GameData>
  transport: Transporter
  logger = new Logger('user')
  constructor(core: CyberRun) {
    this.core = core
    this.col = core.db.collection<User>('user')
    this.gameDataCol = core.db.collection<GameData>('userGameData')
    this.logger.info('init')
  }

  async loadModule() {
    let r = await this.core.config.get()
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

    const root = (await this.core.config.get()).root

    await this.transport.sendMail({
      from: 'CyberRun <cyberrun@wd-api.com>',
      to: data.email,
      subject: 'CyberRun????????????',
      html: `<b>???????????????????????????</b><br>${root}user/email_verify/${email_verify_token}`
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
   * ????????????????????????(?????????????????????)
   */
  async getMinDistance(userId: ObjectId, gameId: ObjectId) {
    return (await this.gameDataCol.findOne({
      userId, gameId
    }))?.distance ?? -1
  }

  async setMinDistance(userId: ObjectId, gameId: ObjectId, distance: number, force = false) {
    let exist = await this.getMinDistance(userId, gameId)
    if (exist < distance && exist >= 0 && !force) {
      return
    }
    this.logger.info('set min distance, user %o, exist: %d, input: %d', userId, exist, distance)
    await this.gameDataCol.updateOne({
      userId, gameId
    }, {
      $set: {
        distance
      }
    }, {
      upsert: true
    })
  }

  async record(gameId: ObjectId, user: Pick<User, '_id' | 'admin'>) {
    const userId = user._id
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
    const game = await this.core.game.get(gameId, user.admin)
    if (!game) {
      throw new Error("???????????????")
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

  async bindWechat(userId: ObjectId, token: string, selected: 'web' | 'wechat') {
    let wechatUser = await this.col.findOne({
      password: token
    })
    if (!wechatUser) {
      throw new Error("user not found")
    }
    await this.col.updateOne({
      _id: userId
    }, {
      $set: {
        wxOpenId: wechatUser.wxOpenId
      }
    })
    await this.col.deleteOne({ _id: wechatUser._id })

    await this.core.point.liveCol.deleteMany({ userId: wechatUser._id })
    await this.core.log.col.updateMany({ userId: wechatUser._id }, {
      $set: {
        userId: userId
      }
    })
    await this.core.game.onlineCol.deleteMany({ userId: wechatUser._id })

    const removeUserId = selected === 'web' ? wechatUser._id : userId

    await this.core.log.col.deleteMany({
      userId: removeUserId
    })
    await this.core.point.col.deleteMany({
      userId: removeUserId
    })
    await this.core.user.gameDataCol.deleteMany({
      userId: removeUserId
    })

  }
}