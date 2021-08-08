import { AppBar, IconButton, Toolbar, Typography } from '@material-ui/core'
import { createStyles, makeStyles, Theme, useTheme } from '@material-ui/core/styles';
import React from 'react'
import { Menu } from 'mdi-material-ui'
import { useHistory } from 'react-router-dom'

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
  const history = useHistory()
  const theme = useTheme()
  return <div>
    <AppBar>
      <Toolbar>
        {/* <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu">
        <Menu />
      </IconButton> */}
        <Typography variant="h6" className={classes.title} onClick={() => history.push('/')}>
          CyberRun
        </Typography>
      </Toolbar>
    </AppBar>
    <main style={{paddingTop: theme.spacing(2)}}>
      <Toolbar />
      {children}
    </main>
  </div>
}

export default Layout