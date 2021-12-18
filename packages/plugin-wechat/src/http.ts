import { Adapter, App, Logger, Session } from "koishi";
import { WechatBot } from './bot'
import { XMLParser, XMLBuilder } from 'fast-xml-parser'

export interface WechatConfig {

}

interface IComing {
  ToUserName: string;
  FromUserName: string;
  CreateTime: number;
  MsgType: 'text'
  Content: string;
  MsgId: number
}

const builder = new XMLBuilder({
  cdataPropName: "_cdata"
})
const parser = new XMLParser();

const timeout = (prom, time, exception) => {
  let timer;
  return Promise.race([
    prom,
    new Promise((_r, rej) => timer = setTimeout(rej, time, exception))
  ]).finally(() => clearTimeout(timer));
}

export default class HttpServer extends Adapter<WechatBot.Config, WechatConfig> {
  logger = new Logger('adapter')
  constructor(app: App, config: WechatConfig) {
    super(app, config)
    this.logger.level = 3
  }
  async connect(bot: WechatBot) {
    bot.resolve()
  }
  async start() {
    const bot = this.bots[0]
    this.ctx.router.get('/wechat', async (ctx) => {
      ctx.body = ctx.query.echostr
    })
    this.ctx.router.post('/wechat', async (ctx) => {
      const data: IComing = parser.parse(ctx.request.body as string).xml
      this.logger.debug('webhook %o', data)
      const body: Partial<Session> = { selfId: "test" }
      body.messageId = data.MsgId.toString()
      body.type = "message"
      body.timestamp = data.CreateTime
      body.content = data.Content.toString()
      body.userId = data.FromUserName
      body.channelId = data.ToUserName
      body.subtype === "private"
      const session = new Session(bot, body)
      this.dispatch(session)
      try {
        let valid = new Date().valueOf() + 4500
        await timeout(new Promise((resolve, reject) => {
          // @ts-ignore
          bot.app.once('wechat/response/' + data.ToUserName, (resp) => {
            if (new Date().valueOf() > valid) reject("timeout");
            const r = builder.build({
              xml: {
                ToUserName: data.FromUserName,
                FromUserName: data.ToUserName,
                CreateTime: Math.floor(new Date().valueOf() / 1000),
                MsgType: "text",
                Content: resp.content
              }
            })
            this.logger.debug('receive message response from app: %o', resp)
            ctx.body = r
            resolve(1)
          })
        }), 4500, Symbol())
      } catch (e) {
        this.logger.warn('receive nothing, return null, %o', e)
        ctx.body = "success"
      }
    })
  }

  stop() {

  }
}