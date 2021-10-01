import React, { useEffect, useState } from 'react'
import AdminLayout from './layout'
import { useParams } from 'react-router-dom'
import useSWR from 'swr'
import { Box, Button, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup, TextField } from '@material-ui/core'
import type { Level, Game } from '@cyberrun/core'
import instance from '../../components/instance'
import { toast } from 'react-toastify'
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      '& .MuiTextField-root': {
        margin: theme.spacing(1)
      },
    },
  }),
);

const LevelPage = () => {
  const classes = useStyles()
  const { id, levelId } = useParams<{
    id: string;
    levelId: string
  }>()
  const { data } = useSWR<Level>(`/admin/levels/${levelId}`)
  const { data: gameData } = useSWR<Game>(`/admin/games/${id}`)
  const [content, setContent] = useState('')
  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState('5')
  const [submitCount, setSubmitCount] = useState('5')
  const [cooldown, setCooldown] = useState('')
  const [alias, setAlias] = useState('')
  //const [type, setType] = useState('')
  const save = async () => {
    await instance({
      url: `/admin/levels/${levelId}/patch`,
      data: { title, content, difficulty: Number(difficulty), submitCount: Number(submitCount), cooldown: cooldown ? Number(cooldown) : undefined, alias },
      method: 'post'
    })
    toast.success("保存成功")
  }
  useEffect(() => {
    if (data) {
      setTitle(data.title)
      setContent(data.content)
      setDifficulty(data.difficulty?.toString() ?? '5')
      setSubmitCount(data.submitCount?.toString() ?? '5')
      setCooldown(data.cooldown?.toString() ?? '')
      setAlias(data.alias?.toString() ?? '')
      //setType(data.type)
    }
  }, [data])
  return <AdminLayout>
    <form className={classes.root} autoComplete="off" onSubmit={(e) => {
      e.preventDefault()
      save()
    }}>
      {/* <FormControl component="fieldset">
        <FormLabel component="legend">比赛类型</FormLabel>
        <RadioGroup row value={type} onChange={(e) => setType(e.target.value)}>
          <FormControlLabel label="普通关" value="normal" control={<Radio />} />
          <FormControlLabel label="结束关" value="end" control={<Radio />} />
          {gameData?.type === "meta" && (
            <FormControlLabel label="元关卡" value="meta" control={<Radio />} />
          )}
        </RadioGroup>
      </FormControl> */}
      <TextField variant="outlined" color="primary" label="标题" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} />
      <TextField variant="outlined" color="primary" label={"内容(markdown)"} multiline fullWidth value={content} onChange={(e) => setContent(e.target.value)} />
      <TextField variant="outlined" color="primary" label="别名" fullWidth value={alias} onChange={(e) => setAlias(e.target.value)} />
      <TextField variant="outlined" color="primary" type="number" label={"难度系数"} fullWidth value={difficulty} onChange={(e) => setDifficulty(e.target.value)} />
      <TextField variant="outlined" color="primary" type="number" label={"提交次数"} fullWidth value={submitCount} onChange={(e) => setSubmitCount(e.target.value)} />
      <TextField variant="outlined" color="primary" type="number" label={"提交冷却时间(秒)"} fullWidth value={cooldown} onChange={(e) => setCooldown(e.target.value)} />
      <Button type="submit" color="primary" variant="contained" fullWidth disableElevation>保存</Button>
    </form>
  </AdminLayout>
}

export default LevelPage