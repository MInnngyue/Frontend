<script setup>
import { ref, computed, onMounted, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getUnreadCount } from '@/api/message'
import { getConversations } from '@/api/pm'

const route = useRoute()
const router = useRouter()

const showNav = computed(() => route.path !== '/login')
const isPublishPage = computed(() => route.path === '/publish')
const unreadCount = ref(0)
const pmUnread = ref(0)

function isActive(path) {
  return route.path === path || (path === '/' && route.path.startsWith('/'))
}

function getUserRole() {
  try {
    const ui = JSON.parse(localStorage.getItem('userInfo') || '{}')
    return ui.role || 0
  } catch { return 0 }
}

function isAdmin() {
  return getUserRole() === 1
}

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  router.push('/login')
}

async function loadUnreadCount() {
  try {
    const res = await getUnreadCount()
    unreadCount.value = res.data
    const cres = await getConversations()
    pmUnread.value = cres.data.reduce((s, c) => s + (c.unread || 0), 0)
  } catch { }
}

provide('refreshUnread', loadUnreadCount)

onMounted(() => {
  loadUnreadCount()
  setInterval(loadUnreadCount, 30000)
})
</script>

<template>
  <div class="app-shell">
    <header v-if="showNav" class="app-header">
      <div class="header-inner">
        <div class="header-left">
          <div class="brand" @click="router.push('/')">
            <svg class="brand-pin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1 2.89-2.64l3.05 2.05a2 2 0 0 1-.14 3.5l-2.5 1.8a2 2 0 0 1-2.3-.1l-1.5-1.2a2 2 0 0 1-.5-2.6z"/><circle cx="12" cy="6" r="2.5"/></svg>
            <span class="brand-text">校园失物招领</span>
          </div>
        </div>

        <nav class="nav-links">
          <router-link to="/" :class="{ active: route.path === '/' }">失物广场</router-link>
          <router-link to="/publish" :class="{ active: route.path === '/publish' }">发布帖子</router-link>
          <router-link to="/messages" :class="{ active: route.path === '/messages' }" class="nav-msg-link">
            消息
            <span v-if="unreadCount + pmUnread > 0" class="nav-badge">{{ unreadCount + pmUnread }}</span>
          </router-link>
          <router-link to="/claims" :class="{ active: route.path === '/claims' }">认领进度</router-link>
          <router-link to="/profile" :class="{ active: route.path === '/profile' }">个人中心</router-link>
        </nav>

        <div class="header-right">
          <el-button v-if="isPublishPage" class="header-back-btn" @click="router.push('/')">&larr; 返回广场</el-button>
          <el-button v-else class="header-publish-btn" @click="router.push('/publish')">+ 发布帖子</el-button>
          <button class="header-logout-btn" @click="logout">退出</button>
        </div>
      </div>
    </header>
    <main :class="{ 'has-header': showNav }">
      <router-view />
    </main>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  overflow-y: scroll;
}

body {
  font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #faf6ee;
  color: #2d2a26;
}

/* paper fiber texture */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-image:
    radial-gradient(circle at 20% 30%, rgba(45,42,38,0.015) 0.5px, transparent 0.5px),
    radial-gradient(circle at 70% 60%, rgba(45,42,38,0.012) 0.4px, transparent 0.4px),
    radial-gradient(circle at 40% 80%, rgba(45,42,38,0.01) 0.3px, transparent 0.3px);
  background-size: 28px 28px, 36px 36px, 44px 44px;
}

.app-shell { position: relative; z-index: 1; }

/* === header: 60px two-column layout === */
.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: #2d2a26;
  border-bottom: 3px solid #c8553d;
  z-index: 100;
}

.header-inner {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  gap: 24px;
}

.header-left {
  flex-shrink: 0;
}

.brand {
  font-family: 'Noto Serif SC', Georgia, serif;
  font-size: 26px;
  font-weight: 700;
  color: #faf6ee;
  cursor: pointer;
  letter-spacing: 1.5px;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

.brand-pin {
  color: #c8553d;
  flex-shrink: 0;
}

/* === nav: underline active indicator === */
.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  justify-content: center;
}

.nav-links a {
  text-decoration: none;
  color: #b0a690;
  padding: 6px 16px;
  border-radius: 0;
  font-size: 15px;
  font-weight: 500;
  transition: color 0.2s;
  position: relative;
}

.nav-links a:hover {
  color: #faf6ee;
}

.nav-links a.active {
  color: #faf6ee;
  font-weight: 600;
}

.nav-links a.active::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 16px;
  right: 16px;
  height: 3px;
  border-radius: 2px;
  background: #c8553d;
}

.nav-msg-link { position: relative; }
.nav-badge {
  position: absolute; top: -2px; right: -2px;
  background: #c8553d; color: #faf6ee; font-size: 10px; font-weight: 700;
  min-width: 16px; height: 16px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; padding: 0 4px;
}

