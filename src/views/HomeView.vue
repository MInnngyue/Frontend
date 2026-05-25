<template>
  <div class="home-page">
    <el-container>
      <el-header class="header">
        <div class="brand">失物招领系统</div>
        <div class="user-area">
          <span v-if="userInfo" class="welcome">
            欢迎你，{{ userInfo.nickname || userInfo.username }}
          </span>
          <el-button type="danger" plain @click="handleLogout">退出登录</el-button>
        </div>
      </el-header>

      <el-main class="main">
        <el-card class="user-card">
          <template #header>
            <div class="card-header">
              <span>当前登录用户</span>
              <el-button type="primary" link :loading="loading" @click="loadUserInfo">
                刷新
              </el-button>
            </div>
          </template>

          <el-skeleton :loading="loading" animated :rows="4">
            <el-descriptions v-if="userInfo" :column="1" border>
              <el-descriptions-item label="用户ID">
                {{ userInfo.userId || userInfo.id || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="用户名">
                {{ userInfo.username || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="昵称">
                {{ userInfo.nickname || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="角色">
                {{ formatRole(userInfo.role) }}
              </el-descriptions-item>
            </el-descriptions>

            <el-empty v-else description="暂无用户信息" />
          </el-skeleton>
        </el-card>

        <el-card class="todo-card">
          <template #header>下一步功能</template>
          <el-alert
            title="登录注册闭环已完成，接下来可以开发失物招领信息发布、列表和详情功能。"
            type="success"
            :closable="false"
            show-icon
          />
        </el-card>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserInfo } from '../api/user'

const router = useRouter()
const loading = ref(false)
const userInfo = ref(null)

const getLocalUserInfo = () => {
  const localUser = localStorage.getItem('userInfo')
  if (!localUser) return null

  try {
    return JSON.parse(localUser)
  } catch (error) {
    console.error(error)
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
  } catch (error) {
    console.error(error)
    userInfo.value = getLocalUserInfo()
  } finally {
    loading.value = false
  }
}

const formatRole = (role) => {
  if (role === 1 || role === '1' || role === 'ADMIN') return '管理员'
  return '普通用户'
}

const handleLogout = async () => {
  try {
    await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })

    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    ElMessage.success('已退出登录')
    router.push('/login')
  } catch (error) {
    // 用户取消退出，不需要处理
  }
}

onMounted(() => {
  userInfo.value = getLocalUserInfo()
  loadUserInfo()
})
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.header {
  height: 64px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 32px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
}

.brand {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.user-area {
  display: flex;
  align-items: center;
  gap: 16px;
}

.welcome {
  color: #4b5563;
}

.main {
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 20px;
}

.user-card,
.todo-card {
  margin-bottom: 20px;
  border-radius: 12px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
