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
        <el-button text @click="router.push('/')">&larr; 返回广场</el-button>
      </div>

      <!-- 标题区 -->
      <div class="post-header">
        <el-tag :type="typeTag(post.type)" size="large">{{ typeLabel(post.type) }}</el-tag>
        <el-tag size="large" type="info">{{ statusLabel(post.status) }}</el-tag>
        <h2>{{ post.title || '无标题' }}</h2>
      </div>

      <!-- 结构化标签 -->
      <div class="tag-row">
        <el-tag size="large" effect="plain">{{ post.itemCategory }}</el-tag>
        <el-tag size="large" effect="plain">{{ post.color }}</el-tag>
        <el-tag size="large" effect="plain">{{ post.locationCampus }}</el-tag>
        <el-tag size="large" effect="plain" v-if="post.locationArea">{{ post.locationArea }}</el-tag>
        <el-tag size="large" effect="plain" v-if="post.locationDetail">{{ post.locationDetail }}</el-tag>
        <el-tag size="large" effect="plain" type="warning">{{ post.lostTime }}</el-tag>
      </div>

      <!-- 正文 -->
      <div class="description" v-if="post.description">
        <h4>详细描述</h4>
        <p>{{ post.description }}</p>
      </div>

      <!-- 图片展示 -->
      <div class="image-gallery" v-if="post.images && post.images.length > 0">
        <h4>物品图片</h4>
        <div class="image-grid">
          <el-image
            v-for="(img, idx) in post.images"
            :key="idx"
            :src="imageUrl(img)"
            fit="cover"
            :preview-src-list="post.images.map(i => imageUrl(i))"
            style="width:200px;height:150px;border-radius:4px"
          />
        </div>
      </div>

      <!-- 发布者信息 -->
      <el-card class="publisher-card">
        <div class="publisher-info">
          <el-avatar :size="40">{{ post.nickname?.charAt(0) || 'U' }}</el-avatar>
          <div>
            <div class="publisher-name">{{ post.nickname }}</div>
            <div class="publisher-meta">
              信用分：{{ post.creditScore }} | 发布于 {{ post.createTime?.substring(0, 16) }}
            </div>
          </div>
        </div>
      </el-card>

      <!-- 操作区 -->
      <div class="actions" v-if="isOwner()">
        <el-button type="danger" plain @click="handleDelete">删除帖子</el-button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.detail-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.back-nav {
  margin-bottom: 16px;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.post-header h2 {
  margin: 0;
  flex: 1;
}

.tag-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.description {
  margin-bottom: 20px;
}

.description h4 {
  margin-bottom: 8px;
  color: #303133;
}

.description p {
  color: #606266;
  line-height: 1.8;
  white-space: pre-wrap;
}

.publisher-card {
  margin-bottom: 20px;
}

.publisher-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.publisher-name {
  font-weight: 500;
}

.publisher-meta {
  font-size: 13px;
  color: #909399;
}

.actions {
  display: flex;
  gap: 12px;
}

.image-gallery {
  margin-bottom: 20px;
}

.image-gallery h4 {
  margin-bottom: 10px;
  color: #303133;
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
