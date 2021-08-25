import axios from 'axios'
import { toast } from 'react-toastify'

const instance = axios.create({
  baseURL: import.meta.env.VITE_SERVER?.toString() || 'http://localhost:54000/'
})
instance.interceptors.request.use((req) => {
  req.headers.authorization = `Bearer ${localStorage.getItem("token")}`
  return req
})

instance.interceptors.response.use((res) => res, (err) => {
  if (err.response?.status === 403) {
    toast.error(err.response?.data.message)
  }
  return Promise.reject(err)
})

export default instance