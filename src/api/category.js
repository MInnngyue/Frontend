import request from './request'

export function getCategories(type) {
  return request.get(`/api/categories/${type}`)
}

export function getCategoryChildren(type, parentId) {
  return request.get(`/api/categories/${type}/children`, { params: { parentId } })
}
