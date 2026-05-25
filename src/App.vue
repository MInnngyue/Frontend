<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const showNav = computed(() => route.path !== '/login')

function isActive(path) {
  return route.path === path || (path === '/' && route.path.startsWith('/'))
}

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  router.push('/login')
}
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
          <el-button text @click="logout">退出登录</el-button>
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
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 20px;
}

.brand {
  font-size: 18px;
  font-weight: 600;
  color: #409eff;
  cursor: pointer;
  margin-right: 40px;
}

.nav-links {
  display: flex;
  gap: 8px;
  flex: 1;
}

.nav-links a {
  text-decoration: none;
  color: #606266;
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s;
}

.nav-links a:hover,
.nav-links a.active {
  color: #409eff;
  background: #ecf5ff;
}

.header-right {
  display: flex;
  align-items: center;
}

main.has-header {
  padding-top: 56px;
  min-height: 100vh;
}
</style>
