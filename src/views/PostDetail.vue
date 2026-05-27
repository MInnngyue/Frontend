<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getPostDetail, deletePost } from '@/api/post'
import { createClaim, getClaimsByPost, completePost } from '@/api/claim'
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

async function handleClaim() {
  claimLoading.value = true
  try {
    await createClaim(post.value.id, null)
    ElMessage.success('认领申请已发起！可在「认领进度」页面跟踪状态')
    post.value = (await getPostDetail(route.params.id)).data
    loadClaims()
  } catch { }
  finally { claimLoading.value = false }
}
async function handleComplete() { try { await ElMessageBox.confirm('确定标记为已找回/已归还？', '完结帖子', { type: 'info' }); await completePost(post.value.id); ElMessage.success('已标记为完结'); post.value.status = 3 } catch { } }
async function handleDelete() { try { await ElMessageBox.confirm('确定要删除这个帖子吗？', '确认删除', { type: 'warning' }); await deletePost(post.value.id); ElMessage.success('删除成功'); router.push('/') } catch { } }

async function sendComment() { if (!commentText.value.trim()) return; commentSending.value = true; try { await addComment({ postId: post.value.id, content: commentText.value }); commentText.value = ''; loadComments() } catch { } finally { commentSending.value = false } }

function goChat(otherId) { router.push({ path: '/chat', query: { userId: otherId } }) }
</script>

<template>
  <div class="detail-page" v-loading="loading">
    <template v-if="post">
      <div class="back-nav">
        <el-button class="back-btn" @click="router.push('/')">&larr; 返回广场</el-button>
      </div>

      <!-- 标题卡片 -->
      <div class="detail-card header-card">
        <div class="capsule-row">
          <span class="capsule" :class="post.type === 0 ? 'c-lost' : 'c-found'">{{ typeLabel(post.type) }}</span>
          <span class="capsule" :class="'cs-' + post.status">{{ statusLabel(post.status) }}</span>
        </div>
        <h2 class="header-title">{{ post.title || '无标题' }}</h2>
        <div class="capsule-row">
          <span class="capsule c-cat">{{ post.itemCategory }}</span>
          <span class="capsule c-loc">{{ post.locationCampus }}</span>
          <span class="capsule c-time">{{ post.lostTime?.replace('T', ' ') }}</span>
        </div>
      </div>

      <!-- 正文 -->
      <div class="detail-card" v-if="post.description">
        <p class="desc-text">{{ post.description }}</p>
      </div>

      <!-- 图片 -->
      <div class="detail-card" v-if="post.images && post.images.length > 0">
        <div class="image-grid">
          <el-image v-for="(img, idx) in post.images" :key="idx" :src="imageUrl(img)" fit="cover" :preview-src-list="post.images.map(i => imageUrl(i))" class="detail-image" />
        </div>
      </div>

      <!-- 发布者 + 操作 -->
      <div class="detail-card bottom-section">
        <div class="publisher-row">
          <div class="pub-left">
            <div class="pub-avatar">{{ post.nickname?.charAt(0) || 'U' }}</div>
            <div>
              <div class="pub-name">{{ post.nickname }}</div>
              <div class="pub-meta">信用分 {{ post.creditScore }} · {{ post.createTime?.substring(0, 16).replace('T', ' ') }}</div>
            </div>
          </div>
          <div class="pub-right">
            <el-button v-if="!isOwner()" size="small" class="dm-btn" @click="goChat(post.userId)">私信</el-button>
          </div>
        </div>

        <div class="action-area">
          <el-button v-if="canClaim() && !findMyClaim()" class="action-btn claim-btn" :loading="claimLoading" @click="handleClaim">{{ claimLabel() }}</el-button>
          <el-button v-if="findMyClaim()" class="action-btn goto-claim-btn" @click="router.push('/claims')">前往认领进度</el-button>

          <div v-if="isOwner()" class="owner-actions">
            <el-button v-if="post.status === 0 || post.status === 1" class="action-btn complete-btn" @click="handleComplete">标记已找回/已归还</el-button>
            <el-button class="action-btn delete-btn" @click="handleDelete">删除帖子</el-button>
          </div>
        </div>
      </div>

      <!-- 评论区 -->
      <div class="detail-card" id="comments-section">
        <h3 class="section-heading">评论 ({{ comments.length }})</h3>
        <div class="comment-input">
          <el-input v-model="commentText" placeholder="发表评论..." maxlength="500" show-word-limit :rows="2" type="textarea" />
          <el-button class="send-comment-btn" :loading="commentSending" @click="sendComment">发送</el-button>
        </div>
        <div class="comment-list" v-if="comments.length > 0">
          <div v-for="c in comments" :key="c.id" class="comment-item">
            <span class="cmt-avatar">{{ c.nickname?.charAt(0) || 'U' }}</span>
            <div class="cmt-body">
              <div class="cmt-header"><span class="cmt-name">{{ c.nickname }}</span><span class="cmt-time">{{ c.createTime?.substring(0, 16).replace('T', ' ') }}</span></div>
              <div class="cmt-content">{{ c.content }}</div>
            </div>
          </div>
        </div>
        <div v-else class="empty-comments">暂无评论</div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* ===== Page Layout ===== */
