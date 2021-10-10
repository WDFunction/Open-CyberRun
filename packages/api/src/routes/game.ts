import Router from "@koa/router"
import { cbr } from "../main"
import { getUser, ICustomAppState } from "../components/getUser"
import { ObjectId } from 'mongodb'
import type { User } from "@cyberrun/core"
const router = new Router<ICustomAppState>({
  prefix: '/games'
})

router.get('/', getUser({ ignoreGuest: true }), async (ctx) => {
  let r = await cbr.game.list(ctx.state.user?.admin ?? false)
  ctx.body = r
})

router.get('/:id', getUser({ ignoreGuest: true }), async (ctx) => {
  ctx.body = await cbr.game.get(new ObjectId(ctx.params.id), ctx.state.user?.admin)
})

router.get('/:id/admin/stats', getUser({ admin: true }), async (ctx) => {
  ctx.body = await cbr.game.adminStats(new ObjectId(ctx.params.id))
})

router.get('/:id/record', getUser(), async (ctx) => {
  ctx.body = await cbr.user.record(new ObjectId(ctx.params.id), ctx.state.user as User)
})

export default router