/* === right actions: primary publish + ghost logout === */
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.header-publish-btn {
  background: #c8553d; border: none; color: #faf6ee; font-size: 13px; font-weight: 600;
  border-radius: 6px; padding: 8px 20px; transition: all 0.15s; white-space: nowrap;
}
.header-publish-btn:hover { background: #a8442f; color: #faf6ee; }
.header-publish-btn:active { transform: scale(0.97); }

.header-back-btn {
  background: #c8553d; border: none; color: #faf6ee; font-size: 13px; font-weight: 600;
  border-radius: 6px; padding: 8px 20px; transition: background 0.15s; white-space: nowrap;
}
.header-back-btn:hover { background: #a8442f; color: #faf6ee; }

.header-logout-btn {
  background: none; border: none; color: #8a8170; font-size: 13px;
  padding: 6px 10px; cursor: pointer; transition: color 0.15s; font-weight: 500;
}
.header-logout-btn:hover { color: #d9cfb8; }
.header-logout-btn:active { transform: scale(0.97); }

main.has-header {
  padding-top: 60px;
  min-height: 100vh;
}

/* === notification dropdown === */
.notify-bell {
  position: relative;
  margin-right: 16px;
}

.notify-overlay {
  position: fixed;
  inset: 0;
  z-index: 99;
}

.notify-dropdown {
  position: absolute;
  top: 48px;
  right: 80px;
  width: 340px;
  max-height: 420px;
  background: #faf6ee;
  border-radius: 8px;
  border: 1px solid #d9cfb8;
  z-index: 101;
  overflow: hidden;
}

.notify-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #e8dfc6;
  font-weight: 600;
  font-size: 15px;
  color: #2d2a26;
}

.notify-list {
  overflow-y: auto;
  max-height: 350px;
}

.notify-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f0e8d2;
  cursor: pointer;
  transition: background 0.15s;
}

.notify-item:hover {
  background: #f3ecdb;
}

.notify-item.unread {
  background: #f7ede9;
}

.notify-title {
  font-size: 14px;
  font-weight: 600;
  color: #2d2a26;
  margin-bottom: 4px;
}

.notify-content {
  font-size: 12px;
  color: #8a8170;
  margin-bottom: 4px;
  white-space: pre-line;
}

.notify-time {
  font-size: 11px;
  color: #b0a690;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
}

.notify-empty {
  padding: 40px 0;
  text-align: center;
  color: #b0a690;
  font-size: 14px;
}
</style>

<style>
/* el-plus dialog overrides — bulletin board theme */
.el-dialog { border-radius: 8px !important; overflow: hidden; border: 1px solid #d9cfb8; background: #faf6ee; }
.el-dialog__header { padding: 18px 24px 0 !important; margin: 0 !important; }
.el-dialog__title { font-family: 'Noto Serif SC', Georgia, serif; font-size: 17px !important; font-weight: 700 !important; color: #2d2a26 !important; }
.el-dialog__body { padding: 22px 24px !important; color: #5c5448; }
.el-dialog__footer { padding: 10px 24px 18px !important; }
.el-dialog .el-input__wrapper { border-radius: 6px; box-shadow: 0 0 0 1px #d9cfb8 inset; background: #fff; }
.el-dialog .el-input__wrapper:hover { box-shadow: 0 0 0 1px #c4b896 inset; }
.el-dialog .el-input.is-focus .el-input__wrapper { box-shadow: 0 0 0 1px #c8553d inset; }
.el-dialog .el-button--primary { background: #c8553d !important; border-color: #c8553d !important; border-radius: 6px !important; font-weight: 600 !important; }
.el-dialog .el-button--primary:hover { background: #a8442f !important; border-color: #a8442f !important; }
.el-dialog .el-button { border-radius: 6px !important; }
.el-message-box { border-radius: 8px !important; padding: 0 !important; border: 1px solid #d9cfb8; background: #faf6ee; }
.el-message-box__header { padding: 18px 24px 6px !important; }
.el-message-box__title { font-family: 'Noto Serif SC', Georgia, serif; font-size: 17px !important; font-weight: 700 !important; color: #2d2a26 !important; }
.el-message-box__body { padding: 6px 24px 22px !important; }
.el-message-box__message { color: #5c5448 !important; font-size: 14px !important; margin: 0 !important; }
.el-message-box__input { padding-top: 8px !important; }
.el-message-box__input .el-input__wrapper { border-radius: 6px; box-shadow: 0 0 0 1px #d9cfb8 inset; background: #fff; }
.el-message-box__input .el-input__wrapper:hover { box-shadow: 0 0 0 1px #c4b896 inset; }
.el-message-box__input .el-input.is-focus .el-input__wrapper { box-shadow: 0 0 0 1px #c8553d inset; }
.el-message-box__btns { padding: 0 24px 20px !important; }
.el-message-box__btns .el-button--primary { background: #c8553d !important; border-color: #c8553d !important; border-radius: 6px !important; font-weight: 600 !important; }
.el-message-box__btns .el-button--primary:hover { background: #a8442f !important; }
.el-message-box__btns .el-button { border-radius: 6px !important; }
.el-message-box__content { padding: 0 !important; color: #5c5448 !important; font-size: 14px !important; }
.el-message-box__status.el-icon-warning { color: #c9956b !important; }
</style>
