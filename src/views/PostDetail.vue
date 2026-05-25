<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPostDetail, deletePost } from '@/api/post'
import { imageUrl } from '@/utils/url'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const post = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    post.value = (await getPostDetail(route.params.id)).data
  } finally {
    loading.value = false
  }
})

function typeLabel(type) {
  return type === 0 ? '寻物启事' : '失物招领'
}

function typeTag(type) {
  return type === 0 ? 'danger' : 'success'
}

function statusLabel(status) {
  const map = { 0: '进行中', 1: '已匹配', 2: '认领中', 3: '已完结', 4: '已过期', 5: '已下架' }
  return map[status] || '未知'
}

function currentUserId() {
  const info = localStorage.getItem('userInfo')
  if (!info) return null
  try {
    return JSON.parse(info).userId || JSON.parse(info).id
  } catch {
    return null
  }
}

function isOwner() {
  if (!post.value) return false
  return post.value.userId === currentUserId()
}

async function handleDelete() {
  try {
    await ElMessageBox.confirm('确定要删除这个帖子吗？', '确认删除', { type: 'warning' })
    await deletePost(post.value.id)
    ElMessage.success('删除成功')
    router.push('/')
  } catch {
    // cancelled
  }
}
</script>

<template>
  <div class="detail-page" v-loading="loading">
    <template v-if="post">
      <!-- 返回 -->
      <div class="back-nav">
        <el-button text @click="router.push('/')" class="back-link">&larr; 返回广场</el-button>
      </div>

      <!-- 标题卡片 -->
      <div class="header-card">
        <div class="header-tags">
          <el-tag :type="typeTag(post.type)" size="large" effect="dark" round>{{ typeLabel(post.type) }}</el-tag>
          <el-tag size="large" type="info" effect="plain" round>{{ statusLabel(post.status) }}</el-tag>
        </div>
        <h2 class="header-title">{{ post.title || '无标题' }}</h2>
        <div class="header-meta-row">
          <span class="meta-item">{{ post.itemCategory }}</span>
          <span class="meta-sep">·</span>
          <span class="meta-item">{{ post.color }}</span>
          <span class="meta-sep">·</span>
          <span class="meta-item">{{ post.locationCampus }}
            <template v-if="post.locationArea"> / {{ post.locationArea }}</template>
            <template v-if="post.locationDetail"> / {{ post.locationDetail }}</template>
          </span>
          <span class="meta-sep">·</span>
          <span class="meta-item meta-date">{{ post.lostTime }}</span>
        </div>
      </div>

      <!-- 正文 -->
      <div class="content-card" v-if="post.description">
        <h4>详细描述</h4>
        <p>{{ post.description }}</p>
      </div>

      <!-- 图片展示 -->
      <div class="content-card" v-if="post.images && post.images.length > 0">
        <h4>物品图片</h4>
        <div class="image-grid">
          <el-image
            v-for="(img, idx) in post.images"
            :key="idx"
            :src="imageUrl(img)"
            fit="cover"
            :preview-src-list="post.images.map(i => imageUrl(i))"
            class="detail-image"
          />
        </div>
      </div>

      <!-- 发布者 + 操作 -->
      <div class="bottom-section">
        <div class="publisher-card">
          <div class="publisher-avatar">{{ post.nickname?.charAt(0) || 'U' }}</div>
          <div class="publisher-detail">
            <div class="publisher-name">{{ post.nickname }}</div>
            <div class="publisher-meta">
              信用分 {{ post.creditScore }} · 发布于 {{ post.createTime?.substring(0, 16) }}
            </div>
          </div>
        </div>

        <div class="actions" v-if="isOwner()">
          <el-button type="danger" plain round @click="handleDelete">删除帖子</el-button>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.detail-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 20px;
}

.back-nav {
  margin-bottom: 20px;
}

.back-link {
  color: #909399;
  font-size: 14px;
}

.back-link:hover {
  color: #409eff;
}

/* Header Card */
.header-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 32px;
  margin-bottom: 20px;
  color: #fff;
}

.header-tags {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.header-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 16px;
}

.header-meta-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  opacity: 0.9;
}

.meta-item {
  font-weight: 500;
}

.meta-sep {
  opacity: 0.5;
}

.meta-date {
  color: #ffd04b;
  font-weight: 600;
}

/* Content Card */
.content-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.content-card h4 {
  margin: 0 0 12px;
  color: #303133;
  font-size: 16px;
}

.content-card p {
  color: #606266;
  line-height: 1.8;
  white-space: pre-wrap;
  margin: 0;
}

/* Image Grid */
.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.detail-image {
  width: 200px;
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
}

/* Bottom */
.bottom-section {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.publisher-card {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.publisher-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #66b1ff);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.publisher-detail {
  flex: 1;
}

.publisher-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.publisher-meta {
  font-size: 13px;
  color: #909399;
  margin-top: 2px;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
