import { App, Command, Logger, Tables, User } from 'koishi'
import Wechat from '@koishijs/plugin-wechat'
import { apply as mongo } from '@koishijs/plugin-mongo'
let app = new App({
  port: 55555,
  autoAssign: true,
  autoAuthorize: 1
})
app.plugin(mongo, {
  database: 'cyberrun',
  prefix: 'koishi'
})
app.plugin(Wechat, {
  bots: [{

  }]
})

declare module 'koishi' {
  interface User {
    inGameId: string
  }
}

Tables.extend('user', {
  inGameId: 'string'
})
const logger = new Logger('koishi-app')

app.command('list', '游戏列表')
app.middleware(async (session, next) => {
  const {inGameId} = await session.observeUser(['inGameId'])
  if(inGameId){
    logger.info('user %s answer: %s', session.userId, session.content)
  }
  return next()
})

app.command('enter <id:string>', '加入游戏')
  .example('enter 61473a925e2ab169b092b778')
  .userFields(['inGameId'])
  .action(({ session }, id) => {
    session.user.inGameId = id
    return '加入成功'
  })
app.command('exit', '退出游戏')
  .userFields(['inGameId'])
  .action(({ session }) => {
    delete session.user.inGameId
  })
app.command('rank', '查看排名')
  .userFields(['inGameId'])
  .action(({ session }) => {

  })
app.command('hint', '查看提示')
  .userFields(['inGameId'])
  .action(({ session }) => {

  })
app.start()

export default app

export const router = app.router