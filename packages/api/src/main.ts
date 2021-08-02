import Koa from 'koa'
import userRoute from './routes/user'
import bodyParser from 'koa-bodyparser'
import { CyberRun } from '@cyberrun/core'
export const cbr = new CyberRun()
const app = new Koa()
app.use(bodyParser())

async function start() {
  await cbr.start()
  app.use(userRoute.routes()).use(userRoute.allowedMethods())

  app.listen(54000)
  console.log('started')
}

start()