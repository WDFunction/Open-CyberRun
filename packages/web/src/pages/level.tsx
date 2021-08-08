import React, { useEffect, useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import useSWR from 'swr';
import type { Level } from '@cyberrun/core'
import { Typography, TextField, Button, Paper, Box, Grid, Container, Toolbar } from '@material-ui/core';
import instance from '../components/instance';
import { toast } from 'react-toastify';
import markdownIt from 'markdown-it'
import Layout from '../components/layout';
const md = new markdownIt()

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
  const { data: infoData, mutate: infoMutate } = useSWR<{
    data: string[]
  }>(`/levels/${id}/info`, {
    refreshInterval: 5000
  })
  const [input, setInput] = useState<string[]>([])
  const [rendered, setRendered] = useState('')
  useEffect(() => {
    if (data) {
      setRendered(md.render(data.level.content))
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
        toast.success("恭喜您通过本关")
        if (r.data.type === "speedrun") {
          history.push(`/level/${r.data.data}`)
        } else if (r.data.type === "meta") {
          history.push(`/levels/${r.data.data}`)
        }
      }
    } catch (e) {
      if (e.response.status === 403) {
        toast.error(e.response.data?.message)
        infoMutate()
      }
    }
  }

  if (!data || isValidating) {
    return <div>loading</div>
  }
  return <Layout>
    <Container>
      <Grid container spacing={2} wrap="wrap-reverse">
        <Grid item xs={12} sm={8}>
          <Paper variant="outlined">
            <Box m={2}>
              <Typography variant="h5">{data.level.title}</Typography>
              <div dangerouslySetInnerHTML={{ __html: rendered }} />
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          {(data.data.inputCount >= 1) && <Box mb={2}>
            <Paper variant="outlined">
              <Box m={2}>
                {[...Array(data.data.inputCount).keys()].map(i => (
                  <Box mb={2}>
                    <TextField variant="outlined" fullWidth label={`回答${i + 1}`} value={input[i]} onChange={(e) => {
                      const newInput = [...input]
                      newInput[i] = e.target.value
                      setInput(newInput)
                    }} />
                  </Box>
                ))}
                <Button variant="contained" color="primary" disableElevation onClick={submit}>提交</Button>
              </Box>
            </Paper>
          </Box>
          }
          <Paper variant="outlined">
            <Box m={2}>
              <Typography variant="h5">Info</Typography>
              {infoData?.data.map(v => (
                <Typography>{v}</Typography>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  </Layout >
}

export default Page