import React, { useState } from 'react'
import AdminLayout from './layout'
import { useParams } from 'react-router-dom'
import useSWR from 'swr';
import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@material-ui/core';
import type { Log, User, Level } from '@cyberrun/core'
import { Pagination } from '@material-ui/lab'
import { ChevronDoubleRight, Close } from 'mdi-material-ui'

type AdvancedLog = Log & {
  user: User
}

const LogPage = () => {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState(1)
  const { data, isValidating } = useSWR<{
    data: AdvancedLog[]
    count: number
    levels: Level[]
  }>(`/admin/logs/${id}?page=${page - 1}`, {
    refreshInterval: 5000
  })
  if (isValidating) {
    return <AdminLayout />
  }
  return <AdminLayout>
    <Typography>

    </Typography>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>
            用户
          </TableCell>
          <TableCell>时间</TableCell>
          <TableCell>比赛情况</TableCell>
          {/* <TableCell>操作</TableCell> */}
        </TableRow>
      </TableHead>
      <TableBody>
        {data?.data.map(v => {
          let status = <div>未知</div>

          const fromLevel = data?.levels?.find(l => l._id === v.levelId)
          if (v.type === "passed") {
            const newLevel = data?.levels?.find(l => l._id === v.newLevelId)
            status = <span>{fromLevel!.title} → {newLevel!.title}</span>
          } else if (v.type === "failed") {
            status = <span><Close />{fromLevel!.title}</span>
          } else if (v.type === "join") {
            status = <span>参与</span>
          }
          return (
            <TableRow key={v._id.toString()}>
              <TableCell>
                {v.user.username}
              </TableCell>
              <TableCell>
                {new Date(v.createdAt).toLocaleString()}
              </TableCell>
              <TableCell>{status}</TableCell>
              {/* <TableCell></TableCell> */}
            </TableRow>
          );
        })}
      </TableBody>
      <Pagination color={"primary"} page={page} onChange={(e: any, v: number) => {
        setPage(v)
      }} count={Math.ceil(data?.count / 20)} />
    </Table>
  </AdminLayout>
}

export default LogPage