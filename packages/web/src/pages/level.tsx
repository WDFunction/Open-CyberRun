import React, { useEffect, useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import useSWR from 'swr';
import type { Level } from '@cyberrun/core'
import { Typography, TextField, Button } from '@material-ui/core';
import instance from '../components/instance';
import { toast } from 'react-toastify';

const Page = () => {
  const { id } = useParams<{ id: string }>();
  const history = useHistory()
  const { data, isValidating } = useSWR<{
    level: Level
    data: {
      inputCount: number
      isGuest: boolean
    }
  }>(`/levels/${id}`)
  const [input, setInput] = useState<string[]>([])
  useEffect(() => {
    if (data) {

      setInput([...Array(data.data.inputCount).keys()].map(v => ''))
    }
  }, [data])

  const submit = async () => {
    try {
      let r = await instance({
        url: `/levels/${id}/submit`,
        method: 'post',
        data: {
          answers: input
        }
      })
      if (r.status === 200) {
        history.push(`/level/${r.data.data}`)
      }
    } catch (e) {
      if (e.response.status === 403) {
        toast.error(e.response.data?.message)
      }
    }
  }

  if (!data || isValidating) {
    return <div>loading</div>
  }
  return <div>
    <Typography variant="h5">{data.level.title}</Typography>
    <Typography>{data.level.content}</Typography>
    <div>
      {[...Array(data.data.inputCount).keys()].map(i => (
        <TextField fullWidth label="输入回答" value={input[i]} onChange={(e) => {
          const newInput = [...input]
          newInput[i] = e.target.value
          setInput(newInput)
        }} />
      ))}
    </div>
    <Button onClick={submit}>提交</Button>
  </div>
}

export default Page