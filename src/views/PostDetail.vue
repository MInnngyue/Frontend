<script setup>
import { ref, onBeforeUnmount, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, CircleCheck, Clock3, Mail, MapPin, Send, Tag, Trash2 } from 'lucide-vue-next'
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
let revealObserver = null

function observeRevealElements() {
  const pageRoot = document.querySelector('.detail-page')
  const elements = pageRoot?.querySelectorAll('[data-reveal]:not(.is-visible)') || []

  if (!revealObserver) {
    elements.forEach((element) => element.classList.add('is-visible'))
    return
  }

  elements.forEach((element) => revealObserver.observe(element))
}

function initRevealObserver() {
  if (!('IntersectionObserver' in window)) return
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        revealObserver?.unobserve(entry.target)
      })
    },
    { threshold: 0.12, rootMargin: '0px 0px -36px' },
  )
}

onMounted(async () => {
  initRevealObserver()
  try {
    post.value = (await getPostDetail(route.params.id)).data
    if (post.value) {
      loadClaims()
      loadComments()
    }
  } finally {
    loading.value = false
  }
  await nextTick()
  observeRevealElements()
  if (route.hash === '#comments')
    document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' })
})

onBeforeUnmount(() => revealObserver?.disconnect())

async function loadClaims() {
  const res = await getClaimsByPost(post.value.id)
  claims.value = res.data
}
async function loadComments() {
  const res = await getComments(post.value.id)
  comments.value = res.data
}

function typeLabel(type) {
  return type === 0 ? '寻物启事' : '失物招领'
}
function statusLabel(status) {
  const map = { 0: '进行中', 1: '已匹配', 2: '认领中', 3: '已完结', 4: '已归档', 5: '已下架' }
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
  return claims.value.find((c) => c.claimUserId === currentUserId())
}
function claimLabel() {
  if (!post.value) return '发起认领'
  return post.value.type === 0 ? '我捡到了这个物品' : '这是我的物品'
}

async function handleClaim() {
  claimLoading.value = true
  try {
    await createClaim(post.value.id, null)
    ElMessage.success('认领申请已发起！可在「认领进度」页面跟踪状态')
    post.value = (await getPostDetail(route.params.id)).data
    loadClaims()
  } catch {
    // 请求层统一处理错误提示。
  } finally {
    claimLoading.value = false
  }
}
async function handleComplete() {
  try {
    await ElMessageBox.confirm('确定标记为已找回/已归还？', '完结帖子', { type: 'info' })
    await completePost(post.value.id)
    ElMessage.success('已标记为完结')
    post.value.status = 3
  } catch {
    // 用户取消时无需后续操作。
  }
}
async function handleDelete() {
  try {
    await ElMessageBox.confirm('确定要删除这个帖子吗？', '确认删除', { type: 'warning' })
    await deletePost(post.value.id)
    ElMessage.success('删除成功')
    router.push('/')
  } catch {
    // 用户取消时无需后续操作。
  }
}

async function sendComment() {
  if (!commentText.value.trim()) return
  commentSending.value = true
  try {
    await addComment({ postId: post.value.id, content: commentText.value })
    commentText.value = ''
    loadComments()
  } catch {
    // 请求层统一处理错误提示。
  } finally {
    commentSending.value = false
  }
}

function goChat(otherId) {
  router.push({ path: '/chat', query: { userId: otherId } })
}
</script>

