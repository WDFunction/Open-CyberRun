import { Adapter, App } from "koishi";
import {WechatBot} from './bot'

export interface WechatConfig {

}

export default class HttpServer extends Adapter<WechatBot.Config, WechatConfig> {
  constructor(app: App, config: WechatConfig) {
    super(app, config)
  }
  async connect(bot: WechatBot){
    console.log('???')
    bot.resolve()
  }
  start(){

  }

  stop() {

  }
}