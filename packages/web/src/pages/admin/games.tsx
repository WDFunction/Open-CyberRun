import React, { useState, useEffect } from 'react'
import useSWR from 'swr'
import AdminLayout from './layout'
import type { Game } from '@cyberrun/core'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';

import { Paper, TableHead, TableCell, TableBody, Table, TableRow, Container, IconButton, Collapse, Typography, Box, Button, Grid, TextField, FormControl, FormControlLabel, Radio, FormLabel, RadioGroup } from '@material-ui/core'
import { ChevronUp, ChevronDown } from 'mdi-material-ui'

import { DateTimePicker } from "@material-ui/pickers";
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

  useEffect(() => {
    if (game) {
      setStarted(new Date(game.startedAt))
      setEnded(new Date(game.endedAt))
      setMap(game.map)
      setCover(game.cover)
      setDifficulty(game.difficulty?.toString() ?? '')
      setSubmitCount(game.submitCount?.toString() ?? '')
      setType(game.type)
    }
  }, [game])

  const save = async () => {
    await instance({
      url: `/admin/games/${game._id.toString()}/patch`,
      method: 'post',
      data: {
        startedAt: started.toISOString(), endedAt: ended.toISOString(),
        map, cover, type, difficulty: difficulty ? Number(difficulty) : undefined,
        submitCount: submitCount ? Number(submitCount) : undefined
      }
    })
    toast.success("保存成功")
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
              编辑
            </Typography>
            <form className={classes.form} onSubmit={(e) => {
              e.preventDefault()
              save()
            }}>
              <Grid container spacing={2} style={{ marginBottom: 16 }}>
                <Grid item xs>
                  <DateTimePicker
                    onChange={(d) => setStarted(d)}
                    value={started}
                    autoOk
                    ampm={false}
                    label="开始时间"
                    fullWidth
                    inputVariant="outlined"
                  />
                </Grid>
                <Grid item xs>
                  <DateTimePicker
                    onChange={(d) => setEnded(d)}
                    value={ended}
                    autoOk
                    ampm={false}
                    label="结束时间"
                    inputVariant="outlined"
                    fullWidth
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