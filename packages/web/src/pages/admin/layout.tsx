import { AppBar, Box, Divider, Drawer, FormControl, Icon, IconButton, InputLabel, List, ListItem, ListItemIcon, ListItemText,  MenuItem, Select, SvgIcon, Theme, Toolbar, Typography } from '@mui/material'
import { makeStyles, createStyles, useTheme } from '@mui/styles';
import React, { useState } from 'react'
import { Forum, ListStatus, Menu, Seal, FormatListBulleted as ListIcon, MapOutline } from 'mdi-material-ui'
import useSWR from 'swr';
import type { Game } from '@cyberrun/core'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import useLocalStorage from 'react-use-localstorage'

const drawerWidth = 240;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
    },
    appBar: {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: drawerWidth,
    },
    drawer: {
      width: drawerWidth,
      flexShrink: 0,
    },
    drawerPaper: {
      width: drawerWidth,
    },
    // necessary for content to be below app bar
    toolbar: theme.mixins.toolbar,
    content: {
      flexGrow: 1,
      //backgroundColor: theme.palette.background.default,
      padding: theme.spacing(3),
    },
  }),
);

const AdminLayout: React.FunctionComponent = ({ children }) => {
  const classes = useStyles();
  const history = useNavigate()
  const location = useLocation();
  const [selected, setSelected] = useLocalStorage('admin_editing_id', '')
  const { data } = useSWR<Game[]>('/games')
  const params = useParams()

  const onChange = (e: any) => {
    setSelected(e.target.value as string)
    // @ts-ignore
    history(location.pathname.split(params.id).join(e.target.value as string))
  }

  return <div className={classes.root}>
    <AppBar position="fixed" className={classes.appBar}>
      <Toolbar>
        <IconButton color="inherit" edge="start">
          <Menu />
        </IconButton>
        <Typography variant="h6">
          CyberRun 管理面板
        </Typography>
      </Toolbar>
    </AppBar>
    <Drawer
      className={classes.drawer}
      variant="permanent"
      classes={{
        paper: classes.drawerPaper,
      }}
      anchor="left"
    >
      <div className={classes.toolbar}>
        <Box mx={2}>
          <FormControl fullWidth>
            <InputLabel>选择比赛</InputLabel>
            <Select fullWidth value={selected} onChange={onChange}>
              {data?.map(v => (
                <MenuItem key={v._id.toString()} value={v._id.toString()}>{v.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </div>
      <Divider />
      <List>
        <ListItem button onClick={() => history(`/admin/games`)}>
          <ListItemIcon><ListIcon /></ListItemIcon>
          <ListItemText primary="比赛列表" />
        </ListItem>
      </List>
      <Divider />
      {selected && (
        <List>
          <ListItem button onClick={() => history(`/admin/${selected}/map`)}>
            <ListItemIcon><MapOutline /></ListItemIcon>
            <ListItemText primary="关卡编排" />
          </ListItem>
          <ListItem button onClick={() => history(`/admin/${selected}/log`)}>
            <ListItemIcon><ListStatus /></ListItemIcon>
            <ListItemText primary="回答记录" />
          </ListItem>
          <ListItem button onClick={() => history(`/admin/${selected}/analyze`)}>
            <ListItemIcon><Seal /></ListItemIcon>
            <ListItemText primary="比赛统计" />
          </ListItem>
          <ListItem button onClick={() => history(`/admin/${selected}/point`)}>
            <ListItemIcon><Seal /></ListItemIcon>
            <ListItemText primary="积分排行" />
          </ListItem>
        </List>
      )}
    </Drawer>
    <main className={classes.content}>
      <div className={classes.toolbar} />
      {children}
    </main>
  </div >
}

export default AdminLayout