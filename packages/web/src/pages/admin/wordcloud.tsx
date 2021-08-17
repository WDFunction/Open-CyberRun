import React, { useEffect, useRef } from 'react'
import AdminLayout from './layout'
import { useParams } from 'react-router-dom'
// @ts-ignore
import ReactWordcloud from 'react-wordcloud';
import useSWR from 'swr';

const WordcloudPage = () => {
  const { levelId } = useParams<{ levelId: string }>();
  const { data, mutate } = useSWR(() => `/levels/${levelId}/admin/wordcloud`, {
    initialData: []
  })
  useEffect(() => {
    mutate()
  }, [levelId])
  return <AdminLayout>
    <ReactWordcloud words={data} size={[1280, 720]} />
  </AdminLayout>

}

export default WordcloudPage