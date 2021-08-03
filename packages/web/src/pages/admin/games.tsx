import { List, ListItem, Paper, Table, TableBody, TableCell, TableHead, TableRow } from '@material-ui/core'
import React from 'react'
import useSWR from 'swr'
import type { Game } from '@cyberrun/core'
import AdminLayout from './layout'

const Page = () => {
  const { data } = useSWR<Game[]>('/games/')
  return <AdminLayout>
    <Paper variant="outlined">
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>ID</TableCell>
            <TableCell>名称</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data?.map(v => (
            <TableRow>
              <TableCell>{v._id}</TableCell>
              <TableCell>{v.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  </AdminLayout>
}

export default Page