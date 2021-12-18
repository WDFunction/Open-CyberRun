import React, { lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SWRConfig } from 'swr'
import instance from './components/instance'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';
import DateAdapter from '@mui/lab/AdapterDateFns';
import { ThemeProvider } from '@mui/styles'

import Level from './pages/level'
import { LocalizationProvider } from '@mui/lab'
import { createTheme } from '@mui/material/styles';

const Index = lazy(() => import('./pages/index'))
const About = lazy(() => import('./pages/about'))
const Profile = lazy(() => import('./pages/profile'))
const Login = lazy(() => import('./pages/login'))
const Record = lazy(() => import('./pages/record'))
const Levels = lazy(() => import('./pages/levels'))
const AdminMap = lazy(() => import('./pages/admin/map'))
const AdminPoint = lazy(() => import('./pages/admin/point'))
const AdminLog = lazy(() => import('./pages/admin/log'))
const AdminLevel = lazy(() => import('./pages/admin/level'))
const AdminGames = lazy(() => import('./pages/admin/games'))
const AdminAnalyze = lazy(() => import('./pages/admin/analyze'))
const Admin = lazy(() => import('./pages/admin'))
// const routes = [
//   {
//     path: '/user/email_verify/:token',
//     exact: true,
//     component: loadable(() => import('./pages/emailVerify'))
//   },
//   {
//     path: '/rank',
//     exact: true,
//     component: loadable(() => import('./pages/rank'))
//   },
//   {
//     path: '/admin/:id/wordcloud/:levelId',
//     exact: true,
//     component: loadable(() => import('./pages/admin/wordcloud'))
//   }
// ]

const theme = createTheme();

const App = () => {
  return <BrowserRouter>
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={DateAdapter}>
        <ToastContainer position="bottom-right" />
        <SWRConfig value={{
          fetcher: url => instance.get(url).then(res => res.data)
        }}>
          <React.Suspense fallback={<div>loading</div>}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/login" element={<Login />} />
              <Route path="levels/:gameId" element={<Levels />} />
              <Route path="level/:id" element={<Level />} />
              <Route path="record/:id" element={<Record />} />
              <Route path="admin/" element={<Admin />} />
              <Route path="admin/games" element={<AdminGames />} />
              <Route path="admin/:id/*" element={
                <Routes>
                  <Route path="map" element={<AdminMap />} />
                  <Route path="point" element={<AdminPoint />} />
                  <Route path="log" element={<AdminLog />} />
                  <Route path="analyze" element={<AdminAnalyze />} />
                  <Route path="levels/:levelId" element={<AdminLevel />} />
                </Routes>
              } />
            </Routes>
          </React.Suspense>
        </SWRConfig>
      </LocalizationProvider>
    </ThemeProvider>
  </BrowserRouter>
}

export default App;