<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPostDetail, deletePost } from '@/api/post'
import { createClaim, confirmClaim, getClaimsByPost, completePost } from '@/api/claim'
import { imageUrl } from '@/utils/url'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const post = ref(null)
const loading = ref(true)
const claims = ref([])
const claimLoading = ref(false)

onMounted(async () => {
  try {
    post.value = (await getPostDetail(route.params.id)).data
    if (post.value) loadClaims()
  } finally {
    loading.value = false
  }
})

async function loadClaims() {
  const res = await getClaimsByPost(post.value.id)
  claims.value = res.data
}

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

function canClaim() {
  if (!post.value) return false
  return !isOwner() && (post.value.status === 0 || post.value.status === 1)
}

function findMyClaim() {
  if (!post.value) return null
  return claims.value.find(c => c.claimUserId === currentUserId())
}

async function handleClaim() {
  claimLoading.value = true
  try {
    await createClaim(post.value.id, null)
    ElMessage.success('认领申请已发起')
    loadClaims()
  } catch { /* interceptor handles */ }
  finally { claimLoading.value = false }
}

async function handleConfirm(claimId) {
  try {
    await confirmClaim(claimId)
    ElMessage.success('确认成功')
    const updated = (await getPostDetail(route.params.id)).data
    post.value = updated
    loadClaims()
  } catch { /* interceptor handles */ }
}

async function handleComplete() {
  try {
    await ElMessageBox.confirm('确定标记为已找回/已归还？', '完结帖子', { type: 'info' })
    await completePost(post.value.id)
    ElMessage.success('已标记为完结')
    post.value.status = 3
  } catch { /* cancelled */ }
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
        <el-button class="back-btn" @click="router.push('/')">&larr; 返回广场</el-button>
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

        <!-- 操作按钮组 -->
        <div class="action-buttons">
          <!-- 非发布者可发起认领 -->
          <el-button
            v-if="canClaim() && !findMyClaim()"
            type="primary"
            :loading="claimLoading"
            @click="handleClaim"
          >
            发起认领
          </el-button>
          <el-tag v-if="findMyClaim()" type="warning" style="height:32px">
            已发起认领 · {{ findMyClaim().status === 2 ? '已完结' : findMyClaim().status === 1 ? '部分确认' : '待确认' }}
          </el-tag>

          <!-- 双确认按钮 -->
          <div v-if="claims.length > 0" style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
            <div v-for="c in claims" :key="c.id" style="display:flex;align-items:center;gap:6px">
              <span style="font-size:12px;color:#909399">认领者 {{ c.claimUserId }}</span>
              <el-button
                size="small"
                v-if="(currentUserId() === c.postOwnerId && c.ownerConfirmed === 0) ||
                      (currentUserId() === c.claimUserId && c.claimerConfirmed === 0)"
                @click="handleConfirm(c.id)"
              >
                确认{{ c.status === 2 ? '(已完结)' : '' }}
              </el-button>
              <el-tag v-else size="small" type="success">已确认</el-tag>
            </div>
          </div>

          <!-- 发布者操作 -->
          <div v-if="isOwner()" class="owner-actions">
            <el-button
              v-if="post.status === 0 || post.status === 1"
              type="success" plain round
              @click="handleComplete"
            >
              标记已找回/已归还
            </el-button>
            <el-button type="danger" plain round @click="handleDelete">删除帖子</el-button>
          </div>
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

.back-btn {
  background: rgba(255,255,255,0.9);
  border: 1px solid #e4e7ed;
  color: #606266;
  font-size: 14px;
  border-radius: 8px;
  padding: 8px 18px;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #fff;
  border-color: #409eff;
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

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.owner-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  margin-top: 8px;
}
</style>
