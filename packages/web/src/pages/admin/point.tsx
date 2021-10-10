import { TableHead, TableCell, TableBody, Table, TableRow, Button } from '@material-ui/core';
import React from 'react'
import useSWR from 'swr';
import AdminLayout from './layout'
import { useParams, useHistory } from 'react-router-dom'
import type { Point, User } from '@cyberrun/core'

type IPoint = {
  user: User
  point: number;
  _id: string
}

/** Download contents as a file
 * Source: https://stackoverflow.com/questions/14964035/how-to-export-javascript-array-info-to-csv-on-client-side
 */
function downloadBlob(content: any, filename: string, contentType: string) {
  // Create a blob
  var blob = new Blob([content], { type: contentType });
  var url = URL.createObjectURL(blob);

  // Create a link to download it
  var pom = document.createElement('a');
  pom.href = url;
  pom.setAttribute('download', filename);
  pom.click();
}

// https://stackoverflow.com/a/68146412/8308032
function arrayToCsv(data: any[]) {
  return data.map(row =>
    row
      .map(String)  // convert every value to String
      .map((v: string) => v.replaceAll('"', '""'))  // escape double colons
      .map((v: string) => `"${v}"`)  // quote it
      .join(',')  // comma-separated
  ).join('\r\n');  // rows starting on new lines
}

const PointPage = () => {
  const { id } = useParams<{ id: string }>()
  const { data } = useSWR<IPoint[]>(`/admin/games/${id}/point`)
  const exportt = () => {
    const csv = arrayToCsv([
      ['username', 'email', 'point'],
      ...data!.map(v => [
        v.user.username, v.user.email, v.point
      ])
    ])
    downloadBlob(csv, 'export.csv', 'text/csv')
  }
  return <AdminLayout>
    <Button color="primary" onClick={exportt}>导出</Button>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>用户名</TableCell>
          <TableCell align="right">用户邮箱</TableCell>
          <TableCell align="right">得分</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {data?.map(v => (
          <TableRow id={v._id.toString()}>
            <TableCell>{v.user.username}</TableCell>
            <TableCell align="right">{v.user.email}</TableCell>
            <TableCell align="right">{v.point}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </AdminLayout >
}

export default PointPage;