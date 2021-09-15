import Koa, { Context } from 'koa'
import userRoute from './routes/user'
import gameRoute from './routes/game'
import levelRoute from './routes/level'
import adminLogRoute from './routes/admin/logs'
import adminGameRoute from './routes/admin/game'
import adminLevelRoute from './routes/admin/level'
import bodyParser from 'koa-bodyparser'
import { CyberRun, Logger } from '@cyberrun/core'
import cors from '@koa/cors'
// import {apply as wechatRoute} from '@cyberrun/adapter-wechat'
require('source-map-support').install()
export const cbr = new CyberRun()
const app = new Koa()
app.use(bodyParser({
  enableTypes: ['json', 'form', 'xml']
}))
app.use(cors())

const logger = new Logger('api')

app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    ctx.status = err.status || 500;
    ctx.body = err.message;
    ctx.app.emit('error', err, ctx);
  }
});

async function start() {
  await cbr.start()
  app.use(cbr.koishiRouter.routes()).use(cbr.koishiRouter.allowedMethods())
  app.use(gameRoute.routes()).use(gameRoute.allowedMethods())
  app.use(userRoute.routes()).use(userRoute.allowedMethods())
  app.use(adminGameRoute.routes()).use(adminGameRoute.allowedMethods())
  app.use(adminLevelRoute.routes())
  app.use(levelRoute.routes())
  app.use(adminLogRoute.routes())
  // const r = await wechatRoute(cbr)
  // app.use(r.routes())

  app.on('error', (err, ctx: Context) => {
    logger.error('%s %s, user:', ctx.method, ctx.path, ctx.state?.user?._id.toString())
    logger.error(err.stack)
    ctx.status = 500
    ctx.body = {
      message: err.toString(),
      stack: err.stack
    }
  })

  app.listen(54000)
}

start()