<template>
  <div class="detail-shell" v-loading="loading">
    <main class="page detail-page">
      <template v-if="post">
        <nav class="back-nav" aria-label="返回导航" data-reveal>
          <button type="button" class="back-btn" @click="router.push('/')">
            <ArrowLeft :size="17" aria-hidden="true" />
            <span>返回广场</span>
          </button>
        </nav>

        <section class="cover-section" data-reveal style="--reveal-delay: 70ms">
          <el-image
            v-if="post.images && post.images.length === 1"
            :src="imageUrl(post.images[0])"
            fit="cover"
            :preview-src-list="post.images.map((i) => imageUrl(i))"
            class="cover-image"
          />
          <div v-else-if="post.images && post.images.length > 1" class="image-grid">
            <el-image
              v-for="(img, idx) in post.images"
              :key="idx"
              :src="imageUrl(img)"
              fit="cover"
              :preview-src-list="post.images.map((i) => imageUrl(i))"
              class="detail-image"
            />
          </div>
          <el-image
            v-else-if="post.coverImage"
            :src="imageUrl(post.coverImage)"
            fit="cover"
            :preview-src-list="[imageUrl(post.coverImage)]"
            class="cover-image"
          />
          <div v-else class="cover-placeholder">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        </section>

        <article class="info-card" data-reveal style="--reveal-delay: 120ms">
          <div class="info-tags">
            <span class="tag-type" :class="post.type === 0 ? 'lost' : 'found'">{{
              typeLabel(post.type)
            }}</span>
            <span class="tag-status" :class="'s-' + post.status">{{
              statusLabel(post.status)
            }}</span>
          </div>
          <h1 class="info-title">{{ post.title || '无标题' }}</h1>
          <div class="info-meta">
            <span class="meta-item">
              <Tag class="meta-icon" :size="16" aria-hidden="true" />
              {{ post.itemCategory }}
            </span>
            <span class="meta-item">
              <MapPin class="meta-icon" :size="16" aria-hidden="true" />
              {{ post.locationCampus }}
            </span>
            <time class="meta-item">
              <Clock3 class="meta-icon" :size="16" aria-hidden="true" />
              {{ post.lostTime?.replace('T', ' ') }}
            </time>
          </div>
        </article>

        <section
          v-if="post.description"
          class="desc-card"
          data-reveal
          style="--reveal-delay: 150ms"
        >
          <h2 class="desc-label">物品描述</h2>
          <p class="desc-text">{{ post.description }}</p>
        </section>

        <section class="publisher-card" data-reveal style="--reveal-delay: 180ms">
          <div class="publisher-row">
            <div class="publisher-info">
              <div class="publisher-avatar">{{ post.nickname?.charAt(0) || 'U' }}</div>
              <div>
                <div class="publisher-name">{{ post.nickname }}</div>
                <div class="publisher-meta">
                  信用分 {{ post.creditScore }} · 发布于
                  {{ post.createTime?.substring(0, 16).replace('T', ' ') }}
                </div>
              </div>
            </div>
            <button v-if="!isOwner()" type="button" class="dm-btn" @click="goChat(post.userId)">
              <Mail :size="16" aria-hidden="true" />
              <span>私信</span>
            </button>
          </div>

          <div class="action-area">
            <button
              v-if="canClaim() && !findMyClaim()"
              type="button"
              class="action-btn claim-btn"
              :disabled="claimLoading"
              @click="handleClaim"
            >
              {{ claimLoading ? '处理中...' : claimLabel() }}
            </button>
            <button
              v-if="findMyClaim()"
              type="button"
              class="action-btn goto-claim-btn"
              @click="router.push('/claims')"
            >
              前往认领进度
            </button>

            <div v-if="isOwner()" class="owner-actions">
              <button
                v-if="post.status === 0 || post.status === 1"
                type="button"
                class="action-btn complete-btn"
                @click="handleComplete"
              >
                <CircleCheck :size="17" aria-hidden="true" />
                <span>标记已找回/已归还</span>
              </button>
              <button type="button" class="action-btn delete-btn" @click="handleDelete">
                <Trash2 :size="17" aria-hidden="true" />
                <span>删除帖子</span>
              </button>
            </div>
          </div>
        </section>

        <section
          id="comments-section"
          class="comments-card"
          data-reveal
          style="--reveal-delay: 210ms"
        >
          <h2 class="comments-title">评论 ({{ comments.length }})</h2>
          <div class="comment-input">
            <el-input
              v-model="commentText"
              placeholder="发表评论..."
              maxlength="500"
              show-word-limit
              :rows="3"
              type="textarea"
            />
            <button type="button" class="send-btn" :disabled="commentSending" @click="sendComment">
              <Send :size="15" aria-hidden="true" />
              <span>{{ commentSending ? '发送中...' : '发送' }}</span>
            </button>
          </div>

          <div v-if="comments.length > 0" class="comment-list">
            <article v-for="c in comments" :key="c.id" class="comment-item">
              <span class="comment-avatar">{{ c.nickname?.charAt(0) || 'U' }}</span>
              <div class="comment-body">
                <header class="comment-header">
                  <span class="comment-name">{{ c.nickname }}</span>
                  <time class="comment-time">{{
                    c.createTime?.substring(0, 16).replace('T', ' ')
                  }}</time>
                </header>
                <p class="comment-content">{{ c.content }}</p>
              </div>
            </article>
          </div>
          <div v-else class="empty-comments">暂无评论</div>
        </section>
      </template>
    </main>
  </div>
