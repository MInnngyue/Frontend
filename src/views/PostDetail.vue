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
  // scroll to #comments if hash present
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

      <div class="detail-card" v-if="post.description">
        <p class="desc-text">{{ post.description }}</p>
      </div>

      <div class="detail-card" v-if="post.images && post.images.length > 0">
        <div class="image-grid">
          <el-image v-for="(img, idx) in post.images" :key="idx" :src="imageUrl(img)" fit="cover" :preview-src-list="post.images.map(i => imageUrl(i))" class="detail-image" />
        </div>
      </div>

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
.detail-page { max-width: 800px; margin: 0 auto; padding: 22px 20px 48px; background: #faf6ee; min-height: 100vh; }

.back-nav { margin-bottom: 22px; }
.back-btn { background: #f3ecdb; border: 1px solid #d9cfb8; color: #5c5448; font-size: 14px; border-radius: 6px; padding: 8px 18px; transition: all 0.15s; }
.back-btn:hover { background: #e8dfc6; border-color: #c4b896; color: #2d2a26; }
.back-btn:active { transform: scale(0.97); }

/* bulletin paper card */
.detail-card {
  background: #f3ecdb;
  border: 1px solid #d9cfb8;
  border-bottom: 3px solid #c4b896;
  border-radius: 6px;
  padding: 24px 28px;
  margin-bottom: 11px;
}

.header-card { padding: 26px 32px; }
.header-title { font-family: 'Noto Serif SC', Georgia, serif; font-size: 22px; font-weight: 700; color: #2d2a26; margin: 14px 0 12px; line-height: 1.4; }

.capsule-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.capsule { padding: 4px 12px; border-radius: 4px; font-size: 13px; font-weight: 600; }
.c-lost { background: #f7ede9; color: #c8553d; border: 1px solid #e2a294; }
.c-found { background: #e8efd9; color: #547039; border: 1px solid #b5cc97; }
.cs-0 { background: #f7ede9; color: #a8442f; }
.cs-1, .cs-2 { background: #f5ebd6; color: #8a6535; }
.cs-3 { background: #e8efd9; color: #547039; }
.cs-4, .cs-5 { background: #e8dfc6; color: #8a8170; }
.c-cat { background: #f7ede9; color: #c8553d; }
.c-loc { background: #e8dfc6; color: #5c5448; }
.c-time { background: #faf6ee; color: #8a8170; font-family: 'JetBrains Mono', 'Courier New', monospace; }

.desc-text { color: #5c5448; line-height: 1.8; white-space: pre-wrap; margin: 0; font-size: 15px; }

.image-grid { display: flex; flex-wrap: wrap; gap: 10px; }
.detail-image { width: 100%; max-width: 560px; height: 420px; border-radius: 6px; border: 1px solid #d9cfb8; }

.bottom-section { padding: 22px 28px; }
.publisher-row { display: flex; justify-content: space-between; align-items: center; padding-bottom: 16px; border-bottom: 1px solid #e8dfc6; margin-bottom: 16px; }
.pub-left { display: flex; align-items: center; gap: 12px; }
.pub-avatar {
  width: 44px; height: 44px; border-radius: 50%;
  background: #c8553d; color: #faf6ee;
  font-size: 18px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.pub-name { font-size: 16px; font-weight: 600; color: #2d2a26; }
.pub-meta { font-size: 13px; color: #8a8170; margin-top: 2px; font-family: 'JetBrains Mono', 'Courier New', monospace; }
.dm-btn { background: #f7ede9; border: 1px solid #e2a294; color: #c8553d; border-radius: 6px; font-size: 14px; padding: 8px 20px; font-weight: 600; transition: transform 0.15s; }
.dm-btn:hover { background: #f0ddd5; border-color: #c8553d; transform: translateY(-1px); }
.dm-btn:active { transform: scale(0.97); }

.action-area { display: flex; flex-direction: column; gap: 10px; }
.action-btn { height: 42px; border-radius: 6px; font-size: 15px; padding: 0 24px; font-weight: 600; border: none; transition: transform 0.15s; }
.action-btn:active { transform: scale(0.98); }
.claim-btn { width: 100%; background: #c9956b; color: #faf6ee; }
.claim-btn:hover { background: #b07a4f; }
.goto-claim-btn { width: 100%; background: #f7ede9; color: #c8553d; border: 1px solid #e2a294; }
.goto-claim-btn:hover { background: #f0ddd5; border-color: #c8553d; color: #a8442f; }
.owner-actions { display: flex; gap: 10px; justify-content: flex-end; }
.complete-btn { background: #e8efd9; color: #547039; }
.complete-btn:hover { background: #d4e0c0; }
.delete-btn { background: #f7ede9; color: #b54a3a; }
.delete-btn:hover { background: #f0ddd5; }

.section-heading { font-family: 'Noto Serif SC', Georgia, serif; font-size: 17px; font-weight: 700; color: #2d2a26; margin: 0 0 16px; }
.comment-input { margin-bottom: 18px; display: flex; flex-direction: column; align-items: flex-end; }
:deep(.comment-input .el-textarea__inner) {
  background: #faf6ee; border-color: #d9cfb8; border-radius: 6px; color: #2d2a26;
}
:deep(.comment-input .el-textarea__inner:focus) { border-color: #c8553d; }
.send-comment-btn { margin-top: 10px; background: #c8553d; border-color: #c8553d; color: #faf6ee; font-size: 16px; padding: 10px 24px; border-radius: 6px; font-weight: 600; transition: transform 0.15s; }
.send-comment-btn:hover { background: #a8442f; border-color: #a8442f; }
.send-comment-btn:active { transform: scale(0.97); }

.comment-list { display: flex; flex-direction: column; gap: 14px; }
.comment-item { display: flex; gap: 12px; padding: 12px; background: #faf6ee; border-radius: 6px; border: 1px solid #e8dfc6; transition: background 0.15s; }
.comment-item:hover { background: #f3ecdb; }
.cmt-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: #6b8e4e; color: #faf6ee;
  font-size: 14px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.cmt-body { flex: 1; min-width: 0; }
.cmt-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.cmt-name { font-size: 14px; font-weight: 600; color: #2d2a26; }
.cmt-time { font-size: 12px; color: #b0a690; font-family: 'JetBrains Mono', 'Courier New', monospace; }
.cmt-content { font-size: 14px; color: #5c5448; line-height: 1.6; word-break: break-word; }
.empty-comments { color: #b0a690; text-align: center; padding: 24px; font-size: 14px; }
</style>
