import type { User } from '@cyberrun/core'
import { Button, Card, CardActions, CardContent, Container, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField, Typography } from '@material-ui/core'
import React, { useState, useEffect } from 'react'
import useSWR from 'swr'
import Layout from '../components/layout'
import instance from '../components/instance'

const Page = () => {
  const { data, error } = useSWR<User>('/user/', {
    shouldRetryOnError: false
  })
  const [token, setToken] = useState('')
  const [selected, setSelected] = useState('web')

  const bind = async () => {
    instance({
      url: '/user/bind',
      method: 'post',
      data: { token, selected }
    })
  }
  useEffect(() => {

  }, [])

  if (error || !data) {
    return <Layout>
      <Typography variant="h2">您未登录</Typography>
    </Layout>
  }
  return <Layout>
    <Container>
      <Typography variant="h2">您好, {data.username}</Typography>
      {/* <Card variant="outlined">
        <CardContent>
          <Typography variant="h5">修改密码</Typography>
        </CardContent>
        <CardActions>
          <Button variant="contained">保存</Button>
        </CardActions>
      </Card>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5">修改邮箱</Typography>
        </CardContent>
        <CardActions>
          <Button variant="contained">保存</Button>
        </CardActions>
      </Card> */}
      <Card variant="outlined">
        <CardContent>
          <Typography variant="h5">微信绑定</Typography>
          <Typography>进行绑定操作时, 我们将决策网页端与微信端数据的内容并对其合并，合并完成后将删除微信端账号</Typography>

          <Typography>在微信公众号发送bind, 获取验证码</Typography>
          <TextField fullWidth label="验证码" variant="outlined" value={token} onChange={(e) => setToken(e.target.value)} />
          <FormControl component="fieldset">
            <FormLabel component="legend">选择保留数据的平台</FormLabel>
            <RadioGroup row value={selected} onChange={(e) => setSelected(e.target.value)}>
              <FormControlLabel control={<Radio />} label="网页" value="web" />
              <FormControlLabel control={<Radio />} label="微信" value="wechat" />
            </RadioGroup>
          </FormControl>
        </CardContent>
        <CardActions>
          <Button variant="outlined" color="primary" onClick={bind}>保存</Button>
        </CardActions>
      </Card>
    </Container>
  </Layout>
}

export default Page