</template>

<style scoped>
.detail-shell {
  --bg-page: transparent;
  --bg-card: #ffffff;
  --bg-glass: rgba(255, 255, 255, 0.86);
  --bg-glass-soft: rgba(255, 255, 255, 0.68);
  --glass-border: rgba(255, 255, 255, 0.62);
  --ink: #0f172a;
  --ink-hover: #000000;
  --primary: #3b82f6;
  --gray-50: #f8fafc;
  --gray-100: #f1f5f9;
  --gray-200: #e2e8f0;
  --gray-300: #cbd5e1;
  --gray-400: #94a3b8;
  --gray-500: #64748b;
  --gray-600: #475569;
  --gray-700: #334155;
  --gray-800: #1e293b;
  --type-lost: #ef4444;
  --type-lost-bg: #fef2f2;
  --type-found: #10b981;
  --type-found-bg: #f0fdf4;
  --status-active: #3b82f6;
  --status-active-bg: #eff6ff;
  --status-matched: #f59e0b;
  --status-matched-bg: #fffbeb;
  --status-done: #10b981;
  --status-done-bg: #f0fdf4;
  --status-archived: #6b7280;
  --status-removed: #9ca3af;
  --status-muted-bg: #f3f4f6;
  --danger-border: #fecaca;
  --danger-hover: #fee2e2;
  --comment-avatar: #60a5fa;
  --transparent: transparent;
  --focus-ring: rgba(59, 130, 246, 0.1);
  --glass-shadow: 0 34px 90px rgba(34, 48, 132, 0.16), inset 0 1px 0 rgba(255, 255, 255, 0.8);
  --capsule-shadow: 0 12px 28px rgba(15, 23, 42, 0.24);
  --radius-sm: 8px;
  --radius-lg: 16px;
  --radius-full: 9999px;
  --font-heading: 'Noto Serif SC', serif;
  --font-body: 'HarmonyOS Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  min-height: calc(100vh - 60px);
  color: var(--gray-600);
  font-family: var(--font-body);
  font-size: 1.1rem;
  background: var(--bg-page);
}

.detail-page {
  width: 100%;
  max-width: 880px;
  min-height: calc(100vh - 60px);
  padding: 26px 22px 53px;
  margin: 0 auto;
  background: var(--transparent);
}

.back-nav {
  margin-bottom: 22px;
}
.back-btn {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  gap: 6px;
  padding: 9px 18px;
  color: var(--gray-600);
  font-family: var(--font-body);
  font-size: 15.4px;
  background: var(--bg-glass-soft);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all 0.2s;
}
.back-btn:hover {
  color: var(--gray-800);
  background: var(--gray-50);
  border-color: var(--gray-300);
}

.cover-section {
  margin-bottom: 22px;
  overflow: hidden;
  background: var(--bg-glass);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--glass-shadow);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}
.cover-image {
  display: block;
  width: 100%;
  height: 440px;
}
.cover-image :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cover-placeholder {
  display: flex;
  width: 100%;
  height: 440px;
  align-items: center;
  justify-content: center;
  color: var(--gray-300);
  background: var(--gray-100);
}
.cover-placeholder svg {
  width: 56px;
  height: 56px;
}
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 9px;
  padding: 9px;
}
.detail-image {
  width: 100%;
  height: 220px;
  overflow: hidden;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: transform 0.2s;
}
.detail-image:hover {
  transform: scale(1.02);
}
.detail-image :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info-card,
.desc-card,
.publisher-card,
.comments-card {
  padding: 26px;
  margin-bottom: 18px;
  background: var(--bg-glass);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--glass-shadow);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}
