import Router from "@koa/router"
import { cbr } from "../../main"
import { getUser, ICustomAppState } from "../../components/getUser"
import { ObjectId } from 'mongodb'
const router = new Router<ICustomAppState>({
  prefix: '/admin/logs'
})

router.get('/:id', async (ctx) => {
  let id = new ObjectId(ctx.params.id)
  ctx.body = await cbr.log.adminGetWithUsers(id)
})

export default router