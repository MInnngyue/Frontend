import request from './request'
export function getComments(postId) { return request.get(`/api/comments/post/${postId}`) }
export function addComment(data) { return request.post('/api/comments', data) }
