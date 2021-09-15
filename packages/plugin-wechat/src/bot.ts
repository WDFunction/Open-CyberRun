import { Adapter, Bot } from "koishi";

export namespace WechatBot {
  export interface Config extends Bot.BaseConfig {
    token?: string
    verifyToken?: string
    endpoint?: string
    attachMode?: 'separate' | 'card' | 'mixed'
  }
}

export class WechatBot extends Bot<WechatBot.Config> {
  constructor(adapter: Adapter, options: WechatBot.Config){
    super(adapter, options)
  }

  async sendMessage(channelId: string, content: string){
    this.app.emit('wechat/response/' + channelId, {channelId, content})
    return ''
  }
}