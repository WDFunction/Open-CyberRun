import React, { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminLayout from './layout'
import type { Game } from '@cyberrun/core'
import { createStyles, makeStyles } from '@mui/styles';

import { Paper, TableHead, TableCell, TableBody, Table, TableRow, Container, IconButton, Collapse, Typography, Box, Button, Grid, TextField, FormControl, FormControlLabel, Radio, FormLabel, RadioGroup, Switch, Theme } from '@mui/material'
import { ChevronUp, ChevronDown } from 'mdi-material-ui'

import { DateTimePicker } from "@mui/lab";
import instance from '../../components/instance';
import { toast } from 'react-toastify';
const useStyles = makeStyles({
  table: {
    minWidth: 350,
  },
});

const useRowStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      '& > *': {
        borderBottom: 'unset',
      },
    },
    form: {
      '& .MuiTextField-root': {
        margin: theme.spacing(1)
      },
    }
  }),
);


const Row: React.FunctionComponent<{
  game: Game
  mutate: () => any
}> = ({ game, mutate }) => {
  const [open, setOpen] = React.useState(false);
  const classes = useRowStyles();

  const [started, setStarted] = useState(new Date())
  const [ended, setEnded] = useState(new Date())
  const [map, setMap] = useState('')
  const [cover, setCover] = useState('')
  const [difficulty, setDifficulty] = useState('5')
  const [submitCount, setSubmitCount] = useState('5');
  const [type, setType] = useState('speedrun')
  const [name, setName] = useState('')
  const [alias, setAlias] = useState('')
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (game) {
      setName(game.name)
      setStarted(new Date(game.startedAt))
      setEnded(new Date(game.endedAt))
      setMap(game.map)
      setCover(game.cover)
      setDifficulty(game.difficulty?.toString() ?? '')
      setSubmitCount(game.submitCount?.toString() ?? '')
      setType(game.type)
      setAlias(game.alias?.toString() ?? '')
      setHidden(game.hidden)
    }
  }, [game])

  const save = async () => {
    await instance({
      url: `/admin/games/${game._id.toString()}/patch`,
      method: 'post',
      data: {
        startedAt: started.toISOString(), endedAt: ended.toISOString(),
        map, cover, type, difficulty: difficulty ? Number(difficulty) : undefined, name,
        submitCount: submitCount ? Number(submitCount) : undefined, alias, hidden
      }
    })
    toast.success("保存成功")
    mutate()
  }

  const del = async () => {
    await instance({
      url: `/admin/games/${game._id.toString()}`,
      method: 'delete'
    })
    mutate()
  }

  return <>
    <TableRow className={classes.root}>
      <TableCell>
        <IconButton size="small" onClick={() => setOpen(!open)}>
          {open ? <ChevronUp /> : <ChevronDown />}
        </IconButton>
      </TableCell>
      <TableCell>{game.name}</TableCell>
      <TableCell align="right">{game.type}</TableCell>
      <TableCell align="right">{new Date(game.startedAt).toLocaleString()}</TableCell>
      <TableCell align="right">{new Date(game.endedAt).toLocaleString()}</TableCell>
    </TableRow>
    <TableRow>
      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <Box margin={1}>
            <Typography variant="h6" gutterBottom component="div">
              编辑 <Button color="secondary" variant="contained" onClick={del}>删除</Button>
            </Typography>
            <form className={classes.form} onSubmit={(e) => {
              e.preventDefault()
              save()
            }}>
              <Grid container spacing={2} style={{ marginBottom: 16 }}>
                <Grid item xs>
                  <DateTimePicker
                    renderInput={(props) => <TextField {...props} />}
                    onChange={(d) => setStarted(d as Date)}
                    value={started}
                    ampm={false}
                    label="开始时间"
                  />
                </Grid>
                <Grid item xs>
                  <DateTimePicker
                    renderInput={(props) => <TextField {...props} />}
                    onChange={(d) => setEnded(d)}
                    value={ended}
                    ampm={false}
                    label="结束时间"
                  />
                </Grid>
              </Grid>

              <FormControl component="fieldset">
                <FormLabel component="legend">比赛类型</FormLabel>
                <RadioGroup row value={type} onChange={(e) => setType(e.target.value)}>
                  <FormControlLabel label="竞速" value="speedrun" control={<Radio />} />
                  <FormControlLabel label="积分" value="meta" control={<Radio />} />
                </RadioGroup>
              </FormControl>
              <br />
              <FormControl>
                <FormControlLabel control={<Switch value={hidden} onChange={(e) => setHidden(e.target.checked)} />} label="隐藏(管理员可见)" />
              </FormControl>
              <TextField fullWidth label="比赛名称" value={name} onChange={(e) => setName(e.target.value)} variant="outlined" />
              <TextField fullWidth label="别名" value={alias} onChange={(e) => setAlias(e.target.value)} variant="outlined" />
              <TextField fullWidth label="地图地址" value={map} onChange={(e) => setMap(e.target.value)} variant="outlined" />
              <TextField fullWidth label="封面地址" value={cover} onChange={(e) => setCover(e.target.value)} variant="outlined" />

              <TextField variant="outlined" color="primary" type="number" label={"难度系数"} fullWidth value={difficulty} onChange={(e) => setDifficulty(e.target.value)} disabled={type !== 'speedrun'} />
              <TextField variant="outlined" color="primary" type="number" label={"提交 次数"} fullWidth value={submitCount} onChange={(e) => setSubmitCount(e.target.value)} disabled={type !== 'speedrun'} />
              <Button type="submit" variant="contained" fullWidth disableElevation color="primary">提交</Button>
            </form>
          </Box>
        </Collapse>
      </TableCell>
    </TableRow>
  </>
}

const GamesPage = () => {
  const classes = useStyles();
  const { data, mutate } = useSWR<Game[]>('/admin/games')

  const createNew = async () => {
    await instance({
      url: `/admin/games`,
      method: 'post'
    })
    mutate()
  }

  return <AdminLayout>
    <Container>
      <Paper variant="outlined">
        <Table className={classes.table} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>名称</TableCell>
              <TableCell align="right">比赛类型</TableCell>
              <TableCell align="right">开始时间</TableCell>
              <TableCell align="right">结束时间</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.map(v => (
              <Row key={v._id.toString()} game={v} mutate={mutate} />
            ))}
            <TableRow>
              <TableCell colSpan={5} style={{ padding: 0 }}>
                <Button fullWidth color="primary" onClick={createNew}>新增</Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Paper>
    </Container>
  </AdminLayout>
}

export default GamesPage