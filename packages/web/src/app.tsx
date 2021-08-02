import React from 'react'
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import { RouteConfig, renderRoutes } from 'react-router-config'
import loadable from '@loadable/component'
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
    path: '/level',
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
    path: '/admin/levels',
    exact: true,
    component: loadable(() => import('./pages/admin/levels'))
  }
]

const App = () => {
  return <BrowserRouter>
    <Switch>
      {renderRoutes(routes)}
    </Switch>
  </BrowserRouter>
}

export default App;