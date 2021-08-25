import React from 'react'
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import { RouteConfig, renderRoutes } from 'react-router-config'
import loadable from '@loadable/component'
import { SWRConfig } from 'swr'
import instance from './components/instance'
import { ToastContainer } from 'react-toastify'
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';

const routes: RouteConfig[] = [
  {
    path: '/',
    exact: true,
    component: loadable(() => import('./pages/index'))
  },
  {
    path: '/about',
    exact: true,
    component: loadable(() => import('./pages/about'))
  },
  {
    path: '/profile',
    exact: true,
    component: loadable(() => import('./pages/profile'))
  },
  {
    path: '/user/email_verify/:token',
    exact: true,
    component: loadable(() => import('./pages/emailVerify'))
  },
  {
    path: '/login',
    exact: true,
    component: loadable(() => import('./pages/login'))
  },
  {
    path: '/level/:id',
    exact: true,
    component: loadable(() => import('./pages/level'))
  }, {
    path: '/levels/:gameId',
    exact: true,
    component: loadable(() => import('./pages/levels'))
  },
  {
    path: '/rank',
    exact: true,
    component: loadable(() => import('./pages/rank'))
  },
  {
    path: '/record/:id',
    exact: true,
    component: loadable(() => import('./pages/record'))
  },
  {
    path: '/admin/:id/analyze',
    exact: true,
    component: loadable(() => import('./pages/admin/analyze'))
  },
  {
    path: '/admin/:id/wordcloud/:levelId',
    exact: true,
    component: loadable(() => import('./pages/admin/wordcloud'))
  }, {
    path: '/admin/:id/map',
    exact: true,
    component: loadable(() => import('./pages/admin/map'))
  },
  {
    path: '/admin/:id/levels/:levelId',
    exact: true,
    component: loadable(() => import('./pages/admin/level'))
  },
  {
    path: '/admin/',
    exact: true,
    component: loadable(() => import('./pages/admin/index'))
  },
  {
    path: '/admin/games',
    exact: true,
    component: loadable(() => import('./pages/admin/games'))
  },
  {
    path: '/admin/:id/log',
    exact: true,
    component: loadable(() => import('./pages/admin/log'))
  }
]

const App = () => {
  return <BrowserRouter>
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <ToastContainer position="bottom-right"/>
      <SWRConfig value={{
        fetcher: url => instance.get(url).then(res => res.data)
      }}>
        <Switch>
          {renderRoutes(routes)}
        </Switch>
      </SWRConfig>
    </MuiPickersUtilsProvider>
  </BrowserRouter>
}

export default App;