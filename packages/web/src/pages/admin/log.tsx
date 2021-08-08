import React from 'react'
import AdminLayout from './layout'
import {useParams} from 'react-router-dom'
import useSWR from 'swr';

const LogPage = () => {
  const {id} = useParams<{id: string}>();
  const {data} = useSWR(`/admin/logs/${id}`)
  return <AdminLayout></AdminLayout>
}

export default LogPage