import React from 'react'
import { useParams, useHistory } from 'react-router-dom'
import useSWR from 'swr'
import type { Level } from '@cyberrun/core'
import { Button, Grid, List, ListItem, ListItemSecondaryAction, ListItemText } from '@material-ui/core'

const LevelsPage = () => {
  const history = useHistory()
  const { gameId } = useParams<{ gameId: string }>()
  const { data } = useSWR<Level[]>(`/levels/meta/${gameId}`)
  return <div>
    <List>
      {data?.map(v => (
        <ListItem>
          <ListItemText primary={v.title} />
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