import Router from "@koa/router"
import { cbr } from "../../main"
import { getUser, ICustomAppState } from "../../components/getUser"
import { ObjectId } from 'mongodb'
const router = new Router<ICustomAppState>({
  prefix: '/admin/levels'
})

router.get('/:id', async (ctx) => {
  ctx.body = await cbr.level.adminGet(new ObjectId(ctx.params.id))
})

router.post('/', async (ctx) => {
  // @ts-ignore
  let gameId = new ObjectId(ctx.request.body.gameId)
  // @ts-ignore
  let id = await cbr.level.adminAdd({...ctx.request.body, gameId})
  ctx.body = id
})

router.post('/:id/patch', async (ctx) => {
  // @ts-ignore
  await cbr.level.adminUpdate(new ObjectId(ctx.params.id), ctx.request.body)
  ctx.status = 204
})

router.delete('/:id', async (ctx) => {
  await cbr.level.adminDelete(new ObjectId(ctx.params.id))
 
  ctx.status = 204
})


export default router