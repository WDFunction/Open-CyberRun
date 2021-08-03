import Router from '@koa/router'
import { getUser, ICustomAppState } from '../components/getUser'
import { cbr } from '../main'
import * as EmailValidator from 'email-validator';

const router = new Router<ICustomAppState>({
  prefix: '/user'
})

router.get('/', getUser(), (ctx) => {
  ctx.body = ctx.state.user
})

router.post('/init', async (ctx) => {
  // @ts-ignore
  const email = ctx.request.body.email
  if(!EmailValidator.validate(email)){
    ctx.status = 403
    ctx.body = {
      message: 'wrong email'
    }
    return
  }
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

router.post('/verify', async (ctx) => {
  const token = (ctx.request.body as Record<string, unknown>).token as string
  let result = await cbr.user.emailVerify(token)
  ctx.status = result ? 204 : 403
})

export default router