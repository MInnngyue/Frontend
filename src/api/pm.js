import request from './request'
export function getConversations() { return request.get('/api/pm/conversations') }
export function getChatWith(userId) { return request.get(`/api/pm/with/${userId}`) }
export function sendMessage(data) { return request.post('/api/pm', data) }
