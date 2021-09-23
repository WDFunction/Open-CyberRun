import React, { useState } from 'react'
import AdminLayout from './layout'
import { useParams } from 'react-router-dom'
import useSWR from 'swr';
import { Avatar, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@material-ui/core';
import type { Log, User, Level } from '@cyberrun/core'
import { Pagination } from '@material-ui/lab'
import { ChevronDoubleRight, Close, Check } from 'mdi-material-ui'
import md5 from '../../components/md5'

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
          <TableCell>回答内容</TableCell>
          {/* <TableCell>操作</TableCell> */}
        </TableRow>
      </TableHead>
      <TableBody>
        {data?.data.map(v => {
          let status = <div>未知</div>

          const fromLevel = data?.levels?.find(l => l._id === v.levelId)
          if (v.type === "passed") {
            const newLevel = data?.levels?.find(l => l._id === v.newLevelId)
            if (newLevel) {
              status = <span><Check />{fromLevel!.title} → {newLevel!.title}</span>
            } else {
              status = <span><Check />{fromLevel!.title}</span>
            }
          } else if (v.type === "failed") {
            status = <span><Close />{fromLevel!.title}</span>
          } else if (v.type === "join") {
            status = <span>加入游戏</span>
          }
          return (
            <TableRow key={v._id.toString()}>
              <TableCell>
                {v.user.email && (
                  <>
                    <Avatar src={`https://gravatar.loli.net/avatar/${md5(v.user.email)}`} />
                  </>
                )}
                {v.user.username}
              </TableCell>
              <TableCell>
                {new Date(v.createdAt).toLocaleString()}
              </TableCell>
              <TableCell>{status}</TableCell>
              <TableCell>{v.answers?.join(", ")}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      <Pagination color={"primary"} page={page} onChange={(e: any, v: number) => {
        setPage(v)
      }} count={Math.ceil((data?.count || 0) / 20)} />
    </Table>
  </AdminLayout>
}

export default LogPage