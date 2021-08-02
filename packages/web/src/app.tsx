import React from 'react'
import { BrowserRouter, Switch, Route } from 'react-router-dom'
import { RouteConfig, renderRoutes } from 'react-router-config'
import loadable from '@loadable/component'
const routes: RouteConfig[] = [
  {
    path: '/',
    exact: true,
    component: loadable(() => import('./pages/index'))
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