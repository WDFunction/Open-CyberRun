import { Context } from "koishi";
import type { } from '../'
import { CyberRun } from "../../../core/src";

export async function apply(ctx: Context, options: {
  cbr: CyberRun
}) {
  const { cbr } = options

  ctx
    .command('enter <id:string>', '加入游戏')
    .example('enter 61473a925e2ab169b092b778')
    .userFields(['inGameId'])
    .action(async ({ session }, id) => {
      await cbr.platform.ensureUser(session.userId)
      session.user.inGameId = id
      return '加入成功, 请发送 levels 查看关卡列表'
    })

  ctx
    .command('list', '游戏列表')
    .action(async () => {
      return await cbr.platform.games()
    })
}