import { Button, Card, CardActions, CardContent, CardMedia, Grid, Typography, Container, Chip, Link, Box } from '@material-ui/core';
import React, { useState } from 'react'
import useSWR from 'swr';
import type { Game } from '@cyberrun/core'
import { useHistory } from 'react-router-dom'
import Layout from '../components/layout';
import { createStyles, Theme, makeStyles } from '@material-ui/core/styles';
import { AlertCircleOutline } from 'mdi-material-ui';
import { Alert } from '@material-ui/lab';
import useInterval from '../components/useInterval';
import { intervalToDuration, formatDistance } from 'date-fns';
import { zhCN } from 'date-fns/locale';
const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      justifyContent: 'center',
      flexWrap: 'wrap',
      '& > *': {
        margin: theme.spacing(0.5),
      },
    },
    notStartContainer: {
      position: 'absolute', width: '100%', height: '100%', background: 'rgba(0,0,0,.4)', display: 'flex', justifyContent: 'center', alignItems: 'center'
    }
  }),
);

const IndexPage = () => {
  const { data } = useSWR<Partial<Game>[]>('/games/')
  const { data: userData, error } = useSWR('/user/', {
    shouldRetryOnError: false
  })
  const history = useHistory()
  const join = async (gameId: string) => {
    history.push(`/levels/${gameId}`)
  }
  const classes = useStyles();
  const [date, setDate] = useState(new Date())
  useInterval(() => {
    setDate(new Date())
  }, 500)
  return <Layout>
    <Container>
      {error && (
        <Box mb={2}>
          <Alert severity="warning"><Link href="/login" onClick={(e) => {
            e.preventDefault()
            history.push('/login')
          }}>登录</Link>后获得完整游戏体验</Alert>
        </Box>
      )}
      <Grid container spacing={2}>
        {data?.map(v => {
          const startedAt = new Date(v.startedAt!).valueOf()
          const started = date.valueOf() > startedAt
          const status = v.ended! ? '已完赛' :
            (started ? '进行中' : '未开始')
          const remain = Math.floor((startedAt - date.valueOf()) / 1000)
          const duration = intervalToDuration({ start: new Date().valueOf(), end: startedAt })
          const formatted = formatDistance(new Date().valueOf(), startedAt, { includeSeconds: true, locale: zhCN })
          return (
            <Grid item xs={12} sm={4}>
              <Card variant="outlined">
                <CardMedia image={v.cover} style={{ height: 140, position: 'relative' }}>
                  {!started && (
                    <div className={classes.notStartContainer}>
                      <Typography variant="h4" style={{ color: 'white' }}>{formatted}</Typography>
                    </div>
                  )}
                </CardMedia>
                <CardContent>
                  <Typography variant="h5">{v.name}</Typography>
                  <div className={classes.root}>
                    <Chip label={status} icon={<AlertCircleOutline />} />
                  </div>
                </CardContent>
                <CardActions>
                  <div className={classes.root} style={{ marginLeft: 'auto' }}>
                    {!error && started && <Button color="primary" variant="outlined" href={`/record/${v._id!.toString()}`} onClick={(e) => {
                      e.preventDefault()
                      history.push(`/record/${v._id!.toString()}`)
                    }}>个人战绩</Button>}
                    {started && <Button style={{ marginLeft: 'auto' }} color="primary" variant="contained" disableElevation onClick={() => join(v._id!.toString())}>参加</Button>}
                  </div>
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  </Layout>
}

export default IndexPage;