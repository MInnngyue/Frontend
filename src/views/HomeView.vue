<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  ArrowRight,
  Camera,
  ClipboardCheck,
  FilePlus2,
  Files,
  Hash,
  Inbox,
  LayoutDashboard,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { getMyPosts, getUserInfo, updateProfile } from '@/api/user'
import { uploadImage } from '@/api/upload'
import { useAuroraGlow } from '@/composables/useAuroraGlow'
import { imageUrl } from '@/utils/url'

const router = useRouter()
const { glowX, glowY, glowActive, glowBlocked, onMouseMove, onMouseLeave } = useAuroraGlow()

const loading = ref(false)
const postsLoading = ref(false)
const userInfo = ref(null)
const myPosts = ref([])
const avatarInput = ref(null)
const avatarUploading = ref(false)
const avatarFailed = ref(false)

const showSignDialog = ref(false)
const showInfoDialog = ref(false)
const signSaving = ref(false)
const infoSaving = ref(false)
const signForm = ref({ signature: '' })
const infoForm = ref({ nickname: '', phone: '', email: '' })

let revealObserver = null

const quickLinks = [
  { label: '发布帖子', route: '/publish', icon: FilePlus2 },
  { label: '消息中心', route: '/messages', icon: MessageSquare },
  { label: '我的帖子', route: '/my-posts', icon: Files },
  { label: '认领进度', route: '/claims', icon: ClipboardCheck },
]

const displayName = computed(
  () => userInfo.value?.nickname || userInfo.value?.username || '校园用户',
)
const userInitial = computed(() => displayName.value.charAt(0).toUpperCase())
const avatarSource = computed(() => {
  if (avatarFailed.value || !userInfo.value?.avatar) return ''
  return imageUrl(userInfo.value.avatar)
})
const isAdmin = computed(() => {
  const role = userInfo.value?.role
  return role === 1 || role === '1' || role === 'ADMIN'
})

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
    { threshold: 0.08 },
  )
}

function observeRevealElements() {
  const elements = document.querySelectorAll('.profile-page [data-reveal]:not(.is-visible)')
  if (!revealObserver) {
    elements.forEach((element) => element.classList.add('is-visible'))
    return
  }
  elements.forEach((element) => revealObserver.observe(element))
}

function getLocalUserInfo() {
  const localUser = localStorage.getItem('userInfo')
  if (!localUser) return null
  try {
    return JSON.parse(localUser)
  } catch {
    localStorage.removeItem('userInfo')
    return null
  }
}

function saveLocalUserInfo() {
  if (userInfo.value) localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
}

async function loadUserInfo() {
  loading.value = true
  try {
    const response = await getUserInfo()
    userInfo.value = response.data
    avatarFailed.value = false
    saveLocalUserInfo()
  } catch {
    userInfo.value ||= getLocalUserInfo()
  } finally {
    loading.value = false
  }
}

async function loadMyPosts() {
  postsLoading.value = true
  try {
    const response = await getMyPosts({ page: 1, size: 20 })
    myPosts.value = Array.isArray(response.data) ? response.data : response.data?.records || []
  } catch {
    myPosts.value = []
  } finally {
    postsLoading.value = false
  }
}

function formatRole(role) {
  return role === 1 || role === '1' || role === 'ADMIN' ? '管理员' : '普通用户'
}

function formatTime(value) {
  return value?.substring(0, 16).replace('T', ' ') || '-'
}

function triggerAvatarUpload() {
  avatarInput.value?.click()
}

async function handleAvatarChange(event) {
  const file = event.target.files?.[0]
  if (!file) return

  avatarUploading.value = true
  try {
    const response = await uploadImage(file)
    const avatar = response.data?.url || response.data
    await updateProfile({ avatar })
    userInfo.value = { ...userInfo.value, avatar }
    avatarFailed.value = false
    saveLocalUserInfo()
    ElMessage.success('头像已更新')
  } catch {
    ElMessage.error('头像上传失败')
  } finally {
    avatarUploading.value = false
    event.target.value = ''
  }
}

function openSignDialog() {
  signForm.value.signature = userInfo.value?.signature || ''
  showSignDialog.value = true
}

async function saveSign() {
  signSaving.value = true
  try {
    await updateProfile({ signature: signForm.value.signature })
    userInfo.value = { ...userInfo.value, signature: signForm.value.signature }
    saveLocalUserInfo()
    showSignDialog.value = false
    ElMessage.success('签名已更新')
  } catch {
  } finally {
    signSaving.value = false
  }
}

function openInfoDialog() {
  infoForm.value = {
    nickname: userInfo.value?.nickname || '',
    phone: userInfo.value?.phone || '',
    email: userInfo.value?.email || '',
  }
  showInfoDialog.value = true
}

