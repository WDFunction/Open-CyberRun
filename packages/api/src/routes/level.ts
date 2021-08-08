import Router from "@koa/router"
import { cbr } from "../main"
import { getUser, ICustomAppState } from "../components/getUser"
import { ObjectId } from 'mongodb'
const router = new Router<ICustomAppState>({
  prefix: '/levels'
})

router.get('/meta/:gameId', getUser({ ignoreGuest: true }), async (ctx) => {
  let gameId = new ObjectId(ctx.params.gameId)
  let levels = await cbr.level.getMetaGameLevels(gameId)
  let passed = {}
  if (ctx.state.user) {
    passed = await cbr.level.checkUserPassed(ctx.state.user._id, levels.map(v => v._id))
  }
  ctx.body = {
    levels,
    passed
  }
})

router.get('/:id', getUser({ ignoreGuest: true }), async (ctx) => {
  let id = new ObjectId(ctx.params.id)
  let level = await cbr.level.get(id)
  if (!level) {
    return ctx.status = 404
  }
  let userId = ctx.state.user ? ctx.state.user._id : new ObjectId()
  let can: boolean;
  if (level.type === "meta") {
    can = await cbr.game.canAccessMeta(userId, level.gameId)

  } else {
    can = await cbr.game.canAccessLevel(userId, level.gameId, id)
  }
  if (!can) {
    ctx.status = 403
    ctx.body = {
      message: "你不配"
    }
    return;
  }
  let data = {
    isGuest: ctx.state.user === null,
    inputCount: await cbr.level.getLevelMaxAnswersCount(id)
  }
  ctx.body = {
    level,
    data
  }
})

router.get('/:id/info', getUser({ignoreGuest: true}), async (ctx) => {
  let id = new ObjectId(ctx.params.id)
  let level = await cbr.level.get(id)
  let info = await cbr.game.info(level, ctx.state.user?._id)
  ctx.body = {
    data: info
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