import fs from 'fs'
import os from 'os'
import { Logger } from '../logger'


export const DefaultConfig = {
  sendgrid: {
    apikey: ""
  },
  mongodb: {
    connection: "mongodb://localhost/"
  },
  root: ""
}

const logger = new Logger('config')

export type IConfig = typeof DefaultConfig

export default class Config {
  static async get(): Promise<IConfig> {
    return new Promise((r) => {
      const filePath = `${os.homedir()}/.config/cyberrun.json`
      if (!fs.existsSync(filePath)) {
        logger.warn('config file not found')
        return r(DefaultConfig)
      }
      fs.readFile(filePath, (err, data) => {
        if (err) {
          console.log(err)
          return r(DefaultConfig)
        }
        let json = JSON.parse(data.toString())
        r(json as IConfig)
      })
    })
  }
}