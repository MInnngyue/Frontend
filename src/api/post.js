import request from './request'

export function getPosts(params) {
  return request.get('/api/posts', { params })
}

export function getPostDetail(id) {
  return request.get(`/api/posts/${id}`)
}

export function publishPost(data) {
  return request.post('/api/posts', data)
}

export function deletePost(id) {
  return request.delete(`/api/posts/${id}`)
}
