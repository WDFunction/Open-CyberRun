import axios from 'axios'
import { CyberRun } from '@cyberrun/core'

export async function getAccessToken(cbr: CyberRun, appid: string, secret: string): Promise<{
  access_token: string;
  expires_in: number
}>{
  const c = await cbr.config.get()
  let r = await axios({
    url: 'https://api.weixin.qq.com/cgi-bin/token',
    params: {
      grant_type:"client_credential",
      appid: c.weixin.appid,
      secret: c.weixin.secret
    }
  })
  return r.data
}