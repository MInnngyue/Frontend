<script setup>
import { ref, computed, onMounted } from 'vue'
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
  } catch { /* ignore */ }
}

onMounted(() => {
  loadUnreadCount()
  setInterval(loadUnreadCount, 30000)
})
</script>

<template>
  <div class="app-shell">
    <header v-if="showNav" class="app-header">
      <div class="header-inner">
        <div class="brand" @click="router.push('/')">校园失物招领</div>
        <nav class="nav-links">
          <router-link to="/" :class="{ active: route.path === '/' }">失物广场</router-link>
          <router-link to="/publish" :class="{ active: route.path === '/publish' }">发布帖子</router-link>
          <router-link to="/messages" :class="{ active: route.path === '/messages' }" class="nav-msg-link">
            消息
            <span v-if="unreadCount + pmUnread > 0" class="nav-badge">{{ unreadCount + pmUnread }}</span>
          </router-link>
          <router-link to="/profile" :class="{ active: route.path === '/profile' }">个人中心</router-link>
        </nav>
        <div class="header-right">
          <el-button v-if="isPublishPage" class="header-back-btn" @click="router.push('/')">&larr; 返回广场</el-button>
          <el-button v-else class="header-publish-btn" @click="router.push('/publish')">+ 发布帖子</el-button>
          <el-button class="header-logout-btn" @click="logout">退出登录</el-button>
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
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f8fafc;
  color: #1e293b;
}

.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 72px;
  background: #fff;
  border-bottom: 1px solid #e2e8f0;
  z-index: 100;
}

.header-inner {
  max-width: 1400px;
  margin: 0 auto;
  height: 100%;
  display: grid;
  grid-template-columns: 240px 1fr 240px;
  align-items: center;
  padding: 0 36px;
}

.brand {
  font-size: 22px;
  font-weight: 700;
  color: #4f46e5;
  cursor: pointer;
  letter-spacing: 0.5px;
}

.nav-links {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.nav-links a {
  text-decoration: none;
  color: #475569;
  padding: 8px 22px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.2s;
  position: relative;
}

.nav-links a:hover {
  color: #4f46e5;
  background: #eef2ff;
}

.nav-links a.active {
  color: #4f46e5;
  background: #eef2ff;
}

.nav-links a.active::after {
  content: '';
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 16px;
  height: 3px;
  border-radius: 2px;
  background: #4f46e5;
}

.nav-msg-link { position: relative; }
.nav-badge {
  position: absolute; top: -2px; right: -6px;
  background: #ef4444; color: #fff; font-size: 10px; font-weight: 700;
  min-width: 15px; height: 15px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center; padding: 0 3px;
}

.header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.header-publish-btn {
  background: #4f46e5; border: none; color: #fff; font-size: 13px; font-weight: 600;
  border-radius: 8px; padding: 7px 18px; transition: background 0.15s; white-space: nowrap;
}
.header-logout-btn { background: none; border: 1px solid #e2e8f0; color: #64748b; font-size: 13px; border-radius: 8px; padding: 5px 14px; transition: all 0.15s; }
.header-logout-btn:hover { border-color: #ef4444; color: #ef4444; }
.header-logout-btn:focus { border-color: #e2e8f0; color: #64748b; }
.header-publish-btn:hover { background: #4338ca; color: #fff; }

.header-back-btn {
  background: #4f46e5; border: none; color: #fff; font-size: 13px; font-weight: 600;
  border-radius: 8px; padding: 7px 18px; transition: background 0.15s; white-space: nowrap;
}
.header-back-btn:hover { background: #4338ca; color: #fff; }

main.has-header {
  padding-top: 72px;
  min-height: 100vh;
}

/* Notification */
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
  top: 52px;
  right: 80px;
  width: 340px;
  max-height: 420px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 101;
  overflow: hidden;
}

.notify-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
  font-weight: 600;
  font-size: 15px;
}

.notify-list {
  overflow-y: auto;
  max-height: 350px;
}

.notify-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f5f6f8;
  cursor: pointer;
  transition: background 0.15s;
}

.notify-item:hover {
  background: #f5f7fa;
}

.notify-item.unread {
  background: #eef2ff;
}

.notify-title {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.notify-content {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 4px;
  white-space: pre-line;
}

.notify-time {
  font-size: 11px;
  color: #94a3b8;
}

.notify-empty {
  padding: 40px 0;
  text-align: center;
  color: #94a3b8;
  font-size: 14px;
}
</style>
