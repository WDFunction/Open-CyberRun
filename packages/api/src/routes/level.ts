import Router from "@koa/router"
import { cbr } from "../main"
import { getUser, ICustomAppState } from "../components/getUser"
import { ObjectId } from 'mongodb'
const router = new Router<ICustomAppState>({
  prefix: '/levels'
})

router.get('/meta/:gameId', async (ctx) => {
  let gameId = new ObjectId(ctx.params.gameId)
  let levels = await cbr.level.getMetaGameLevels(gameId)
  ctx.body = levels
})

router.get('/:id', getUser({ ignoreGuest: true }), async (ctx) => {
  let id = new ObjectId(ctx.params.id)
  let level = await cbr.level.get(id)
  let data = {
    isGuest: ctx.state.user === null,
    inputCount: await cbr.level.getLevelMaxAnswersCount(id)
  }
  ctx.body = {
    level,
    data
  }
})

router.post('/:id/submit', getUser(), async (ctx) => {
  if (!ctx.state.user) {
    ctx.status = 401
    return;
  }
  const answers = ((ctx.request.body as Record<string, unknown>).answers as any[]).map(v => v.toString())
  try {
    let [game, level] = await cbr.level.verifyAnswer(new ObjectId(ctx.params.id as string), answers, ctx.state.user._id)
    if (game.type === "speedrun") {
      ctx.body = {
        type: game.type,
        data: level._id
      }
    } else {
      ctx.body = {
        type: game.type,
        data: game._id
      }
    }
  } catch (e) {
    ctx.status = 403
    ctx.body = {
      message: e.message
    }
  }
})

export default router