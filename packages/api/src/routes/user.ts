import Router from '@koa/router'
import { cbr } from '../main'

const router = new Router({
  prefix: '/user'
})

router.get('/', (ctx) => {
  ctx.body = {

  }
})

router.post('/register', async (ctx) => {
  // @ts-ignore
  await cbr.user.register(ctx.request.body)
  ctx.status = 204
})

export default router