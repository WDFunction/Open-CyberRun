import Router from '@koa/router'
import { getUser, ICustomAppState } from '../components/getUser'
import { cbr } from '../main'

const router = new Router<ICustomAppState>({
  prefix: '/user'
})

router.get('/', getUser(), (ctx) => {
  ctx.body = ctx.state.user
})

router.post('/init', async (ctx) => {
  // @ts-ignore
  const [whetherNewUser, result] = await cbr.user.init(ctx.request.body)
  if (result) {
    ctx.status = whetherNewUser ? 201 : 200
    ctx.body = {
      data: result
    }
  } else {
    ctx.status = 403
    ctx.body = {
      message: '失败'
    }
  }
})

export default router