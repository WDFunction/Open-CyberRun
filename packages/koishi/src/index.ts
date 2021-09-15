import {App} from 'koishi'
import Wechat from '@koishijs/plugin-wechat'

let app = new App()
app.plugin(Wechat, {
  bots: [{
    
  }]
})
app.start()

export default app