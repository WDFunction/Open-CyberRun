import { Command, Context, Logger } from "koishi";
import type { } from '../'
import { CyberRun } from "@cyberrun/core";

export async function apply(ctx: Context, options: {
  cbr: CyberRun
}) {
  const logger = new Logger('koishi-ingame')
  const { cbr } = options

  ctx.command('levels', '查看关卡列表')
    .userFields(['inGameId'])
    .action(async ({ session }) => {
      let [str, levels] = await cbr.platform.getGameLevels(session.userId, session.user.inGameId)
      // if(levels.length === 1){
      //  await session.execute(`level ${levels[0]._id.toString()}`)
      //}else{
      return str;
      //}
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
    .alias('info')
    .userFields(['inLevelId'])
    .action(async ({ session }) => {
      return await cbr.platform.info(session.userId, session.user.inLevelId)
    })

  ctx.command('level <id:string>', '查看关卡')
    .userFields(['inLevelId'])
    .action(async ({ session }, id) => {
      let [succeed, levelId, text] = await cbr.platform.getLevel(session.userId, id)
      if (succeed) {
        session.user.inLevelId = levelId.toString()
      }
      return text
    })
}