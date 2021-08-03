import { Collection, Db, ObjectId } from "mongodb";
import { CyberRun } from "../app";
import bcrypt from 'bcryptjs'

export interface User {
  _id: ObjectId;
  email: string;
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

  async register(data: Pick<User, 'email' | 'username' | 'password'>) {
    data.password = bcrypt.hashSync(data.password)
    this.col.insertOne({
      email: data.email,
      username: data.username,
      password: data.password,
      createdAt: new Date()
    })
  }

  async login(data: Pick<User, 'email' | 'password'>): Promise<null | string> {
    let u = await this.col.findOne({ email: data.email })
    if (!bcrypt.compareSync(data.password, u.password)) {
      return null
    }
    let t = await this.core.jwt.create(u._id)
    return t
  }
}