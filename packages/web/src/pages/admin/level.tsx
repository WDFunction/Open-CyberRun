import React, { useEffect, useState } from 'react'
import AdminLayout from './layout'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import { Box, Button, TextField } from '@material-ui/core'
import type { Level } from '@cyberrun/core'
import instance from '../../components/instance'
import { toast } from 'react-toastify'
const LevelPage = () => {
  const { id, levelId } = useParams<{
    id: string;
    levelId: string
  }>()
  const { data } = useSWR<Level>(`/admin/levels/${levelId}`)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const save = async () => {
    await instance({
      url: `/admin/levels/${levelId}/patch`,
      data: { title, content },
      method: 'post'
    })
    toast.success("保存成功")
  }
  useEffect(() => {
    if (data) {
      setTitle(data.title)
      setContent(data.content)
    }
  }, [data])
  return <AdminLayout>
    <TextField variant="outlined" color="primary" label="标题" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} />

    <Box mt={2}>
      <TextField variant="outlined" color="primary" label={"内容(markdown)"} multiline fullWidth value={content} onChange={(e) => setContent(e.target.value)} />
    </Box>
    <Button onClick={save} color="primary" variant="contained">保存</Button>
  </AdminLayout>
}

export default LevelPage