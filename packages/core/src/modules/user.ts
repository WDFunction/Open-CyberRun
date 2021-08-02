import { Collection, Db } from "mongodb";
import {CyberRun} from "../app";

export interface User {
  email: string;
}

export default class UserModule {
  core: CyberRun
  col: Collection<User>
  constructor(core: CyberRun) {
    this.core = core
    this.col = core.db.collection<User>('user')
  }

  async register(data: {
    email: string
    password: string
  }) {
    this.col.insertOne({
      email: data.email
    })
  }
}