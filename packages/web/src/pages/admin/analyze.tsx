import { Button, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@material-ui/core'
import React from 'react'
import AdminLayout from './layout'
import { useParams, useNavigate } from 'react-router-dom'
import useSWR from 'swr'
import type { Level } from '@cyberrun/core'

type NewLevel = Level & {
  avgSubmit: number;
  onlineCount: number;
}

const Page = () => {
  const { id } = useParams<{ id: string }>()
  const history = useNavigate()
  const { data } = useSWR<{
    stats: {
      totalTries: number
      userAvgTries: number
      passedCount: number
      avgPassedTime: number
    }
    levels: NewLevel[]
  }>(`/games/${id}/admin/stats`, {
    refreshInterval: 5000
  })

  if (!data) {
    return <AdminLayout>loading</AdminLayout>
  }

  return <AdminLayout>
    <Typography variant="h5">比赛统计</Typography>
    <Table>
      <TableBody>
        <TableRow>
          <TableCell>总提交数</TableCell>
          <TableCell>{data.stats.totalTries}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>人均提交次数</TableCell>
          <TableCell>{data.stats.userAvgTries}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>通关人数</TableCell>
          <TableCell>{data.stats.passedCount}</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>平均通关用时</TableCell>
          <TableCell>{data.stats.avgPassedTime / 1000}秒</TableCell>
        </TableRow>
      </TableBody>
    </Table>
    <Typography>关卡详情</Typography>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>关卡名称</TableCell>
          <TableCell>人均提交次数</TableCell>
          <TableCell>当前人数</TableCell>
          <TableCell>操作</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data.levels.map(v => (
          <TableRow key={v._id.toString()}>
            <TableCell>{v.title}</TableCell>
            <TableCell>{v.avgSubmit}</TableCell>
            <TableCell>{v.onlineCount}</TableCell>
            <TableCell>
              <Button variant="outlined" color="primary" onClick={() => {
                history(`/admin/${id}/wordcloud/${v._id.toString()}`)
              }}>回答云图</Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </AdminLayout>
}

export default Page