import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const request = axios.create({
  baseURL: 'http://localhost:8081',
  timeout: 10000,
})

// 请求拦截器：自动携带 token
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = 'Bearer ' + token
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// 响应拦截器：统一处理 Result 结构
request.interceptors.response.use(
  (response) => {
    const res = response.data

    // 后端统一成功码
    if (res.code === 200) {
      return res
    }

    // token 无效或未登录
    if (res.code === 401) {
      ElMessage.error(res.message || '登录已过期，请重新登录')
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      window.location.href = '/login'
      return Promise.reject(res)
    }

    // 无权限
    if (res.code === 403) {
      ElMessage.error(res.message || '没有权限访问')
      return Promise.reject(res)
    }

    ElMessage.error(res.message || '请求失败')
    return Promise.reject(res)
  },
  (error) => {
    if (error.response) {
      const status = error.response.status

      if (status === 401) {
        ElMessage.error('未授权，请重新登录')
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        window.location.href = '/login'
      } else if (status === 403) {
        ElMessage.error('拒绝访问')
      } else if (status === 404) {
        ElMessage.error('请求地址不存在')
      } else if (status === 500) {
        ElMessage.error('服务器内部错误')
      } else {
        ElMessage.error('请求失败')
      }
    } else {
      ElMessage.error('无法连接服务器')
    }

    return Promise.reject(error)
  },
)

export default request
