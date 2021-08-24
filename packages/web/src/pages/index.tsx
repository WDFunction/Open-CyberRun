import { Button, Card, CardActions, CardContent, CardMedia, Grid, Typography, Container, Chip, Link, Box } from '@material-ui/core';
import React from 'react'
import useSWR from 'swr';
import type { Game } from '@cyberrun/core'
import { useHistory } from 'react-router-dom'
import Layout from '../components/layout';
import { createStyles, Theme, makeStyles } from '@material-ui/core/styles';
import { AlertCircleOutline } from 'mdi-material-ui';
import { Alert } from '@material-ui/lab';

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
          const status = v.ended! ? '已完赛' :
            (new Date().valueOf() > new Date(v.startedAt!).valueOf() ? '进行中' : '未开始')
          return (
            <Grid item xs={12} sm={4}>
              <Card variant="outlined">
                <CardMedia image={v.cover} style={{ height: 140 }}></CardMedia>
                <CardContent>
                  <Typography variant="h5">{v.name}</Typography>
                  <div className={classes.root}>
                    <Chip label={status} icon={<AlertCircleOutline />} />
                  </div>
                </CardContent>
                <CardActions>
                  <div className={classes.root} style={{ marginLeft: 'auto' }}>
                    {!error && <Button color="primary" variant="outlined" href={`/record/${v._id!.toString()}`} onClick={(e) => {
                      e.preventDefault()
                      history.push(`/record/${v._id!.toString()}`)
                    }}>个人战绩</Button>}
                    <Button style={{ marginLeft: 'auto' }} color="primary" variant="contained" disableElevation onClick={() => join(v._id!.toString())}>参加</Button>
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