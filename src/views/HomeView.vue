<template>
  <div class="profile-page">
    <h1 class="page-title">个人中心</h1>

    <div class="content-area">
      <!-- 用户信息卡 -->
      <div class="profile-card">
        <div class="profile-top">
          <div class="profile-avatar">{{ (userInfo?.nickname || userInfo?.username || 'U').charAt(0) }}</div>
          <div class="profile-main">
            <div class="profile-name">{{ userInfo?.nickname || userInfo?.username || '-' }}</div>
            <div class="profile-sign">{{ userInfo?.signature || '这个人很懒，什么都没写' }}</div>
          </div>
          <div class="profile-right">
            <el-button v-if="isAdmin" class="admin-entry-btn" @click="$router.push('/admin')">管理后台</el-button>
            <el-dropdown @command="handleMore">
              <el-button class="more-btn">更多 ▾</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="avatar">更换头像</el-dropdown-item>
                  <el-dropdown-item command="info">更改个人信息</el-dropdown-item>
                  <el-dropdown-item command="sign">更改签名</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
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
        <div class="quick-link" @click="$router.push('/profile')">
          <span class="ql-icon">📝</span>
          <span class="ql-text">我的发布</span>
        </div>
        <div class="quick-link" @click="$router.push('/profile')">
          <span class="ql-icon">👁️</span>
          <span class="ql-text">浏览历史</span>
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
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getUserInfo } from '../api/user'

const router = useRouter()

const loading = ref(false)
const userInfo = ref(null)

const isAdmin = computed(() => {
  return userInfo.value && (userInfo.value.role === 1 || userInfo.value.role === '1' || userInfo.value.role === 'ADMIN')
})

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

const handleMore = (cmd) => {
  if (cmd === 'avatar') ElMessage.info('头像更换功能开发中')
  else if (cmd === 'info') ElMessage.info('个人信息修改开发中')
  else if (cmd === 'sign') ElMessage.info('签名修改开发中')
}

onMounted(() => {
  userInfo.value = getLocalUserInfo()
  loadUserInfo()
})</script>

<style scoped>
.profile-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 20px 20px 32px;
}

.page-title { font-size: 56px; font-weight: 800; color: #111827; margin: 0 0 24px; text-align: center; }

.more-btn { background: #f3f4f6; border: 1px solid #e5e7eb; color: #4b5563; font-size: 13px; border-radius: 8px; padding: 6px 14px; }
.more-btn:hover { background: #1a1a1a; border-color: #1a1a1a; color: #fff; }

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
  padding: 18px 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.profile-top {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.profile-avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: #409eff;
  color: #fff;
  font-size: 20px;
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

.profile-main { flex: 1; }
.profile-sign { font-size: 12px; color: #909399; margin-top: 2px; }

.profile-right { display: flex; align-items: center; gap: 10px; }

.admin-entry-btn {
  background: #5a67d8;
  border: none;
  color: #fff;
  font-size: 13px;
  border-radius: 8px;
  padding: 8px 18px;
}
.admin-entry-btn:hover {
  opacity: 0.9;
  color: #fff;
}

/* Stats */
.stats-row { display: flex; align-items: center; padding: 12px 0; }

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

.archive-list { display: flex; flex-direction: column; gap: 6px; }
.archive-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f5f6f8; }
.archive-row:last-child { border-bottom: none; }
.archive-info { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.archive-title { font-size: 14px; color: #303133; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
</style>
