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
  app.plugin(mongo, {
    database: 'cyberrun',
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

  app.start()
  return app
}