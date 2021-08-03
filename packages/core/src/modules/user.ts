import { Collection, Db, ObjectId } from "mongodb";
import { CyberRun } from "../app";
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import nodemailer, { Transporter } from 'nodemailer'
import Config from "../components/config";
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
}

export default class UserModule {
  core: CyberRun
  public col: Collection<User>
  transport: Transporter
  constructor(core: CyberRun) {
    this.core = core
    this.col = core.db.collection<User>('user')

    Config.get().then(r => {
      this.transport = nodemailer.createTransport({
        host: 'smtp.sendgrid.net',
        port: 465,
        auth: {
          user: 'apikey',
          pass: r.sendgrid.apikey
        }
      })
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

    await this.transport.sendMail({
      from: 'CyberRun <cyberrun@wd-api.com>',
      to: data.email,
      subject: 'CyberRun用户激活',
      html: `<b>以下为您的激活链接</b><br>http://localhost:3000/user/email_verify/${email_verify_token}`
    })

    let t = await this.core.jwt.create(inserted.insertedId)
    return [true, t]
  }

  async emailVerify(token: string){
    let u = await this.col.findOne({email_verify_token: token})
    if(!u) return false;

    await this.col.updateOne(u, {$set: {email_verified: true, email_verify_token: ''}})
    return true
  }
}