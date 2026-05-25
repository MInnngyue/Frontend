import request from './request'

export function getMessages() {
  return request.get('/api/messages')
}

export function getUnreadCount() {
  return request.get('/api/messages/unread-count')
}

export function markRead(id) {
  return request.put(`/api/messages/${id}/read`)
}

export function markAllRead() {
  return request.put('/api/messages/read-all')
}
