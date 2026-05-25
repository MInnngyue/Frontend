import request from './request'

export function createClaim(postId, matchId) {
  return request.post('/api/claims', null, { params: { postId, matchId } })
}

export function confirmClaim(id) {
  return request.put(`/api/claims/${id}/confirm`)
}

export function getClaimsByPost(postId) {
  return request.get(`/api/claims/post/${postId}`)
}

export function completePost(id) {
  return request.put(`/api/posts/${id}/complete`)
}
