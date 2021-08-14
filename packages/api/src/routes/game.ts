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

router.get('/:id', async (ctx) => {
  ctx.body = await cbr.game.get(new ObjectId(ctx.params.id))
})

router.post('/:id/join', getUser(), async (ctx) => {
  let item = await cbr.game.get(new ObjectId(ctx.params.id))
  if (!item) {
    ctx.status = 404;
    return;
  }
  let level = await cbr.game.getStartLevel(item._id)
  await cbr.log.joinGame(ctx.state.user._id, item._id)
  ctx.body = {
    data: level._id
  }
})

export default router