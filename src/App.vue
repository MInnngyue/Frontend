<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMessages, getUnreadCount, markAllRead, markRead } from '@/api/message'

const route = useRoute()
const router = useRouter()

const showNav = computed(() => route.path !== '/login')
const unreadCount = ref(0)
const messages = ref([])
const showNotifications = ref(false)

function isActive(path) {
  return route.path === path || (path === '/' && route.path.startsWith('/'))
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
  } catch { /* ignore */ }
}

async function toggleNotifications() {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value) {
    const res = await getMessages()
    messages.value = res.data
  }
}

async function handleMarkRead(id) {
  await markRead(id)
  unreadCount.value = Math.max(0, unreadCount.value - 1)
}

async function handleMarkAllRead() {
  await markAllRead()
  unreadCount.value = 0
}

function goToPost(id) {
  showNotifications.value = false
  if (id) router.push(`/post/${id}`)
}

onMounted(() => {
  loadUnreadCount()
  setInterval(loadUnreadCount, 30000) // 30s 轮询
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
          <router-link to="/profile" :class="{ active: route.path === '/profile' }">个人中心</router-link>
        </nav>
        <div class="header-right">
          <!-- 通知铃铛 -->
          <div class="notify-bell" @click="toggleNotifications">
            <el-badge :value="unreadCount" :hidden="unreadCount === 0">
              <span style="font-size:18px;cursor:pointer">🔔</span>
            </el-badge>
          </div>

          <!-- 通知下拉 -->
          <div v-if="showNotifications" class="notify-dropdown" @click.stop>
            <div class="notify-header">
              <span>消息通知</span>
              <el-button text size="small" @click="handleMarkAllRead">全部已读</el-button>
            </div>
            <div class="notify-list" v-if="messages.length > 0">
              <div
                v-for="msg in messages"
                :key="msg.id"
                class="notify-item"
                :class="{ unread: msg.isRead === 0 }"
                @click="handleMarkRead(msg.id); goToPost(msg.relatedPostId)"
              >
                <div class="notify-title">{{ msg.title }}</div>
                <div class="notify-content">{{ msg.content?.substring(0, 60) }}...</div>
                <div class="notify-time">{{ msg.createTime?.substring(0, 16) }}</div>
              </div>
            </div>
            <div v-else class="notify-empty">暂无消息</div>
          </div>

          <el-button text @click="logout">退出登录</el-button>
        </div>

        <!-- 通知下拉遮罩 -->
        <div v-if="showNotifications" class="notify-overlay" @click="showNotifications = false" />
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

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f7fa;
  color: #303133;
}

.app-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  z-index: 100;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: grid;
  grid-template-columns: 160px 1fr 160px;
  align-items: center;
  padding: 0 24px;
}

.brand {
  font-size: 18px;
  font-weight: 700;
  color: #409eff;
  cursor: pointer;
  letter-spacing: 0.5px;
}

.nav-links {
  display: flex;
  justify-content: center;
  gap: 4px;
}

.nav-links a {
  text-decoration: none;
  color: #606266;
  padding: 6px 18px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.nav-links a:hover {
  color: #409eff;
  background: #ecf5ff;
}

.nav-links a.active {
  color: #409eff;
  background: #ecf5ff;
}

.header-right {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

main.has-header {
  padding-top: 56px;
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
  background: #ecf5ff;
}

.notify-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 4px;
}

.notify-content {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
  white-space: pre-line;
}

.notify-time {
  font-size: 11px;
  color: #c0c4cc;
}

.notify-empty {
  padding: 40px 0;
  text-align: center;
  color: #c0c4cc;
  font-size: 14px;
}
</style>
