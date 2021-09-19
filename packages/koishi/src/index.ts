import { App, Command, Logger, Tables, User } from 'koishi'
import Wechat from '@koishijs/plugin-wechat'
import { apply as mongo } from '@koishijs/plugin-mongo'
import { CyberRun } from '@cyberrun/core'

declare module 'koishi' {
  interface User {
    inGameId: string
  }
}

Tables.extend('user', {
  inGameId: 'string'
})

export default async function initKoishi(cbr: CyberRun) {
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

  const logger = new Logger('koishi-app')

  app.command('list', '游戏列表')
    .action(async () => {
      return await cbr.platform.games()
    })
  app.middleware(async (session, next) => {
    const { inGameId } = await session.observeUser(['inGameId'])
    if (inGameId) {
      logger.info('user %s answer: %s', session.userId, session.content)
    }
    return next()
  })

  app.command('levels', '查看关卡列表')
    .userFields(['inGameId'])
    .action(async ({ session }) => {
      return await cbr.platform.getGameLevels(session.userId, session.user.inGameId)
    })

  app.command('enter <id:string>', '加入游戏')
    .example('enter 61473a925e2ab169b092b778')
    .userFields(['inGameId'])
    .action(async ({ session }, id) => {
      await cbr.platform.ensureUser(session.userId)
      session.user.inGameId = id
      return '加入成功, 请发送 levels 查看关卡列表'
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
  return app
}