import Router from "@koa/router"
import { cbr } from "../main"
import { getUser, ICustomAppState } from "../components/getUser"
import { ObjectId } from 'mongodb'
const router = new Router<ICustomAppState>({
  prefix: '/games'
})

router.get('/', async (ctx) => {
  let r = await cbr.game.list()
  ctx.body = r
})

router.get('/:id', getUser({ ignoreGuest: true }), async (ctx) => {
  ctx.body = await cbr.game.get(new ObjectId(ctx.params.id))
})

router.get('/:id/admin/stats', getUser({ admin: true }), async (ctx) => {
  ctx.body = await cbr.game.adminStats(new ObjectId(ctx.params.id))
})

router.get('/:id/record', getUser(), async (ctx) => {
  ctx.body = await cbr.user.record(new ObjectId(ctx.params.id), ctx.state.user._id)
})

export default router