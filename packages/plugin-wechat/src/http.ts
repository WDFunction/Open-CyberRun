import { Adapter, App, Logger, Session } from "koishi";
import { WechatBot } from './bot'
import parser, { j2xParser } from 'fast-xml-parser'

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

const j2x = new j2xParser({
  cdataTagName: "_cdata"
})

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
  }
  async connect(bot: WechatBot) {
    bot.resolve()
  }
  async start() {
    const bot = this.bots[0]
    this.app.router.get('/wechat', async (ctx) => {
      ctx.body = ctx.query.echostr
    })
    this.app.router.post('/wechat', async (ctx) => {
      const data: IComing = parser.parse(ctx.request.body as string).xml
      this.logger.debug('webhook %o', data)
      const body: Partial<Session> = { selfId: "test" }
      body.messageId = data.MsgId.toString()
      body.type = "message"
      body.timestamp = data.CreateTime
      body.content = data.Content
      body.userId = data.FromUserName
      body.channelId = data.ToUserName
      body.subtype === "private"
      const session = new Session(bot, body)
      this.dispatch(session)
      try {
        await timeout(new Promise((resolve) => {
          // @ts-ignore
          bot.app.once('wechat/response/' + data.ToUserName, (resp) => {
            const r = j2x.parse({
              xml: {
                ToUserName: data.FromUserName,
                FromUserName: data.ToUserName,
                CreateTime: Math.floor(new Date().valueOf() / 1000),
                MsgType: "text",
                Content: {
                  _cdata: resp.content
                }
              }
            })

            this.logger.info('receive message response from app: %o, response: %s', resp, r)
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