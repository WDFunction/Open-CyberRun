import { CyberRun } from '@cyberrun/core'
import Router from '@koa/router'
import parser, { j2xParser } from 'fast-xml-parser'

interface IComing {
  ToUserName: string;
  FromUserName: string;
  CreateTime: number;
  MsgType: 'text'
  Content: string;
  MsgId: number
}

export async function apply(cbr: CyberRun) {
  const router = new Router({
    prefix: '/wechat'
  })
  
  const j2x = new j2xParser({})
  router.get('/', async (ctx) => {
    ctx.body = ctx.query.echostr
  })
  router.post('/', async (ctx) => {
    const data: IComing = parser.parse(ctx.request.body as string).xml
    console.log(data)
    function reply(content: string){
      const resp = j2x.parse({
        xml: {
          ToUserName: data.FromUserName,
          FromUserName: data.ToUserName,
          CreateTime: Math.floor(new Date().valueOf() / 1000),
          MsgType: "text",
          Content: content
        }
      })
      console.log(resp)
      ctx.body = resp
    }

    if(data.Content.startsWith("加入比赛 ")){
      const id = data.Content.slice("加入比赛 ".length)
      return reply(`加入成功 ${id}`)
    }
    ctx.body = ""
  })
  return router
}