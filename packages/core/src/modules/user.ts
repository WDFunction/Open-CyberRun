import { Collection, Db, ObjectId } from "mongodb";
import { CyberRun } from "../app";
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
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
  constructor(core: CyberRun) {
    this.core = core
    this.col = core.db.collection<User>('user')
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
    let inserted = await this.col.insertOne({
      email: data.email,
      username: nanoid(),
      password: data.password,
      email_verified: false,
      email_verify_token: nanoid(),
      createdAt: new Date()
    })
    let t = await this.core.jwt.create(inserted.insertedId)
    return [true, t]
  }
}