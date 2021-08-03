import { Button, Card, CardContent, Grid, Typography } from '@material-ui/core';
import React from 'react'
import useSWR from 'swr';
import type { Game } from '@cyberrun/core'
import instance from '../components/instance';
import { useHistory } from 'react-router-dom'

const IndexPage = () => {
  const { data } = useSWR<Game[]>('/games/')
  const history = useHistory()
  const join = async (gameId: string) => {
    let r = await instance({
      url: `/games/${gameId}/join`,
      method: 'post'
    })
    history.push(`/level/${r.data.data}`)
  }
  return <div>
    <Grid container>
      {data?.map(v => (
        <Grid item>
          <Card>
            <CardContent>
              <Typography>{v.name}</Typography>
              <Typography>{v._id}</Typography>
            </CardContent>
            <CardContent>
              <Button color="primary" variant="contained" disableElevation onClick={() => join(v._id)}>参加</Button>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>

  </div>
}

export default IndexPage;