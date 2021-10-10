import Router from "@koa/router"
import { cbr } from "../../main"
import { getUser, ICustomAppState } from "../../components/getUser"
import { ObjectId } from 'mongodb'
const router = new Router<ICustomAppState>({
  prefix: '/admin/games'
})

router.use(getUser({ admin: true }))

router.post('/', async (ctx) => {
  await cbr.game.adminNew()
  ctx.status = 204
})

router.get('/', async (ctx) => {
  ctx.body = await cbr.game.col.find({}).sort({ id: -1 }).toArray()
})


router.get('/:id/maps', async (ctx) => {
  const [levels, maps] = await cbr.level.adminGetMaps(new ObjectId(ctx.params.id))
  ctx.body = {
    levels, maps
  }
})

router.get('/:id', async (ctx) => {
  ctx.body = await cbr.game.col.findOne({
    _id: new ObjectId(ctx.params.id)
  })
})

router.delete('/:id', async (ctx) => {
  await cbr.game.adminDelete(new ObjectId(ctx.params.id))
  ctx.status = 204
})


router.post('/:id/maps/:levelId/mapPoint', async (ctx) => {
  // @ts-ignore
  await cbr.level.adminUpdateLevelPoint(new ObjectId(ctx.params.levelId), ctx.request.body)
  ctx.status = 204
})

router.post('/:id/maps', async (ctx) => {
  // @ts-ignore
  const body: Record<string, string> = ctx.request.body
  let id = await cbr.level.adminAddMap({
    gameId: new ObjectId(ctx.params.id),
    fromLevelId: new ObjectId(body.fromLevelId),
    toLevelId: new ObjectId(body.toLevelId)
  })
  ctx.body = id
})

router.post('/:id/patch', async (ctx) => {
  // @ts-ignore
  await cbr.game.adminUpdate(new ObjectId(ctx.params.id), ctx.request.body)
  ctx.status = 204
})

router.get('/any/maps/:id', async (ctx) => {
  ctx.body = await cbr.level.stringifyMap(new ObjectId(ctx.params.id))
})

router.post('/any/maps/:id', async (ctx) => {
  try {
    await cbr.level.adminUpdateMap(new ObjectId(ctx.params.id), ctx.request.body as unknown as string[])
  } catch (e) {

  }
  ctx.status = 204
})

router.get('/:id/point', async (ctx) => {
  ctx.body = await cbr.point.adminList(new ObjectId(ctx.params.id))
})

router.post('/:id/point/reload', async (ctx) => {
  let game = await cbr.game.col.findOne({
    _id: new ObjectId(ctx.params.id)
  })
  await cbr.point.checkoutGame(game)
  ctx.status = 204
})

export default router