async function saveInfo() {
  infoSaving.value = true
  try {
    await updateProfile(infoForm.value)
    userInfo.value = { ...userInfo.value, ...infoForm.value }
    saveLocalUserInfo()
    showInfoDialog.value = false
    ElMessage.success('资料已更新')
  } catch {
  } finally {
    infoSaving.value = false
  }
}

function goPost(id) {
  router.push(`/post/${id}`)
}

onMounted(async () => {
  userInfo.value = getLocalUserInfo()
  initRevealObserver()
  await nextTick()
  observeRevealElements()
  await Promise.all([loadUserInfo(), loadMyPosts()])
})

onBeforeUnmount(() => {
  revealObserver?.disconnect()
})
</script>

<template>
  <div class="page profile-page" @mousemove="onMouseMove" @mouseleave="onMouseLeave">
    <div
      class="aurora-glow"
      :class="{ active: glowActive, blocked: glowBlocked }"
      :style="{ transform: `translate3d(${glowX - 150}px, ${glowY - 100}px, 0)` }"
      aria-hidden="true"
    />
    <div
      class="aurora-glow aurora-glow--teal"
      :class="{ active: glowActive, blocked: glowBlocked }"
      :style="{ transform: `translate3d(${glowX - 130}px, ${glowY - 160}px, 0)` }"
      aria-hidden="true"
    />

    <header class="page-header" data-reveal>
      <div>
        <h1 class="page-title">个人中心</h1>
        <p class="page-subtitle">{{ displayName }}，欢迎回来</p>
      </div>
      <button v-if="isAdmin" type="button" class="admin-btn" @click="router.push('/admin')">
        <LayoutDashboard :size="17" aria-hidden="true" />
        进入管理后台
      </button>
    </header>

    <div class="profile-content">
      <section
        class="profile-hero"
        v-loading="loading"
        data-aurora-block
        data-reveal
        style="--reveal-delay: 60ms"
      >
        <div class="profile-top">
          <div class="avatar-wrap">
            <div class="profile-avatar">
              <img
                v-if="avatarSource"
                :src="avatarSource"
                :alt="`${displayName}的头像`"
                @error="avatarFailed = true"
              />
              <span v-else>{{ userInitial }}</span>
            </div>
            <input
              ref="avatarInput"
              class="avatar-input"
              type="file"
              accept="image/*"
              @change="handleAvatarChange"
            />
            <button
              type="button"
              class="avatar-edit"
              :disabled="avatarUploading"
              title="更换头像"
              aria-label="更换头像"
              @click="triggerAvatarUpload"
            >
              <Camera :size="15" aria-hidden="true" />
            </button>
          </div>

          <div class="profile-main">
            <h2>{{ displayName }}</h2>
            <p>{{ userInfo?.signature || '还没有填写个人签名' }}</p>
            <div class="identity-line">
              <span class="role-chip">
                <ShieldCheck :size="14" aria-hidden="true" />
                {{ formatRole(userInfo?.role) }}
              </span>
              <span class="username">@{{ userInfo?.username || '-' }}</span>
            </div>
          </div>

          <div class="profile-actions">
            <button type="button" class="secondary-btn" @click="openInfoDialog">
              <Pencil :size="16" aria-hidden="true" />
              编辑资料
            </button>
            <button
              type="button"
              class="icon-btn"
              title="修改签名"
              aria-label="修改签名"
              @click="openSignDialog"
            >
              <MessageSquare :size="17" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div class="stats-row">
          <div class="stat-item">
            <strong>{{ userInfo?.creditScore ?? 100 }}</strong>
            <span>信用分</span>
          </div>
          <div class="stat-item success">
            <strong>{{ userInfo?.successCount ?? 0 }}</strong>
            <span>成功认领</span>
          </div>
          <div class="stat-item role">
            <strong>{{ formatRole(userInfo?.role) }}</strong>
            <span>账户类型</span>
          </div>
        </div>
      </section>

      <nav
        class="quick-grid"
        aria-label="个人中心快捷入口"
        data-reveal
        style="--reveal-delay: 120ms"
      >
        <button
          v-for="item in quickLinks"
          :key="item.route"
          type="button"
          class="quick-link"
          data-aurora-block
          @click="router.push(item.route)"
        >
          <span class="quick-icon">
            <component :is="item.icon" :size="21" aria-hidden="true" />
          </span>
          <span>{{ item.label }}</span>
          <ArrowRight :size="16" aria-hidden="true" />
        </button>
      </nav>

      <div class="details-grid" data-reveal style="--reveal-delay: 180ms">
        <section class="profile-section posts-section" data-aurora-block>
          <header class="section-header">
            <h2 class="section-title">
              <span class="section-num">01</span>
              我的帖子
            </h2>
            <button type="button" class="text-link" @click="router.push('/my-posts')">
              查看全部
              <ArrowRight :size="15" aria-hidden="true" />
            </button>
          </header>

          <div class="post-list" v-loading="postsLoading">
            <button
              v-for="post in myPosts.slice(0, 5)"
              :key="post.id"
              type="button"
              class="post-row"
              @click="goPost(post.id)"
            >
              <span class="type-tag" :class="post.type === 0 ? 'lost' : 'found'">
                {{ post.type === 0 ? '寻物' : '招领' }}
              </span>
              <span class="post-title">{{ post.title || '无标题' }}</span>
              <time>{{ formatTime(post.createTime) }}</time>
              <ArrowRight :size="15" aria-hidden="true" />
            </button>

            <div v-if="!postsLoading && myPosts.length === 0" class="empty-state">
              <Inbox :size="30" aria-hidden="true" />
              <div>
                <strong>还没有发布过帖子</strong>
                <span>发布一条信息，让更多人看到</span>
              </div>
              <button type="button" class="primary-btn compact" @click="router.push('/publish')">
                去发布
              </button>
            </div>
          </div>
        </section>

        <section class="profile-section account-section" data-aurora-block>
          <header class="section-header">
            <h2 class="section-title">
              <span class="section-num">02</span>
              账号信息
            </h2>
          </header>

          <dl class="account-list">
            <div class="account-row">
              <dt><Hash :size="16" aria-hidden="true" />用户 ID</dt>
              <dd>{{ userInfo?.id || userInfo?.userId || '-' }}</dd>
            </div>
            <div class="account-row">
              <dt><UserRound :size="16" aria-hidden="true" />用户名</dt>
              <dd>{{ userInfo?.username || '-' }}</dd>
            </div>
            <div class="account-row">
              <dt><Mail :size="16" aria-hidden="true" />邮箱</dt>
              <dd>{{ userInfo?.email || '未设置' }}</dd>
            </div>
            <div class="account-row">
              <dt><Phone :size="16" aria-hidden="true" />手机号</dt>
              <dd>{{ userInfo?.phone || '未设置' }}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>

    <el-dialog v-model="showSignDialog" title="修改签名" width="min(92vw, 400px)">
      <el-input
        v-model="signForm.signature"
        maxlength="50"
        placeholder="写下你的个性签名"
        show-word-limit
      />
      <template #footer>
        <el-button @click="showSignDialog = false">取消</el-button>
        <el-button type="primary" :loading="signSaving" @click="saveSign">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showInfoDialog" title="修改个人信息" width="min(92vw, 420px)">
      <el-form label-position="top">
        <el-form-item label="昵称">
          <el-input v-model="infoForm.nickname" maxlength="20" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="infoForm.phone" maxlength="11" placeholder="选填" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="infoForm.email" maxlength="50" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showInfoDialog = false">取消</el-button>
        <el-button type="primary" :loading="infoSaving" @click="saveInfo">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.profile-page {
  width: 100%;
  min-height: calc(100vh - 60px);
  padding: 31px 20px 48px;
  position: relative;
  isolation: isolate;
  color: #475569;
  font-family: 'HarmonyOS Sans', 'PingFang SC', sans-serif;
}

