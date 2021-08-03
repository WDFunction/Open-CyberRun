import React from 'react'
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import { RouteConfig, renderRoutes } from 'react-router-config'
import loadable from '@loadable/component'
import { SWRConfig } from 'swr'
import instance from './components/instance'
import {ToastContainer} from 'react-toastify'
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
    path: '/login',
    exact: true,
    component: loadable(() => import('./pages/login'))
  },
  {
    path: '/level/:id',
    exact: true,
    component: loadable(() => import('./pages/level'))
  },
  {
    path: '/rank',
    exact: true,
    component: loadable(() => import('./pages/rank'))
  },
  {
    path: '/record',
    exact: true,
    component: loadable(() => import('./pages/record'))
  },
  {
    path: '/admin/:id/levels',
    exact: true,
    component: loadable(() => import('./pages/admin/levels'))
  },
  {
    path: '/admin/:id/analyze',
    exact: true,
    component: loadable(() => import('./pages/admin/analyze'))
  },
  {
    path: '/admin/',
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
  <ToastContainer />
    <SWRConfig value={{
      fetcher: url => instance.get(url).then(res => res.data)
    }}>
      <Switch>
        {renderRoutes(routes)}
      </Switch>
    </SWRConfig>
  </BrowserRouter>
}

export default App;