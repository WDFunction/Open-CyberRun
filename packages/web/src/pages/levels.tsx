import React, { useEffect, useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import useSWR from 'swr'
import type { Level, Game } from '@cyberrun/core'
import { Button, CardActions, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, List, ListItem, ListItemSecondaryAction, ListItemText, Menu, Popover, Typography } from '@material-ui/core'
import { Card, MapMarker } from 'mdi-material-ui'
import Layout from '../components/layout'
/*
const LevelsPage = () => {
  const history = useHistory()
  const { gameId } = useParams<{ gameId: string }>()
  const { data, mutate } = useSWR<{
    levels: Level[]
    passed: Record<string, boolean>
  }>(`/levels/meta/${gameId}`)
  useEffect(() => {
    mutate()
  }, [history.location])
  return <Layout>
    <List>
      {data?.levels.map(v => {
        const available = v.type !== "meta" ? true :
          (data?.levels
            .filter(v => v.type !== "meta")
            .map(v => data?.passed[v._id.toString()])
            .filter(v => !v).length === 0)
        return (
          <ListItem>
            <ListItemText primary={v.title} secondary={(data?.passed[v._id.toString()] || false) ? '已通过' : '未通过'} />
            <ListItemSecondaryAction>
              <Button color="primary" variant="contained"
                disableElevation
                disabled={!available}
                onClick={() => {
                  history.push(`/level/${v._id.toString()}`)
                }}>参与</Button>
            </ListItemSecondaryAction>
          </ListItem>
        )
      })}
    </List>
  </Layout>
}
*/

const LevelsPage = () => {
  const history = useHistory()
  const { gameId } = useParams<{ gameId: string }>()
  const { data: gameData } = useSWR<Game>(`/games/${gameId}`)
  const [open, setOpen] = useState(false)
  const [level, setLevel] = useState<Level | null>(null)
  const { data, mutate } = useSWR<{
    data: Level[]
  }>(`/levels/meta/${gameId}`)

  if (!data || !gameData) {
    return <div>loading</div>
  }

  return <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'scroll' }}>
    <Dialog open={open} onClose={() => {
      setOpen(false)
    }} style={{minWidth: 300}}>
      <DialogTitle>
        关卡 {level?.title}
      </DialogTitle>
      <DialogContent>
        {/* <Typography>难度 </Typography> */}
        {/* <Typography>通关人数 </Typography> */}
        <Typography>Placeholder</Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" color="primary" disableElevation onClick={() => {
          history.push(`/level/${level?._id}`)
        }}>进入</Button>
      </DialogActions>
    </Dialog>
    <img src={gameData.map} style={{ position: 'absolute' }} />
    {data.data.map(v => (
      <IconButton style={{ position: 'absolute', top: v.mapPoint.y, left: v.mapPoint.x }} onClick={() => {
        setOpen(true)
        setLevel(v)
      }}>
        <MapMarker />
      </IconButton>
    ))}
  </div>
}

export default LevelsPage