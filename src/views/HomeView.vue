<template>
  <div class="profile-page">
    <!-- Hero -->
    <div class="hero-section">
      <div class="hero-left">
        <h1 class="hero-title">个人中心</h1>
        <p class="hero-sub">管理你的失物招领信息和账号</p>
      </div>
    </div>

    <div class="content-area">
      <!-- 用户信息卡 -->
      <div class="profile-card">
        <div class="profile-top">
          <div class="profile-avatar">{{ (userInfo?.nickname || userInfo?.username || 'U').charAt(0) }}</div>
          <div class="profile-main">
            <div class="profile-name">{{ userInfo?.nickname || userInfo?.username || '-' }}</div>
            <div class="profile-role">{{ formatRole(userInfo?.role) }}</div>
          </div>
        </div>

        <el-skeleton :loading="loading" animated :rows="3">
          <div class="stats-row" v-if="userInfo">
            <div class="stat-item">
              <div class="stat-value">{{ userInfo.creditScore ?? 100 }}</div>
              <div class="stat-label">信用分</div>
            </div>
            <div class="stat-divider" />
            <div class="stat-item">
              <div class="stat-value">{{ userInfo.successCount ?? 0 }}</div>
              <div class="stat-label">成功认领</div>
            </div>
            <div class="stat-divider" />
            <div class="stat-item">
              <div class="stat-value">{{ formatRole(userInfo.role) }}</div>
              <div class="stat-label">账户类型</div>
            </div>
          </div>
          <div v-else class="empty-info">暂无用户信息</div>
        </el-skeleton>
      </div>

      <!-- 快捷入口 -->
      <div class="quick-links">
        <div class="quick-link" @click="$router.push('/')">
          <span class="ql-icon">🔍</span>
          <span class="ql-text">浏览广场</span>
        </div>
        <div class="quick-link" @click="$router.push('/publish')">
          <span class="ql-icon">✏️</span>
          <span class="ql-text">发布帖子</span>
        </div>
        <div class="quick-link" @click="loadUserInfo">
          <span class="ql-icon">🔄</span>
          <span class="ql-text">刷新信息</span>
        </div>
      </div>

      <!-- 详细信息 -->
      <div class="info-card" v-if="userInfo">
        <div class="info-title">账号信息</div>
        <div class="info-row">
          <span class="info-label">用户 ID</span>
          <span class="info-value">{{ userInfo.id || userInfo.userId || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">用户名</span>
          <span class="info-value">{{ userInfo.username || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">昵称</span>
          <span class="info-value">{{ userInfo.nickname || '-' }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">邮箱</span>
          <span class="info-value">{{ userInfo.email || '未设置' }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { getUserInfo } from '../api/user'

const loading = ref(false)
const userInfo = ref(null)

const getLocalUserInfo = () => {
  const localUser = localStorage.getItem('userInfo')
  if (!localUser) return null
  try {
    return JSON.parse(localUser)
  } catch {
    localStorage.removeItem('userInfo')
    return null
  }
}

const loadUserInfo = async () => {
  loading.value = true
  try {
    const res = await getUserInfo()
    userInfo.value = res.data
    localStorage.setItem('userInfo', JSON.stringify(res.data))
  } catch {
    userInfo.value = getLocalUserInfo()
  } finally {
    loading.value = false
  }
}

const formatRole = (role) => {
  if (role === 1 || role === '1' || role === 'ADMIN') return '管理员'
  return '普通用户'
}

onMounted(() => {
  userInfo.value = getLocalUserInfo()
  loadUserInfo()
})
</script>

<style scoped>
.profile-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 32px 20px;
}

/* Hero */
.hero-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28px 32px;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: #fff;
}

.hero-title {
  font-size: 26px;
  font-weight: 700;
  margin: 0 0 6px;
}

.hero-sub {
  margin: 0;
  opacity: 0.85;
  font-size: 14px;
}

/* Content */
.content-area {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Profile Card */
.profile-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.profile-top {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.profile-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #66b1ff);
  color: #fff;
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.profile-name {
  font-size: 20px;
  font-weight: 700;
  color: #303133;
}

.profile-role {
  font-size: 13px;
  color: #909399;
  margin-top: 2px;
}

/* Stats */
.stats-row {
  display: flex;
  align-items: center;
  padding: 16px 0;
  border-top: 1px solid #f2f3f5;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #409eff;
}

.stat-label {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.stat-divider {
  width: 1px;
  height: 36px;
  background: #ebeef5;
}

.empty-info {
  text-align: center;
  color: #c0c4cc;
  padding: 20px 0;
}

/* Quick Links */
.quick-links {
  display: flex;
  gap: 12px;
}

.quick-link {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: transform 0.2s, box-shadow 0.2s;
}

.quick-link:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.ql-icon {
  font-size: 28px;
  display: block;
  margin-bottom: 6px;
}

.ql-text {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

/* Info Card */
.info-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.info-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #f5f6f8;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: #909399;
  font-size: 14px;
}

.info-value {
  color: #303133;
  font-size: 14px;
  font-weight: 500;
}
</style>
