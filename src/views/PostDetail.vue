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
  <div class="page detail-page" v-loading="loading">
    <template v-if="post">
      <div class="back-nav">
        <button class="btn-icon back-btn" @click="router.push('/')">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        </button>
      </div>

      <div class="card-wrap">
        <div class="bind-rings"><span></span><span></span><span></span><span></span></div>
        <div class="note-card detail-card header-card">
          <div class="tag-row">
            <span class="tag-type" :class="post.type === 0 ? 'lost' : 'found'">{{ typeLabel(post.type) }}</span>
            <span class="tag-status" :class="'s-' + post.status">{{ statusLabel(post.status) }}</span>
          </div>
          <h2 class="header-title">{{ post.title || '无标题' }}</h2>
          <div class="meta-row">
            <span class="meta-cat">{{ post.itemCategory }}</span>
            <span class="meta-sep">·</span>
            <span class="meta-loc">{{ post.locationCampus }}</span>
            <span class="meta-sep">·</span>
            <span class="meta-time">{{ post.lostTime?.replace('T', ' ') }}</span>
          </div>
        </div>
      </div>

      <div class="card-wrap" v-if="post.description">
        <div class="bind-rings"><span></span><span></span><span></span><span></span></div>
        <div class="note-card detail-card">
          <p class="desc-text">{{ post.description }}</p>
        </div>
      </div>

      <div class="card-wrap" v-if="post.images && post.images.length > 0">
        <div class="bind-rings"><span></span><span></span><span></span><span></span></div>
        <div class="note-card detail-card">
          <div class="image-grid">
            <el-image v-for="(img, idx) in post.images" :key="idx" :src="imageUrl(img)" fit="cover" :preview-src-list="post.images.map(i => imageUrl(i))" class="detail-image" />
          </div>
        </div>
      </div>

      <div class="card-wrap">
        <div class="bind-rings"><span></span><span></span><span></span><span></span></div>
        <div class="note-card detail-card bottom-section">
          <div class="publisher-row">
            <div class="pub-left">
              <div class="avatar avatar-lg">{{ post.nickname?.charAt(0) || 'U' }}</div>
              <div>
                <div class="pub-name">{{ post.nickname }}</div>
                <div class="pub-meta">信用分 {{ post.creditScore }} · {{ post.createTime?.substring(0, 16).replace('T', ' ') }}</div>
              </div>
            </div>
            <div class="pub-right">
              <button v-if="!isOwner()" class="btn-secondary dm-btn" @click="goChat(post.userId)">私信</button>
            </div>
          </div>

          <div class="action-area">
            <button v-if="canClaim() && !findMyClaim()" class="btn-primary action-btn claim-btn" :disabled="claimLoading" @click="handleClaim">
              {{ claimLoading ? '处理中...' : claimLabel() }}
            </button>
            <button v-if="findMyClaim()" class="btn-secondary action-btn goto-claim-btn" @click="router.push('/claims')">前往认领进度</button>

            <div v-if="isOwner()" class="owner-actions">
              <button v-if="post.status === 0 || post.status === 1" class="btn-secondary action-btn" @click="handleComplete">标记已找回/已归还</button>
              <button class="btn-danger action-btn" @click="handleDelete">删除帖子</button>
            </div>
          </div>
        </div>
      </div>

      <div class="card-wrap" id="comments-section">
        <div class="bind-rings"><span></span><span></span><span></span><span></span></div>
        <div class="note-card detail-card">
          <h3 class="section-heading">评论 ({{ comments.length }})</h3>
          <div class="comment-input">
            <el-input v-model="commentText" placeholder="发表评论..." maxlength="500" show-word-limit :rows="2" type="textarea" />
            <button class="btn-primary send-comment-btn" :disabled="commentSending" @click="sendComment">
              {{ commentSending ? '发送中...' : '发送' }}
            </button>
          </div>
          <div class="comment-list" v-if="comments.length > 0">
            <div v-for="c in comments" :key="c.id" class="comment-item">
              <span class="avatar avatar-md cmt-avatar">{{ c.nickname?.charAt(0) || 'U' }}</span>
              <div class="cmt-body">
                <div class="cmt-header">
                  <span class="cmt-name">{{ c.nickname }}</span>
                  <span class="cmt-time">{{ c.createTime?.substring(0, 16).replace('T', ' ') }}</span>
                </div>
                <div class="cmt-content">{{ c.content }}</div>
              </div>
            </div>
          </div>
          <div v-else class="empty-comments">暂无评论</div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.detail-page { max-width: 800px; padding-bottom: 48px; }

