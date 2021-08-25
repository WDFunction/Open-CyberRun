import fs from 'fs'
import os from 'os'


export const DefaultConfig = {
  sendgrid: {
    apikey: ""
  },
  mongodb: {
    connection: ""
  },
  root: ""
}

export type IConfig = typeof DefaultConfig

export default class Config {
  static async get(): Promise<IConfig> {
    return new Promise((r) => {
      fs.readFile(`${os.homedir()}/.config/cyberrun.json`, (err, data) => {
        if (err) {
          console.log(err)
          return DefaultConfig
        }
        let json = JSON.parse(data.toString())
        r(json as IConfig)
      })
    })
  }
}