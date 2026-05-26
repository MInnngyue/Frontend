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

function claimLabel() {
  if (!post.value) return '发起认领'
  return post.value.type === 0 ? '我捡到了这个物品' : '这是我的物品'
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
          <span class="capsule capsule-type" :class="post.type === 0 ? 'lost' : 'found'">{{ typeLabel(post.type) }}</span>
          <span class="capsule capsule-status">{{ statusLabel(post.status) }}</span>
        </div>
        <h2 class="header-title">{{ post.title || '无标题' }}</h2>
        <div class="capsule-row">
          <span class="capsule capsule-field">{{ post.itemCategory }}</span>
          <span class="capsule capsule-field">{{ post.color }}</span>
          <span class="capsule capsule-field">{{ post.locationCampus }}</span>
          <span class="capsule capsule-field" v-if="post.locationArea">{{ post.locationArea }}</span>
          <span class="capsule capsule-field" v-if="post.locationDetail">{{ post.locationDetail }}</span>
          <span class="capsule capsule-time">{{ post.lostTime }}</span>
        </div>
      </div>

      <!-- 正文 -->
      <div class="content-card" v-if="post.description">
        <h4>详细描述</h4>
        <p>{{ post.description }}</p>
      </div>

      <!-- 图片展示 -->
      <div class="content-card" v-if="post.images && post.images.length > 0">
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
            class="action-btn claim-btn"
            :loading="claimLoading"
            @click="handleClaim"
          >
            {{ claimLabel() }}
          </el-button>
          <el-tag v-if="findMyClaim()" type="warning" class="claim-status-tag">
            已发起认领 · {{ findMyClaim().status === 2 ? '已完结' : findMyClaim().status === 1 ? '部分确认' : '待确认' }}
          </el-tag>

          <!-- 双确认按钮 -->
          <div v-if="claims.length > 0" class="confirm-row">
            <div v-for="c in claims" :key="c.id" class="confirm-item">
              <span class="confirm-hint">认领者 {{ c.claimUserId }}</span>
              <el-button
                class="action-btn confirm-btn"
                v-if="(currentUserId() === c.postOwnerId && c.ownerConfirmed === 0) ||
                      (currentUserId() === c.claimUserId && c.claimerConfirmed === 0)"
                @click="handleConfirm(c.id)"
              >
                确认{{ c.status === 2 ? '(已完结)' : '' }}
              </el-button>
              <el-tag v-else size="small" type="success" class="confirmed-tag">已确认</el-tag>
            </div>
          </div>

          <!-- 发布者操作 -->
          <div v-if="isOwner()" class="owner-actions">
            <el-button
              v-if="post.status === 0 || post.status === 1"
              type="success" class="action-btn"
              @click="handleComplete"
            >
              标记已找回/已归还
            </el-button>
            <el-button type="danger" class="action-btn" @click="handleDelete">删除帖子</el-button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.detail-page { max-width: 860px; margin: 0 auto; padding: 24px 20px 32px; }
.back-nav { margin-bottom: 16px; }
.back-btn {
  background: rgba(255,255,255,0.9); border: 1px solid #e4e7ed; color: #606266;
  font-size: 14px; border-radius: 8px; padding: 8px 18px; transition: all 0.2s;
}
.back-btn:hover { background: #fff; border-color: #409eff; color: #409eff; }

/* Header */
.header-card {
  background: #5a67d8;
  border-radius: 16px; padding: 28px 32px; margin-bottom: 16px; color: #fff;
}
.header-tags { display: flex; gap: 10px; margin-bottom: 14px; }
.header-title { font-size: 22px; font-weight: 700; margin: 0 0 14px; }

/* Capsules */
.capsule {
  padding: 5px 14px; border-radius: 20px; font-size: 13px; font-weight: 600; color: #fff;
}
.capsule-type.lost { background: #f56c6c; }
.capsule-type.found { background: #67c23a; }
.capsule-status { background: rgba(255,255,255,0.25); }
.capsule-field { background: rgba(255,255,255,0.2); }
.capsule-time { background: #ffd04b; color: #303133; }

.capsule-row {
  display: flex; gap: 8px; flex-wrap: wrap; align-items: center;
}

/* Content */
.content-card {
  background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.content-card p { color: #606266; line-height: 1.8; white-space: pre-wrap; margin: 0; }

/* Images — larger */
.image-grid { display: flex; flex-wrap: wrap; gap: 12px; }
.detail-image { width: 100%; max-width: 380px; height: 280px; border-radius: 10px; overflow: hidden; }

/* Bottom */
.bottom-section {
  background: #fff; border-radius: 12px; padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.publisher-card { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
.publisher-avatar {
  width: 44px; height: 44px; border-radius: 50%;
  background: #409eff;
  color: #fff; font-size: 18px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.publisher-name { font-size: 16px; font-weight: 600; color: #303133; }
.publisher-meta { font-size: 13px; color: #909399; margin-top: 2px; }

/* Action Buttons — rectangular, taller */
.action-buttons { display: flex; flex-direction: column; gap: 10px; }
.action-btn {
  height: 44px; border-radius: 8px; font-size: 15px; padding: 0 28px; font-weight: 600;
}
.claim-btn { width: 100%; }
.claim-status-tag { height: 36px; font-size: 14px; display: inline-flex; align-items: center; }

.confirm-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 4px; }
.confirm-item { display: flex; align-items: center; gap: 8px; }
.confirm-hint { font-size: 12px; color: #909399; }
.confirmed-tag { height: 36px; display: inline-flex; align-items: center; }

.owner-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 8px; }
</style>
