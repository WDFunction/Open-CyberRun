import Koa from 'koa'
import userRoute from './routes/user'
import gameRoute from './routes/game'
import levelRoute from './routes/level'
import adminLogRoute from './routes/admin/logs'
import bodyParser from 'koa-bodyparser'
import { CyberRun } from '@cyberrun/core'
import cors from '@koa/cors'
export const cbr = new CyberRun()
const app = new Koa()
app.use(bodyParser())
app.use(cors())

async function start() {
  await cbr.start()
  app.use(gameRoute.routes()).use(gameRoute.allowedMethods())
  app.use(userRoute.routes()).use(userRoute.allowedMethods())
  app.use(levelRoute.routes())
  app.use(adminLogRoute.routes())
  app.listen(54000)
  console.log('started')
}

start()