.detail-page { max-width: 800px; margin: 0 auto; padding: 24px 20px 48px; background: #f8fafc; min-height: 100vh; }

/* ===== Back Navigation ===== */
.back-nav { margin-bottom: 20px; }
.back-btn { background: #fff; border: 1px solid #e2e8f0; color: #475569; font-size: 14px; border-radius: 8px; padding: 8px 18px; transition: all 0.15s; }
.back-btn:hover { background: #f8fafc; border-color: #cbd5e1; color: #1e293b; }

/* ===== Detail Card Base ===== */
.detail-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 24px 28px;
  margin-bottom: 12px;
}

/* ===== Header Card ===== */
.header-card { padding: 28px 32px; }
.header-title { font-size: 22px; font-weight: 700; color: #1e293b; margin: 14px 0 12px; line-height: 1.4; }

/* ===== Capsules (type, status, category, location, time) ===== */
.capsule-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.capsule { padding: 4px 12px; border-radius: 6px; font-size: 13px; font-weight: 600; }
/* Type */
.c-lost { background: #fee2e2; color: #b91c1c; }
.c-found { background: #dcfce7; color: #15803d; }
/* Status */
.cs-0 { background: #eef2ff; color: #4338ca; }
.cs-1, .cs-2 { background: #fef3c7; color: #b45309; }
.cs-3 { background: #dcfce7; color: #15803d; }
.cs-4, .cs-5 { background: #f1f5f9; color: #64748b; }
/* Meta */
.c-cat { background: #eef2ff; color: #4f46e5; }
.c-loc { background: #f1f5f9; color: #475569; }
.c-time { background: #f8fafc; color: #64748b; }

/* ===== Description ===== */
.desc-text { color: #475569; line-height: 1.8; white-space: pre-wrap; margin: 0; font-size: 15px; }

/* ===== Images ===== */
.image-grid { display: flex; flex-wrap: wrap; gap: 12px; }
.detail-image { width: 100%; max-width: 560px; height: 420px; border-radius: 10px; border: 1px solid #e2e8f0; }

/* ===== Publisher ===== */
.bottom-section { padding: 24px 28px; }
.publisher-row { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px solid #f1f5f9; margin-bottom: 16px; }
.pub-left { display: flex; align-items: center; gap: 12px; }
.pub-avatar {
  width: 44px; height: 44px; border-radius: 50%;
  background: #4f46e5; color: #fff;
  font-size: 18px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.pub-name { font-size: 16px; font-weight: 600; color: #1e293b; }
.pub-meta { font-size: 13px; color: #64748b; margin-top: 2px; }
.dm-btn { background: #eef2ff; border: 1px solid #c7d2fe; color: #4338ca; border-radius: 8px; font-size: 14px; padding: 8px 20px; font-weight: 600; }
.dm-btn:hover { background: #e0e7ff; border-color: #a5b4fc; }

/* ===== Actions ===== */
.action-area { display: flex; flex-direction: column; gap: 10px; }
.action-btn { height: 42px; border-radius: 8px; font-size: 15px; padding: 0 24px; font-weight: 600; border: none; }
.claim-btn { width: 100%; background: #4f46e5; color: #fff; }
.claim-btn:hover { background: #4338ca; }
.goto-claim-btn { width: 100%; background: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; }
.goto-claim-btn:hover { background: #e0e7ff; border-color: #a5b4fc; color: #3730a3; }
.owner-actions { display: flex; gap: 10px; justify-content: flex-end; }
.complete-btn { background: #dcfce7; color: #15803d; }
.complete-btn:hover { background: #bbf7d0; }
.delete-btn { background: #fee2e2; color: #b91c1c; }
.delete-btn:hover { background: #fecaca; }

/* ===== Comments ===== */
.section-heading { font-size: 17px; font-weight: 700; color: #1e293b; margin: 0 0 16px; }
.comment-input { margin-bottom: 20px; display: flex; flex-direction: column; align-items: flex-end; }
.send-comment-btn { margin-top: 10px; background: #4f46e5; border-color: #4f46e5; color: #fff; font-size: 16px; padding: 10px 24px; border-radius: 8px; font-weight: 600; }
.send-comment-btn:hover { background: #4338ca; border-color: #4338ca; }

.comment-list { display: flex; flex-direction: column; gap: 16px; }
.comment-item { display: flex; gap: 12px; padding: 12px; background: #f8fafc; border-radius: 8px; }
.cmt-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: #4f46e5; color: #fff;
  font-size: 14px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.cmt-body { flex: 1; min-width: 0; }
.cmt-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.cmt-name { font-size: 14px; font-weight: 600; color: #1e293b; }
.cmt-time { font-size: 12px; color: #94a3b8; }
.cmt-content { font-size: 14px; color: #475569; line-height: 1.6; word-break: break-word; }
.empty-comments { color: #94a3b8; text-align: center; padding: 24px; font-size: 14px; }
</style>
