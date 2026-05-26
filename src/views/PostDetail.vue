<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPostDetail, deletePost } from '@/api/post'
import { createClaim, confirmClaim, getClaimsByPost, completePost } from '@/api/claim'
import { getComments, addComment } from '@/api/comment'
import { imageUrl } from '@/utils/url'
import { ElMessage, ElMessageBox } from 'element-plus'

const route = useRoute()
const router = useRouter()
const post = ref(null)
const loading = ref(true)
const claims = ref([])
const claimLoading = ref(false)
const comments = ref([])
const commentText = ref('')
const commentSending = ref(false)

onMounted(async () => {
  try {
    post.value = (await getPostDetail(route.params.id)).data
    if (post.value) { loadClaims(); loadComments() }
  } finally { loading.value = false }
  // 如果URL hash是 #comments，滚动到评论区
  if (route.hash === '#comments') nextTick(() => document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' }))
})

async function loadClaims() { const res = await getClaimsByPost(post.value.id); claims.value = res.data }
async function loadComments() { const res = await getComments(post.value.id); comments.value = res.data }

function typeLabel(type) { return type === 0 ? '寻物启事' : '失物招领' }
function statusLabel(status) { const map = { 0: '进行中', 1: '已匹配', 2: '认领中', 3: '已完结', 4: '已归档', 5: '已下架' }; return map[status] || '未知' }
function currentUserId() { const info = localStorage.getItem('userInfo'); if (!info) return null; try { return JSON.parse(info).userId || JSON.parse(info).id } catch { return null } }
function isOwner() { if (!post.value) return false; return post.value.userId === currentUserId() }
function canClaim() { if (!post.value) return false; return !isOwner() && (post.value.status === 0 || post.value.status === 1) }
function findMyClaim() { if (!post.value) return null; return claims.value.find(c => c.claimUserId === currentUserId()) }
function claimLabel() { if (!post.value) return '发起认领'; return post.value.type === 0 ? '我捡到了这个物品' : '这是我的物品' }

async function handleClaim() { claimLoading.value = true; try { await createClaim(post.value.id, null); ElMessage.success('认领申请已发起'); loadClaims() } catch { } finally { claimLoading.value = false } }
async function handleConfirm(claimId) { try { await confirmClaim(claimId); ElMessage.success('确认成功'); post.value = (await getPostDetail(route.params.id)).data; loadClaims() } catch { } }
async function handleComplete() { try { await ElMessageBox.confirm('确定标记为已找回/已归还？', '完结帖子', { type: 'info' }); await completePost(post.value.id); ElMessage.success('已标记为完结'); post.value.status = 3 } catch { } }
async function handleDelete() { try { await ElMessageBox.confirm('确定要删除这个帖子吗？', '确认删除', { type: 'warning' }); await deletePost(post.value.id); ElMessage.success('删除成功'); router.push('/') } catch { } }

async function sendComment() { if (!commentText.value.trim()) return; commentSending.value = true; try { await addComment({ postId: post.value.id, content: commentText.value }); commentText.value = ''; loadComments() } catch { } finally { commentSending.value = false } }

function goChat(otherId) { router.push({ path: '/chat', query: { userId: otherId } }) }
</script>

<template>
  <div class="detail-page" v-loading="loading">
    <template v-if="post">
      <div class="back-nav"><el-button class="back-btn" @click="router.push('/')">&larr; 返回广场</el-button></div>

      <!-- 标题卡片 -->
      <div class="header-card">
        <div class="capsule-row">
          <span class="capsule" :class="post.type === 0 ? 'c-lost' : 'c-found'">{{ typeLabel(post.type) }}</span>
          <span class="capsule" :class="'cs-' + post.status">{{ statusLabel(post.status) }}</span>
        </div>
        <h2 class="header-title">{{ post.title || '无标题' }}</h2>
        <div class="capsule-row">
          <span class="capsule c-cat">{{ post.itemCategory }}</span>
          <span class="capsule c-loc">{{ post.locationCampus }}</span>
          <span class="capsule c-time">{{ post.lostTime }}</span>
        </div>
      </div>

      <!-- 正文 -->
      <div class="content-card" v-if="post.description">
        <p>{{ post.description }}</p>
      </div>

      <!-- 图片 -->
      <div class="content-card" v-if="post.images && post.images.length > 0">
        <div class="image-grid">
          <el-image v-for="(img, idx) in post.images" :key="idx" :src="imageUrl(img)" fit="cover" :preview-src-list="post.images.map(i => imageUrl(i))" class="detail-image" />
        </div>
      </div>

      <!-- 发布者 + 操作 -->
      <div class="bottom-section">
        <div class="publisher-row">
          <div class="pub-left">
            <div class="pub-avatar">{{ post.nickname?.charAt(0) || 'U' }}</div>
            <div>
              <div class="pub-name">{{ post.nickname }}</div>
              <div class="pub-meta">信用分 {{ post.creditScore }} · {{ post.createTime?.substring(0, 16) }}</div>
            </div>
          </div>
          <div class="pub-right">
            <el-button v-if="!isOwner()" size="small" class="dm-btn" @click="goChat(post.userId)">私信</el-button>
          </div>
        </div>

        <div class="action-area">
          <el-button v-if="canClaim() && !findMyClaim()" class="action-btn claim-btn" :loading="claimLoading" @click="handleClaim">{{ claimLabel() }}</el-button>
          <el-tag v-if="findMyClaim()" type="warning" class="claim-status-tag">已发起认领 · {{ findMyClaim().status === 2 ? '已完结' : findMyClaim().status === 1 ? '部分确认' : '待确认' }}</el-tag>

          <div v-if="claims.length > 0" class="confirm-row">
            <div v-for="c in claims" :key="c.id" class="confirm-item">
              <span class="confirm-hint">认领者 ID {{ c.claimUserId }}</span>
              <el-button class="action-btn" v-if="(currentUserId() === c.postOwnerId && c.ownerConfirmed === 0) || (currentUserId() === c.claimUserId && c.claimerConfirmed === 0)" @click="handleConfirm(c.id)">确认</el-button>
              <el-tag v-else size="small" type="success">已确认</el-tag>
            </div>
          </div>

          <div v-if="isOwner()" class="owner-actions">
            <el-button v-if="post.status === 0 || post.status === 1" class="action-btn" type="success" @click="handleComplete">标记已找回/已归还</el-button>
            <el-button class="action-btn" type="danger" @click="handleDelete">删除帖子</el-button>
          </div>
        </div>
      </div>

      <!-- 评论区 -->
      <div class="content-card" id="comments-section">
        <h3>评论 ({{ comments.length }})</h3>
        <div class="comment-input">
          <el-input v-model="commentText" placeholder="发表评论..." maxlength="500" show-word-limit :rows="2" type="textarea" />
          <el-button type="primary" size="small" :loading="commentSending" @click="sendComment" style="margin-top:8px">发送</el-button>
        </div>
        <div class="comment-list" v-if="comments.length > 0">
          <div v-for="c in comments" :key="c.id" class="comment-item">
            <span class="cmt-avatar">{{ c.nickname?.charAt(0) || 'U' }}</span>
            <div class="cmt-body">
              <div class="cmt-header"><span class="cmt-name">{{ c.nickname }}</span><span class="cmt-time">{{ c.createTime?.substring(0, 16) }}</span></div>
              <div class="cmt-content">{{ c.content }}</div>
            </div>
          </div>
        </div>
        <div v-else style="color:#c0c4cc;text-align:center;padding:20px">暂无评论</div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.detail-page { max-width: 800px; margin: 0 auto; padding: 24px 20px 32px; }
.back-nav { margin-bottom: 16px; }
.back-btn { background: #fff; border: 1px solid #d6d0ca; color: #606266; font-size: 14px; border-radius: 8px; padding: 8px 18px; }

/* Header */
.header-card { background: #fff; border-radius: 12px; padding: 28px 32px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.header-title { font-size: 22px; font-weight: 700; color: #111827; margin: 12px 0 10px; }

/* Capsules */
.capsule-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.capsule { padding: 5px 14px; border-radius: 20px; font-size: 14px; font-weight: 600; color: #fff; }
.c-lost { background: #ef4444; }
.c-found { background: #0891b2; }
.cs-0 { background: #3b82f6; }
.cs-1, .cs-2 { background: #f59e0b; }
.cs-3 { background: #86d3a4; }
.cs-4, .cs-5 { background: #6b7280; }
.c-cat { background: rgba(20,184,166,0.12); color: #0d9488; }
.c-loc { background: rgba(236,72,153,0.12); color: #db2777; }
.c-time { background: rgba(14,165,233,0.12); color: #0284c7; }

/* Content */
.content-card { background: #fff; border-radius: 12px; padding: 20px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.content-card p { color: #606266; line-height: 1.8; white-space: pre-wrap; margin: 0; }

/* Images */
.image-grid { display: flex; flex-wrap: wrap; gap: 12px; }
.detail-image { width: 100%; max-width: 560px; height: 420px; border-radius: 10px; }

/* Publisher */
.bottom-section { background: #fff; border-radius: 12px; padding: 20px 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); margin-bottom: 12px; }
.publisher-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.pub-left { display: flex; align-items: center; gap: 12px; }
.pub-avatar { width: 44px; height: 44px; border-radius: 50%; background: #409eff; color: #fff; font-size: 18px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.pub-name { font-size: 16px; font-weight: 600; color: #303133; }
.pub-meta { font-size: 13px; color: #909399; }
.dm-btn { background: #f3f4f6; border: 1px solid #e5e7eb; color: #4b5563; border-radius: 8px; font-size: 15px; padding: 9px 24px; font-weight: 600; }
.dm-btn:hover { background: #e5e7eb; }

/* Actions */
.action-area { display: flex; flex-direction: column; gap: 8px; }
.action-btn { height: 42px; border-radius: 8px; font-size: 15px; padding: 0 24px; font-weight: 600; }
.claim-btn { width: 100%; background: #3b82f6; border: none; color: #fff; }
.claim-status-tag { height: 36px; font-size: 14px; }
.confirm-row { display: flex; gap: 8px; flex-wrap: wrap; }
.confirm-item { display: flex; align-items: center; gap: 8px; }
.confirm-hint { font-size: 12px; color: #909399; }
.owner-actions { display: flex; gap: 10px; justify-content: flex-end; }

/* Comments */
.comment-input { margin-bottom: 16px; }
.comment-list { display: flex; flex-direction: column; gap: 12px; }
.comment-item { display: flex; gap: 10px; }
.cmt-avatar { width: 32px; height: 32px; border-radius: 50%; background: #409eff; color: #fff; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cmt-body { flex: 1; }
.cmt-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.cmt-name { font-size: 13px; font-weight: 600; color: #303133; }
.cmt-time { font-size: 11px; color: #c0c4cc; }
.cmt-content { font-size: 14px; color: #606266; line-height: 1.6; }
</style>
