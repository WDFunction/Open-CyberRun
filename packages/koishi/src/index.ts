import { App, Command, Logger, Tables, User } from 'koishi'
import Wechat from '@koishijs/plugin-wechat'
import { apply as mongo } from '@koishijs/plugin-mongo'
import { CyberRun } from '@cyberrun/core'
import { apply as guest } from './plugins/guest'
import { apply as ingame } from './plugins/ingame'
declare module 'koishi' {
  interface User {
    inGameId: string
    inLevelId: string
  }
}

Tables.extend('user', {
  inGameId: 'string',
  inLevelId: 'string'
})

export default async function initKoishi(cbr: CyberRun) {
  let app = new App({
    port: 55555,
    autoAssign: true,
    autoAuthorize: 1
  })
  
  const logger = new Logger('koishi')
  app.plugin(mongo, {
    uri: (await cbr.config.get()).mongodb.connection,
    prefix: 'koishi'
  })
  app.plugin(Wechat, {
    bots: [{

    }]
  })

  app.before('attach-user', (_, fields) => fields.add('inGameId'))

  // @ts-ignore
  app.intersect(s => !s.user?.inGameId).plugin(guest, { cbr })
  
  // @ts-ignore
  app.intersect(s => s.user?.inGameId).plugin(ingame, { cbr })

  app.middleware(async (session, next) => {
    const { inGameId, inLevelId } = await session.observeUser(['inGameId', 'inLevelId'])

    if (inGameId) {
    logger.info('user %s answer: %s, game: %s, level: %s', session.userId, session.content, inGameId, inLevelId)
      let answers = session.content.split(" ")
      try {
        let [game, level] = await cbr.platform.verifyAnswer(session.userId, inLevelId, answers)
        if(level){
          logger.info('user %s passed, new level: %s', session.userId, level._id)
          return await session.execute(`level ${level._id}`)
        }
      } catch (e) {
        return session.send(e.message)
      }
      return
    }
    return next()
  })

  app.start()
  return app
}