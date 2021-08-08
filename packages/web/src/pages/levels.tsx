import React from 'react'
import { useParams, useHistory } from 'react-router-dom'
import useSWR from 'swr'
import type { Level } from '@cyberrun/core'
import { Button, Grid, List, ListItem, ListItemSecondaryAction, ListItemText } from '@material-ui/core'

const LevelsPage = () => {
  const history = useHistory()
  const { gameId } = useParams<{ gameId: string }>()
  const { data } = useSWR<{
    levels: Level[]
    passed: Record<string, boolean>
  }>(`/levels/meta/${gameId}`)
  return <div>
    <List>
      {data?.levels.map(v => (
        <ListItem>
          <ListItemText primary={v.title} secondary={
            (data?.passed[v._id.toString()] || false) ? '已通过' : '未通过'
          } />
          <ListItemSecondaryAction>
            <Button color="primary" variant="contained"
              disableElevation
              onClick={() => {
                history.push(`/level/${v._id.toString()}`)
              }}>参与</Button>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  </div>
}

export default LevelsPage