.back-nav { margin-bottom: 22px; }
.back-btn { width: 36px; height: 36px; }

.detail-card { padding: 24px 28px; margin-bottom: 11px; }
.detail-card:last-child { margin-bottom: 0; }

.header-card { padding: 26px 32px; }
.header-title {
  font-family: var(--pen-font);
  font-size: var(--fs-h2);
  font-weight: 700;
  color: var(--ink-900);
  margin: 14px 0 12px;
  line-height: 1.4;
}

.tag-row { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
.meta-row {
  display: flex; gap: 4px; flex-wrap: wrap; align-items: center;
  font-size: var(--fs-small); color: var(--ink-500);
}
.meta-cat { color: var(--indigo); font-weight: 500; }
.meta-sep { color: var(--ink-300); }
.meta-loc { color: var(--ink-700); }
.meta-time { font-family: var(--mono-font); color: var(--ink-300); }

.desc-text {
  color: var(--ink-700);
  line-height: 1.8;
  white-space: pre-wrap;
  margin: 0;
  font-size: var(--fs-body);
}

.image-grid { display: flex; flex-wrap: wrap; gap: 10px; }
.detail-image {
  width: 100%; max-width: 560px; height: 420px;
}

.bottom-section { padding: 22px 28px; }
.publisher-row {
  display: flex; justify-content: space-between; align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--page-edge);
  margin-bottom: 16px;
}
.pub-left { display: flex; align-items: center; gap: 12px; }
.pub-name { font-size: var(--fs-body); font-weight: 600; color: var(--ink-900); }
.pub-meta {
  font-size: var(--fs-small); color: var(--ink-500); margin-top: 2px;
  font-family: var(--mono-font);
}
.dm-btn { font-size: 14px; padding: 8px 20px; }

.action-area { display: flex; flex-direction: column; gap: 10px; }
.action-btn {
  height: 42px; font-size: var(--fs-body); padding: 0 24px;
  font-weight: 600;
}
.action-btn:active { transform: scale(0.98); }
.claim-btn { width: 100%; }
.goto-claim-btn { width: 100%; }
.owner-actions { display: flex; gap: 10px; justify-content: flex-end; }

.section-heading {
  font-family: var(--pen-font);
  font-size: var(--fs-h3);
  font-weight: 700;
  color: var(--ink-900);
  margin: 0 0 16px;
}
.comment-input {
  margin-bottom: 18px;
  display: flex; flex-direction: column; align-items: flex-end;
}
.send-comment-btn { margin-top: 10px; font-size: 15px; padding: 10px 24px; }
.send-comment-btn:active { transform: scale(0.97); }

.comment-list { display: flex; flex-direction: column; gap: 14px; }
.comment-item {
  display: flex; gap: 12px; padding: 12px;
  background: var(--page);
  border-radius: var(--r-btn);
  border: 1px solid #f3f4f6;
  transition: var(--transition);
}
.comment-item:hover { background: #f9fafb; }
.cmt-avatar { background: var(--moss); }
.cmt-body { flex: 1; min-width: 0; }
.cmt-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.cmt-name { font-size: 14px; font-weight: 600; color: var(--ink-900); }
.cmt-time { font-size: var(--fs-caption); color: var(--ink-300); font-family: var(--mono-font); }
.cmt-content { font-size: 14px; color: var(--ink-700); line-height: 1.6; word-break: break-word; }
.empty-comments { color: var(--ink-300); text-align: center; padding: 24px; font-size: 14px; }
</style>
