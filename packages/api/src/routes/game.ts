import Router from "@koa/router"
import { cbr } from "../main"
import { ICustomAppState } from "../components/getUser"

const router = new Router<ICustomAppState>({
  prefix: '/games'
})

router.get('/', async (ctx) => {
  let r = await cbr.game.list()
  ctx.body = r
})

export default router