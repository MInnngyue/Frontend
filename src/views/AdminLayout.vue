<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const adminName = computed(() => {
  try {
    const ui = JSON.parse(localStorage.getItem('userInfo') || '{}')
    return ui.username || '管理员'
  } catch { return '管理员' }
})

function isActive(path) {
  return route.path === path
}

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  router.push('/login')
}
</script>

<template>
  <div class="admin-shell">
    <header class="admin-header">
      <div class="admin-header-inner">
        <div class="admin-brand">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          <span>校园失物招领</span>
          <span class="admin-tag">管理后台</span>
        </div>
        <nav class="admin-nav">
          <router-link to="/admin" :class="{ active: isActive('/admin') }">数据概览</router-link>
          <router-link to="/admin/posts" :class="{ active: isActive('/admin/posts') }">帖子管理</router-link>
          <router-link to="/admin/users" :class="{ active: isActive('/admin/users') }">用户管理</router-link>
          <router-link to="/admin/categories" :class="{ active: isActive('/admin/categories') }">分类管理</router-link>
        </nav>
        <div class="admin-right">
          <span class="admin-user">{{ adminName }}</span>
          <button class="admin-logout" @click="logout">退出</button>
        </div>
      </div>
    </header>
    <main class="admin-main">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.admin-shell { min-height: 100vh; }

.admin-header {
  position: fixed; top: 0; left: 0; right: 0;
  height: var(--header-h);
  background: #1f2937;
  border-bottom: 1px solid #374151;
  z-index: 100;
}

.admin-header-inner {
  max-width: var(--max-w);
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  gap: 24px;
}

.admin-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: var(--pen-font);
  font-size: 22px;
  font-weight: 700;
  color: #f9fafb;
  white-space: nowrap;
  flex-shrink: 0;
}
.admin-brand svg { color: var(--indigo); flex-shrink: 0; }

.admin-tag {
  background: var(--indigo);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: var(--r-pill);
  font-family: var(--body-font);
  letter-spacing: 0.5px;
}

.admin-nav {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  justify-content: center;
}

.admin-nav a {
  text-decoration: none;
  color: #9ca3af;
  padding: 6px 16px;
  font-size: 15px;
  font-weight: 500;
  transition: var(--transition);
  position: relative;
}
.admin-nav a:hover { color: #f9fafb; }
.admin-nav a.active { color: #f9fafb; font-weight: 600; }
.admin-nav a.active::after {
  content: '';
  position: absolute;
  bottom: -4px; left: 16px; right: 16px;
  height: 2px;
  border-radius: 1px;
  background: var(--indigo);
}

.admin-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.admin-user {
  color: #d1d5db;
  font-size: 14px;
  font-weight: 500;
}

.admin-logout {
  background: none;
  border: 1px solid rgba(156,163,175,0.3);
  color: #9ca3af;
  font-size: 13px;
  border-radius: var(--r-btn);
  padding: 5px 14px;
  cursor: pointer;
  transition: var(--transition);
}
.admin-logout:hover { border-color: var(--rose); color: #fca5a5; background: rgba(220,38,38,0.1); }

.admin-main {
  padding-top: var(--header-h);
  min-height: 100vh;
}
</style>
