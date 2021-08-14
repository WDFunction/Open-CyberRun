import React from 'react'
import AdminLayout from './layout'
import { useParams } from 'react-router-dom'
import useSWR from 'swr';
import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@material-ui/core';
import type { Log, User } from '@cyberrun/core'

type AdvancedLog = Log & {
  user: User
}

const LogPage = () => {
  const { id } = useParams<{ id: string }>();
  const { data } = useSWR<AdvancedLog[]>(`/admin/logs/${id}`, {
    refreshInterval: 5000
  })
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
          <TableCell>操作</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data?.map(v => {
          let status = <div>未知</div>
          if(v.type === "passed") {
            status = <Typography>过关</Typography>
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
              <TableCell></TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </AdminLayout>
}

export default LogPage