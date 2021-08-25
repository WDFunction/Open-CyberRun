import Router from "@koa/router"
import { cbr } from "../../main"
import { getUser, ICustomAppState } from "../../components/getUser"
import { ObjectId } from 'mongodb'
const router = new Router<ICustomAppState>({
  prefix: '/admin/logs'
})

router.use(getUser({ admin: true }))

router.get('/:id', async (ctx) => {
  let id = new ObjectId(ctx.params.id)
  let page = ~~ctx.query.page ?? 0
  let levels = await cbr.level.levelCol.find({ gameId: id }).toArray();
  ctx.body = {
    count: await cbr.log.col.count({
      gameId: id
    }),
    data: await cbr.log.adminGetWithUsers(id, page * 20),
    levels
  }
})

export default router