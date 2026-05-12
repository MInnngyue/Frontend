import request from './request'

// 登录接口
export function login(data) {
  return request({
    url: '/api/auth/login',
    method: 'post',
    data,
  })
}

// 注册接口
export function register(data) {
  return request({
    url: '/api/auth/register',
    method: 'post',
    data,
  })
}

// 获取当前登录用户信息
export function getUserInfo() {
  return request({
    url: '/api/user/info',
    method: 'get',
  })
}
