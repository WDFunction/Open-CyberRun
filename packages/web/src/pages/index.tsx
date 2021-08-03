import React from 'react'
import useSWR from 'swr';

const IndexPage = () => {
  const {data} = useSWR('/games/')
  console.log(data)
  return <div>Index
    
  </div>
}

export default IndexPage;