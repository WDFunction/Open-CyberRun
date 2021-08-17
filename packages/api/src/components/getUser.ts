import Koa from 'koa'
import { User } from '../../../core/dist/modules/user';
import jwt from 'jsonwebtoken'
import { cbr } from '../main'

// @TODO: import from core
const KEY = "HelloWorld"

export interface ICustomAppState {
  user?: Partial<User>
}

interface IOption {
  ignoreGuest?: boolean
  admin?: boolean
}

export const getUser: (options?: IOption) => Koa.Middleware<ICustomAppState> = (options) => {
  return async (ctx, next) => {
    let token = ctx.headers.authorization?.slice(7)
    let user = await cbr.jwt.verify(token)
    if (!user && !options?.ignoreGuest) {
      ctx.status = 401;
      return;
    }
    if (options?.admin && !user.admin) {
      ctx.status = 403
      return;
    }
    ctx.state.user = user
    return next()
  }
}