import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import instance from '../components/instance'

const Page = () => {
  const params = useParams<{ token: string }>()
  useEffect(() => {
    instance({
      url: '/user/verify',
      method: 'post',
      data: { token: params.token }
    }).then(res => {
      if (res.status === 204) {
        toast.success("验证成功")
      }
    })
  }, [params.token])
  return <div></div>
}

export default Page