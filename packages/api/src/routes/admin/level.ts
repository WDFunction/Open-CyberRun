import Router from "@koa/router"
import { cbr } from "../../main"
import { getUser, ICustomAppState } from "../../components/getUser"
import { ObjectId } from 'mongodb'
const router = new Router<ICustomAppState>({
  prefix: '/admin/levels'
})

router.post('/', async (ctx) => {
  // @ts-ignore
  let gameId = new ObjectId(ctx.request.body.gameId)
  // @ts-ignore
  let id = await cbr.level.adminAdd({...ctx.request.body, gameId})
  ctx.body = id
})

router.delete('/:id', async (ctx) => {
  await cbr.level.levelCol.deleteOne({_id: new ObjectId(ctx.params.id)})
  ctx.status = 204
})


export default router