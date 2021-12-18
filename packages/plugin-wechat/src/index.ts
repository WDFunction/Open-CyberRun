import { Adapter } from 'koishi'
import { WechatBot } from './bot'
import HttpServer from './http'

declare module 'koishi' {
  interface Module {
    wechat: typeof import('.')
  }
}

export default Adapter.define('wechat', WechatBot, HttpServer)