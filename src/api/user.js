import request from './request'

// 登录接口
export function login(data) {
  return request({
    url: '/api/auth/login',
    method: 'post',
    data,
    handleErrorLocally: true,
  })
}

// 注册接口
export function register(data) {
  return request({
    url: '/api/auth/register',
    method: 'post',
    data,
    handleErrorLocally: true,
  })
}

// 获取当前登录用户信息
export function getUserInfo() {
  return request({
    url: '/api/user/info',
    method: 'get',
  })
}

// 更新个人资料
export function updateProfile(data) {
  return request({
    url: '/api/user/profile',
    method: 'put',
    data,
  })
}

// 获取我的帖子
export function getMyPosts(params) {
  return request({
    url: '/api/user/posts',
    method: 'get',
    params,
  })
}
