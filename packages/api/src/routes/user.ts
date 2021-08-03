import Router from '@koa/router'
import { getUser, ICustomAppState } from '../components/getUser'
import { cbr } from '../main'

const router = new Router<ICustomAppState>({
  prefix: '/user'
})

router.get('/', getUser(), (ctx) => {
  ctx.body = ctx.state.user
})

router.post('/register', async (ctx) => {
  // @ts-ignore
  await cbr.user.register(ctx.request.body)
  ctx.status = 204
})

router.post('/login', async (ctx) => {
  // @ts-ignore
  let result = await cbr.user.login(ctx.request.body)
  if (result) {
    ctx.body = {
      data: result
    }
  } else {
    ctx.status = 403
    ctx.body = {
      message: '登录失败'
    }
  }
})

export default router