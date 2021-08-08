import { Button, Card, CardActions, CardContent, CardMedia, Grid, Typography, Container } from '@material-ui/core';
import React from 'react'
import useSWR from 'swr';
import type { Game } from '@cyberrun/core'
import instance from '../components/instance';
import { useHistory } from 'react-router-dom'
import Layout from '../components/layout';

const IndexPage = () => {
  const { data } = useSWR<Game[]>('/games/')
  const history = useHistory()
  const join = async (game: Game) => {
    if (game.type === "speedrun") {
      let r = await instance({
        url: `/games/${game._id.toString()}/join`,
        method: 'post'
      })
      history.push(`/level/${r.data.data}`)
    } else {
      // meta
      history.push(`/levels/${game._id.toString()}`)
    }
  }
  return <Layout>
    <Container>
      <Grid container spacing={2}>
        {data?.map(v => (
          <Grid item xs={6} sm={4}>
            <Card variant="outlined">
              <CardMedia image={v.cover} style={{ height: 140 }}></CardMedia>
              <CardContent>
                <Typography variant="h5">{v.name}</Typography>
              </CardContent>
              <CardActions>
                <Button style={{ marginLeft: 'auto' }} color="primary" variant="contained" disableElevation onClick={() => join(v)}>参加</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  </Layout>
}

export default IndexPage;