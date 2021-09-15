import { App } from 'koishi'
import Wechat from '@koishijs/plugin-wechat'

let app = new App({
  port: 55555
})
app.plugin(Wechat, {
  bots: [{

  }]
})
app.start()
console.log(app.router)

export default app

export const router = app.router