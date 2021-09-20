import { Command, Context, Logger } from "koishi";
import type { } from '../'
import { CyberRun } from "../../../core/src";

export async function apply(ctx: Context, options: {
  cbr: CyberRun
}) {
  const logger = new Logger('koishi-ingame')
  const { cbr } = options

  ctx.middleware(async (session, next) => {
    const { inGameId, inLevelId } = await session.observeUser(['inGameId', 'inLevelId'])

    logger.info('user %s answer: %s, data: %s, %s', session.userId, session.content, inGameId, inLevelId)
    if (inGameId) {
      let answers = session.content.split(" ")
      try {
        let [game, level] = await cbr.platform.verifyAnswer(session.userId, inLevelId, answers)
        console.log(game, level)
      } catch (e) {
        logger.warn('user err: %o', e)
      }
    }
    return next()
  })

  ctx.command('levels', '查看关卡列表')
    .userFields(['inGameId'])
    .action(async ({ session }) => {
      return await cbr.platform.getGameLevels(session.userId, session.user.inGameId)
    })

  ctx
    .command('exit', '退出游戏')
    .userFields(['inGameId'])
    .action(({ session }) => {
      session.user.inGameId = undefined
      return '您已退出当前比赛'
    })
  ctx
    .command('rank', '查看排名')
    .userFields(['inGameId'])
    .action(({ session }) => {

    })
  ctx
    .command('hint', '查看提示')
    .userFields(['inGameId'])
    .action(({ session }) => {

    })

  ctx.command('level <id:string>', '查看关卡')
    .userFields(['inLevelId'])
    .action(async ({ session }, id) => {
      let [succeed, text] = await cbr.platform.getLevel(session.userId, id)
      if (succeed) {
        session.user.inLevelId = id
      }
      return text
    })
}