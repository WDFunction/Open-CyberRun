import Router from "@koa/router"
import { cbr } from "../../main"
import { getUser, ICustomAppState } from "../../components/getUser"
import { ObjectId } from 'mongodb'
const router = new Router<ICustomAppState>({
  prefix: '/admin/games'
})

router.get('/:id/maps', async (ctx) => {
  const [levels, maps] = await cbr.level.adminGetMaps(new ObjectId(ctx.params.id))
  ctx.body = {
    levels, maps
  }
})

router.post('/:id/maps/:levelId/mapPoint', async (ctx) => {
  // @ts-ignore
  await cbr.level.adminUpdateLevelPoint(new ObjectId(ctx.params.levelId), ctx.request.body)
  ctx.status = 204
})

export default router