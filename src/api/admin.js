import request from './request'

export function getPendingPosts(params) {
  return request.get('/api/admin/posts/pending', { params })
}
export function approvePost(id) {
  return request.put(`/api/admin/posts/${id}/approve`)
}
export function rejectPost(id, reason) {
  return request.put(`/api/admin/posts/${id}/reject`, null, { params: { reason } })
}
export function getUsers(params) {
  return request.get('/api/admin/users', { params })
}
export function freezeUser(id) {
  return request.put(`/api/admin/users/${id}/freeze`)
}
export function adjustCredit(id, delta) {
  return request.put(`/api/admin/users/${id}/credit`, null, { params: { delta } })
}
export function getDict(type) {
  return request.get('/api/admin/dict', { params: { type } })
}
export function addDict(data) {
  return request.post('/api/admin/dict', data)
}
export function updateDict(id, data) {
  return request.put(`/api/admin/dict/${id}`, data)
}
export function deleteDict(id) {
  return request.delete(`/api/admin/dict/${id}`)
}
export function getStats() {
  return request.get('/api/admin/stats')
}
export function getAllPosts(params) {
  return request.get('/api/admin/posts/all', { params })
}
export function archivePost(id) {
  return request.put(`/api/admin/posts/${id}/archive`)
}
