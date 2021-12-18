import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import useSWR from 'swr'
import type { Level, Game } from '@cyberrun/core'
import { Button, CardActions, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, List, ListItem, ListItemSecondaryAction, ListItemText, Menu, Popover, Typography } from '@mui/material'
import { Card, MapMarker } from 'mdi-material-ui'

const LevelsPage = () => {
  const history = useNavigate()
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
    }} style={{ minWidth: 300 }}>
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
          history(`/level/${level?._id}`)
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