.comments-card {
  margin-bottom: 0;
}
.info-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}
.tag-type,
.tag-status {
  display: inline-flex;
  min-height: 29px;
  align-items: center;
  padding: 4px 13px;
  border-radius: var(--radius-full);
  font-size: 14.3px;
  font-weight: 600;
  line-height: 1.3;
}
.tag-type.lost {
  color: var(--type-lost);
  background: var(--type-lost-bg);
}
.tag-type.found {
  color: var(--type-found);
  background: var(--type-found-bg);
}
.tag-status.s-0 {
  color: var(--status-active);
  background: var(--status-active-bg);
}
.tag-status.s-1,
.tag-status.s-2 {
  color: var(--status-matched);
  background: var(--status-matched-bg);
}
.tag-status.s-3 {
  color: var(--status-done);
  background: var(--status-done-bg);
}
.tag-status.s-4 {
  color: var(--status-archived);
  background: var(--status-muted-bg);
}
.tag-status.s-5 {
  color: var(--status-removed);
  background: var(--status-muted-bg);
}
.info-title {
  margin: 0 0 12px;
  color: var(--gray-800);
  font-family: var(--font-heading);
  font-size: 26.4px;
  font-weight: 700;
  line-height: 1.4;
  letter-spacing: 0;
  overflow-wrap: anywhere;
}
.info-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 11px 18px;
  color: var(--gray-500);
  font-size: 15.4px;
}
.meta-item {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
}
.meta-icon {
  flex: none;
  color: var(--gray-400);
}
.meta-item time,
time.meta-item {
  font-family: var(--font-mono);
}

.desc-label {
  margin: 0 0 12px;
  color: var(--gray-800);
  font-family: var(--font-heading);
  font-size: 17.6px;
  font-weight: 600;
  line-height: 1.5;
  letter-spacing: 0;
}
.desc-text {
  margin: 0;
  color: var(--gray-600);
  font-size: 16.5px;
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.publisher-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 18px;
  margin-bottom: 18px;
  border-bottom: 1px solid var(--gray-100);
}
.publisher-info {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 13px;
}
.publisher-avatar {
  display: flex;
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  align-items: center;
  justify-content: center;
  color: var(--bg-card);
  font-size: 19.8px;
  font-weight: 700;
  background: var(--primary);
  border-radius: var(--radius-full);
}
.publisher-name {
  color: var(--gray-800);
  font-size: 17.6px;
  font-weight: 600;
}
.publisher-meta {
  margin-top: 2px;
  color: var(--gray-400);
  font-family: var(--font-mono);
  font-size: 14.3px;
  line-height: 1.5;
}
.dm-btn {
  display: inline-flex;
  min-height: 42px;
  flex: none;
  align-items: center;
  gap: 7px;
  padding: 9px 22px;
  color: var(--bg-card);
  font-family: var(--font-body);
  font-size: 15.4px;
  font-weight: 700;
  background: var(--ink);
  border: 1px solid var(--ink);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all 0.2s;
}
.dm-btn:hover {
  color: var(--bg-card);
  background: var(--ink-hover);
  border-color: var(--ink-hover);
  box-shadow: var(--capsule-shadow);
  transform: translateY(-2px);
}
.action-area {
  display: flex;
  flex-direction: column;
  gap: 11px;
}
.action-btn {
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 22px;
  font-family: var(--font-body);
  font-size: 16.5px;
  font-weight: 700;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all 0.2s;
}
.action-btn:disabled,
.send-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.claim-btn,
.goto-claim-btn {
  width: 100%;
}
.claim-btn,
.goto-claim-btn,
.complete-btn {
  color: var(--bg-card);
  background: var(--ink);
  border: 1px solid var(--ink);
}
.claim-btn:not(:disabled):hover,
.goto-claim-btn:hover,
.complete-btn:hover {
  color: var(--bg-card);
  background: var(--ink-hover);
  border-color: var(--ink-hover);
  box-shadow: var(--capsule-shadow);
  transform: translateY(-2px);
}
.owner-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}
.delete-btn {
  color: var(--type-lost);
  background: var(--type-lost-bg);
  border: 1px solid var(--danger-border);
}
.delete-btn:hover {
  background: var(--danger-hover);
}

