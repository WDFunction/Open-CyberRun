import { Box, Button, Container, TextField, Typography } from '@material-ui/core'
import React, { useState } from 'react'
import instance from '../components/instance'
import { toast } from 'react-toastify'
import { useHistory } from 'react-router-dom'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [pwd, setPwd] = useState('')
  const history = useHistory()

  const submit = async () => {
    let r = await instance({
      url: '/user/init',
      method: 'post',
      data: {
        email, password: pwd
      }
    })
    if (r.data.status === 403) {
      toast.error(r.data.message)
    } else if (r.data.status === 201) {
      toast.success("注册成功")
    } else if (r.data.status === 200) {
      toast.success("登录成功")
    }
    if (r.data?.data) {
      localStorage.setItem("token", r.data.data)
      history.push('/')
    }

  }

  return <Container>
    <TextField fullWidth value={email} label="邮箱" variant="outlined" onChange={(e) => setEmail(e.target.value)} />
    <Box my={2}>
      <TextField fullWidth value={pwd} label="密码" variant="outlined" onChange={(e) => setPwd(e.target.value)} type="password" />
      <Typography>
        如果您的账户未注册, 将会发送带有激活链接的邮件到您的邮箱, 完成验证后才可继续CyberRun
      </Typography>
      <Button variant="outlined" color="primary" fullWidth onClick={submit}>提交</Button>
    </Box>
  </Container>
}

export default LoginPage