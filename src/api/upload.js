import axios from 'axios'

const uploadClient = axios.create({
  baseURL: 'http://localhost:8080',
  timeout: 30000,
})

uploadClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = 'Bearer ' + token
  }
  return config
})

export function uploadImage(file) {
  const formData = new FormData()
  formData.append('file', file)
  return uploadClient.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
