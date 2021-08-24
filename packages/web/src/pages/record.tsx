import React from 'react'
import useSWR from 'swr'
import Layout from '../components/layout'
import { useParams, useHistory } from 'react-router-dom'
import { Alert, AlertTitle } from '@material-ui/lab'
import type { Game, Level, Log, Point } from '@cyberrun/core'
import { Typography, Container, Box, Button } from '@material-ui/core'
const Page = () => {
  const { id } = useParams<{ id: string }>()
  const history = useHistory()
  const { data } = useSWR<{
    game: Partial<Game>
    logs: Partial<Log>[]
    levels: Partial<Level>[]
    points?: Partial<Point>[]
  }>(`/games/${id}/record`)
  if (!data) {
    return <Layout><Typography>Loading</Typography></Layout>
  }
  return <Layout>
    <Container>
      <Typography variant="h4">{data.game.name}</Typography>
      {data.logs.map(v => (
        <Box mb={2}>
          <Alert severity="success" action={
            <Button color="inherit" size="small" href={`/level/${v.levelId}`} onClick={(e) => {
              e.preventDefault()
              history.push(`/level/${v.levelId}`)
            }}>复习</Button>
          }>
            <AlertTitle>{data.levels.find(l => l._id === v.levelId)?.title}</AlertTitle>
            {new Date(v.createdAt!.toString()).toLocaleString()}
          </Alert>
        </Box>
      ))}
      <Typography variant="h4">比赛积分</Typography>
      {data.points?.length === 0 || !data.points ? <Typography>未结算</Typography> : data.points?.map(v => (
        <Typography>{v.type === 'finish' ? '完赛得分' : '奖励得分'} {v.value}</Typography>
      ))}
    </Container>
  </Layout>
}

export default Page