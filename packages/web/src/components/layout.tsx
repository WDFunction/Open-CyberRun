import { AppBar, IconButton, Toolbar, Typography } from '@material-ui/core'
import { createStyles, makeStyles, Theme, useTheme } from '@material-ui/core/styles';
import React from 'react'
import { Account, Cog } from 'mdi-material-ui'
import { useNavigate } from 'react-router-dom'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    title: {
      flexGrow: 1,
    },
  }),
);

const Layout: React.FunctionComponent = ({ children }) => {
  const classes = useStyles()
  const history = useNavigate()
  const theme = useTheme()
  return <div>
    <AppBar>
      <Toolbar>
        {/* <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu">
        <Menu />
      </IconButton> */}
        <Typography variant="h6" className={classes.title} onClick={() => history('/')}>
          CyberRun
        </Typography>
        <IconButton color="inherit" href="/profile" onClick={(e) => {
          e.preventDefault()
          history('/profile')
        }}>
          <Account />
        </IconButton>
        {/* <IconButton color="inherit" href="/admin" onClick={(e) => {
          e.preventDefault()
          history('/admin')
        }}>
          <Cog />
        </IconButton> */}
      </Toolbar>
    </AppBar>
    <main style={{paddingTop: theme.spacing(2)}}>
      <Toolbar />
      {children}
    </main>
  </div>
}

export default Layout