import axios from 'axios'

const instance = axios.create({
  baseURL: import.meta.env.VITE_SERVER?.toString() || 'http://localhost:54000/'
})
instance.interceptors.request.use((req) => {
  req.headers.authorization = `Bearer ${localStorage.getItem("token")}`
  return req
})

export default instance