.comments-title {
  margin: 0 0 16px;
  color: var(--gray-800);
  font-family: var(--font-heading);
  font-size: 18.7px;
  font-weight: 600;
  letter-spacing: 0;
}
.comment-input {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-bottom: 22px;
}
.send-btn {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  gap: 6px;
  padding: 9px 22px;
  margin-top: 11px;
  color: var(--bg-card);
  font-family: var(--font-body);
  font-size: 15.4px;
  font-weight: 700;
  background: var(--ink);
  border: 0;
  border-radius: var(--radius-full);
  cursor: pointer;
  transition:
    background-color 0.2s,
    box-shadow 0.2s,
    transform 0.2s;
}
.send-btn:not(:disabled):hover {
  background: var(--ink-hover);
  box-shadow: var(--capsule-shadow);
  transform: translateY(-2px);
}
.comment-list {
  display: flex;
  flex-direction: column;
  gap: 13px;
}
.comment-item {
  display: flex;
  gap: 12px;
  padding: 15px;
  background: var(--bg-glass-soft);
  border-radius: var(--radius-sm);
  transition: background 0.2s;
}
.comment-item:hover {
  background: var(--gray-100);
}
.comment-avatar {
  display: flex;
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  align-items: center;
  justify-content: center;
  color: var(--bg-card);
  font-size: 15.4px;
  font-weight: 600;
  background: var(--comment-avatar);
  border-radius: var(--radius-full);
}
.comment-body {
  min-width: 0;
  flex: 1;
}
.comment-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  margin-bottom: 6px;
}
.comment-name {
  color: var(--gray-800);
  font-size: 15.4px;
  font-weight: 600;
}
.comment-time {
  color: var(--gray-400);
  font-family: var(--font-mono);
  font-size: 13.2px;
}
.comment-content {
  margin: 0;
  color: var(--gray-600);
  font-size: 15.4px;
  line-height: 1.6;
  overflow-wrap: anywhere;
}
.empty-comments {
  padding: 30px;
  color: var(--gray-400);
  font-size: 15.4px;
  text-align: center;
}

.comment-input :deep(.el-textarea__inner) {
  padding: 13px;
  color: var(--gray-700);
  font-family: var(--font-body);
  font-size: 15.4px;
  background: var(--bg-glass-soft);
  border-radius: var(--radius-sm);
  box-shadow: 0 0 0 1px var(--gray-200) inset;
}
.comment-input :deep(.el-textarea__inner:hover) {
  box-shadow: 0 0 0 1px var(--gray-300) inset;
}
.comment-input :deep(.el-textarea__inner:focus) {
  box-shadow:
    0 0 0 1px var(--primary) inset,
    0 0 0 3px var(--focus-ring);
}
.comment-input :deep(.el-textarea__inner::placeholder),
.comment-input :deep(.el-input__count) {
  color: var(--gray-400);
}
.comment-input :deep(.el-input__count) {
  background: var(--transparent);
}

[data-reveal] {
  opacity: 0;
  transform: translate3d(0, 30px, 0) scale(0.985);
  transition:
    opacity 760ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 760ms cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: var(--reveal-delay, 0ms);
}

[data-reveal].is-visible {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
}

:deep(.el-loading-mask) {
  background-color: var(--bg-glass);
  backdrop-filter: blur(8px);
}

@media (max-width: 768px) {
  .detail-shell,
  .detail-page {
    min-height: calc(100vh - 108px);
  }
  .detail-page {
    padding: 20px 16px 44px;
  }
  .cover-image {
    height: 330px;
  }
  .cover-placeholder {
    height: 330px;
  }
  .info-card,
  .desc-card,
  .publisher-card,
  .comments-card {
    padding: 22px;
  }
  .image-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .detail-image {
    height: 198px;
  }
}

@media (max-width: 520px) {
  .cover-image {
    height: 264px;
  }
  .cover-placeholder {
    height: 264px;
  }
  .publisher-row {
    align-items: flex-start;
    gap: 12px;
  }
  .publisher-meta {
    font-family: var(--font-body);
    font-size: 13.2px;
  }
  .dm-btn {
    padding: 8px 12px;
  }
  .owner-actions {
    flex-direction: column;
  }
  .owner-actions .action-btn {
    width: 100%;
  }
  .image-grid {
    grid-template-columns: 1fr;
  }
  .detail-image {
    height: 242px;
  }
}

@media (prefers-reduced-motion: reduce) {
  [data-reveal],
  [data-reveal].is-visible {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
