import { Context } from "koishi";
import type { } from '../'
import { CyberRun } from "@cyberrun/core";
import {v4} from 'uuid'
export async function apply(ctx: Context, options: {
  cbr: CyberRun
}) {
  ctx.command('bind')
  .action(async ({session}) => {
    let u = await options.cbr.platform.ensureUser(session?.userId!)
    const token = v4()
    await options.cbr.platform.updateUserToken(u._id, token)
    return token
  })
}