.aurora-glow {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 0;
  width: 300px;
  height: 300px;
  pointer-events: none;
  opacity: 0;
  background: radial-gradient(
    circle,
    rgba(139, 92, 246, 0.3) 0%,
    rgba(139, 92, 246, 0.1) 40%,
    transparent 70%
  );
  border-radius: 50%;
  filter: blur(40px);
  mix-blend-mode: normal;
  transition: opacity 0.5s ease;
  will-change: transform;
}

.aurora-glow--teal {
  width: 260px;
  height: 260px;
  background: radial-gradient(
    circle,
    rgba(6, 182, 212, 0.25) 0%,
    rgba(6, 182, 212, 0.08) 40%,
    transparent 70%
  );
  mix-blend-mode: screen;
}

.aurora-glow.active {
  opacity: 1;
}

.aurora-glow.blocked {
  opacity: 0;
  transition: none;
}

.page-header,
.profile-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 1120px;
  margin-right: auto;
  margin-left: auto;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

.page-title {
  margin: 0;
  color: #1e293b;
  font-family: 'Noto Serif SC', serif;
  font-size: 36px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: 0;
}

.page-subtitle {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 16px;
  line-height: 1.6;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.profile-hero,
.profile-section,
.quick-link {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow:
    0 8px 32px rgba(31, 38, 135, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}

.profile-hero,
.profile-section {
  overflow: hidden;
  border-radius: 20px;
}

.profile-hero {
  padding: 28px 30px 0;
}

.profile-top {
  display: flex;
  align-items: center;
  gap: 20px;
  padding-bottom: 24px;
}

.avatar-wrap {
  position: relative;
  flex: none;
}

.profile-avatar {
  display: grid;
  width: 88px;
  height: 88px;
  overflow: hidden;
  color: #2563eb;
  font-size: 30px;
  font-weight: 700;
  background: rgba(59, 130, 246, 0.1);
  border: 3px solid rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  box-shadow: 0 10px 24px rgba(31, 38, 135, 0.14);
  place-items: center;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-input {
  display: none;
}

.avatar-edit {
  position: absolute;
  right: -2px;
  bottom: -2px;
  display: grid;
  width: 32px;
  height: 32px;
  padding: 0;
  color: #fff;
  cursor: pointer;
  background: #0f172a;
  border: 3px solid #fff;
  border-radius: 50%;
  place-items: center;
  transition: all 0.2s ease;
}

.avatar-edit:hover:not(:disabled),
.avatar-edit:focus-visible:not(:disabled) {
  background: #000;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.24);
  transform: translateY(-1px);
  outline: none;
}

.avatar-edit:disabled {
  cursor: wait;
  opacity: 0.55;
}

.profile-main {
  min-width: 0;
  flex: 1;
}

.profile-main h2 {
  margin: 0;
  overflow: hidden;
  color: #1e293b;
  font-family: 'Noto Serif SC', serif;
  font-size: 24px;
  font-weight: 700;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-main > p {
  margin: 5px 0 11px;
  overflow: hidden;
  color: #64748b;
  font-size: 14px;
  line-height: 1.6;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.identity-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 9px;
}

.role-chip {
  display: inline-flex;
  min-height: 27px;
  padding: 4px 10px;
  align-items: center;
  gap: 5px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
  background: #eff6ff;
  border-radius: 999px;
}

.username {
  color: #94a3b8;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
}

.profile-actions {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
}

.secondary-btn,
.admin-btn,
.primary-btn,
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
}

.secondary-btn,
.admin-btn,
.primary-btn {
  min-height: 40px;
  padding: 0 17px;
  gap: 7px;
  border-radius: 999px;
}

.secondary-btn {
  color: #334155;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(15, 23, 42, 0.16);
}

.secondary-btn:hover,
.secondary-btn:focus-visible {
  color: #1e293b;
  background: #fff;
  border-color: rgba(15, 23, 42, 0.32);
  outline: none;
}

.icon-btn {
  width: 40px;
  height: 40px;
  padding: 0;
  color: #475569;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(15, 23, 42, 0.16);
  border-radius: 50%;
}

.icon-btn:hover,
.icon-btn:focus-visible {
  color: #2563eb;
  background: #fff;
  border-color: rgba(59, 130, 246, 0.32);
  outline: none;
}

.admin-btn,
.primary-btn {
  color: #fff;
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(15, 23, 42, 0.92);
}

.admin-btn:hover,
.admin-btn:focus-visible,
.primary-btn:hover,
.primary-btn:focus-visible {
  background: #000;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.22);
  transform: translateY(-1px);
  outline: none;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid rgba(15, 23, 42, 0.07);
}

.stat-item {
  display: flex;
  min-width: 0;
  padding: 20px 18px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 4px;
}

.stat-item + .stat-item {
  border-left: 1px solid rgba(15, 23, 42, 0.07);
}

.stat-item strong {
  color: #3b82f6;
  font-family: 'JetBrains Mono', monospace;
  font-size: 26px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-item.success strong {
  color: #059669;
}

.stat-item.role strong {
  color: #1e293b;
  font-family: 'HarmonyOS Sans', 'PingFang SC', sans-serif;
  font-size: 17px;
}

.stat-item span {
  color: #64748b;
  font-size: 12px;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.quick-link {
  display: grid;
  min-width: 0;
  min-height: 76px;
  padding: 14px 16px;
  grid-template-columns: 38px minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  color: #334155;
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  border-radius: 16px;
  transition: all 0.2s ease;
}

.quick-link > svg {
  color: #94a3b8;
}

.quick-icon {
  display: grid;
  width: 38px;
  height: 38px;
  color: #2563eb;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 10px;
  place-items: center;
}

.quick-link:hover,
.quick-link:focus-visible {
  color: #1e293b;
  border-color: rgba(59, 130, 246, 0.28);
  box-shadow:
    0 12px 30px rgba(31, 38, 135, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  transform: translateY(-2px);
  outline: none;
}

.quick-link:hover > svg,
.quick-link:focus-visible > svg {
  color: #2563eb;
}

.details-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(280px, 0.85fr);
  gap: 18px;
  align-items: start;
}

.profile-section {
  padding: 24px 28px;
}

.section-header,
.section-title,
.text-link {
  display: flex;
  align-items: center;
}

.section-header {
  min-height: 32px;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.section-title {
  gap: 10px;
  margin: 0;
  color: #1e293b;
  font-family: 'Noto Serif SC', serif;
  font-size: 17.6px;
  font-weight: 600;
  line-height: 1.4;
}

.section-num {
  display: inline-flex;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 700;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 8px;
}

.text-link {
  padding: 5px 0 5px 10px;
  gap: 5px;
  color: #3b82f6;
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.text-link:hover,
.text-link:focus-visible {
  color: #1d4ed8;
  outline: none;
}

.post-list {
  min-height: 132px;
}

.post-row {
  display: grid;
  width: 100%;
  min-height: 48px;
  padding: 9px 8px;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 9px;
  color: #475569;
  font: inherit;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.post-row:last-child {
  border-bottom-color: transparent;
}

.post-row:hover,
.post-row:focus-visible {
  background: rgba(59, 130, 246, 0.05);
  outline: none;
}

.type-tag {
  display: inline-flex;
  min-height: 26px;
  padding: 4px 11px;
  align-items: center;
  font-size: 13.2px;
  font-weight: 600;
  line-height: 1.3;
  border-radius: 999px;
}

.type-tag.lost {
  color: #ef4444;
  background: #fef2f2;
}

.type-tag.found {
  color: #10b981;
  background: #f0fdf4;
}

.post-title {
  overflow: hidden;
  color: #334155;
  font-size: 14px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-row time {
  color: #94a3b8;
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  white-space: nowrap;
}

.post-row > svg {
  color: #94a3b8;
}

.empty-state {
  display: flex;
  min-height: 132px;
  padding: 20px 8px;
  align-items: center;
  gap: 12px;
  color: #94a3b8;
}

.empty-state > div {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 3px;
}

.empty-state strong {
  color: #475569;
  font-size: 14px;
}

.empty-state span {
  color: #94a3b8;
  font-size: 12px;
}

.primary-btn.compact {
  min-height: 38px;
  padding: 0 16px;
}

.account-list {
  margin: 0;
}

.account-row {
  display: flex;
  min-height: 52px;
  padding: 10px 2px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

.account-row:last-child {
  border-bottom: 0;
}

.account-row dt {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #64748b;
  font-size: 13px;
  white-space: nowrap;
}

.account-row dt svg {
  color: #3b82f6;
}

.account-row dd {
  min-width: 0;
  margin: 0;
  overflow-wrap: anywhere;
  color: #334155;
  font-size: 13px;
  font-weight: 600;
  text-align: right;
}

:deep(.el-form-item__label) {
  color: #334155;
  font-size: 14px;
  font-weight: 600;
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

@media (max-width: 900px) {
  .details-grid {
    grid-template-columns: 1fr;
  }

  .quick-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .profile-page {
    min-height: calc(100vh - 108px);
    padding: 24px 16px 36px;
  }

  .page-header {
    align-items: flex-start;
  }

  .page-title {
    font-size: 29px;
  }

  .profile-hero {
    padding: 22px 20px 0;
  }

  .profile-top {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .profile-main {
    padding-top: 5px;
  }

  .profile-actions {
    width: 100%;
    padding-left: 108px;
  }

  .stat-item {
    padding: 17px 8px;
  }

  .stat-item strong {
    font-size: 22px;
  }

  .profile-section {
    padding: 20px;
  }
}

@media (max-width: 480px) {
  .admin-btn {
    width: 40px;
    padding: 0;
    border-radius: 50%;
    font-size: 0;
  }

  .profile-top {
    display: grid;
    grid-template-columns: 88px minmax(0, 1fr);
  }

  .profile-actions {
    padding-left: 0;
    grid-column: 1 / -1;
  }

  .secondary-btn {
    flex: 1;
  }

  .quick-link {
    min-height: 70px;
    padding: 12px;
    grid-template-columns: 36px minmax(0, 1fr);
  }

  .quick-link > svg {
    display: none;
  }

  .quick-icon {
    width: 36px;
    height: 36px;
  }

  .post-row {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }

  .post-row time {
    display: none;
  }

  .empty-state {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .empty-state .primary-btn {
    margin-left: 42px;
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
