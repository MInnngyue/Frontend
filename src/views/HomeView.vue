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
            <input ref="avatarInput" type="file" accept="image/*" style="display:none" @change="handleAvatarChange" />
            <el-dropdown @command="handleMore">
              <el-button class="more-btn" :loading="avatarUploading">更多 ▾</el-button>
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
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-value">{{ userInfo.successCount ?? 0 }}</div>
              <div class="stat-label">成功认领</div>
            </div>
            <div class="stat-divider"></div>
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
        <div class="quick-link" @click="$router.push('/publish')">
          <span class="ql-icon">📝</span>
          <span class="ql-text">发布帖子</span>
        </div>
        <div class="quick-link" @click="$router.push('/messages')">
          <span class="ql-icon">💬</span>
          <span class="ql-text">消息中心</span>
        </div>
        <div class="quick-link" @click="$router.push('/my-posts')">
          <span class="ql-icon">📋</span>
          <span class="ql-text">我的帖子</span>
        </div>
      </div>

      <!-- 我的帖子 -->
      <div class="info-card">
        <div class="info-title">我的帖子</div>
        <el-skeleton :loading="postsLoading" animated :rows="3">
          <div v-if="myPosts.length > 0" class="posts-list-wrap" :class="{ collapsed: !postsExpanded && myPosts.length > 3 }">
            <div class="archive-list">
              <div v-for="p in (postsExpanded ? myPosts : myPosts.slice(0, 3))" :key="p.id" class="archive-row" @click="goPost(p.id)" style="cursor:pointer">
                <div class="archive-info">
                  <span class="s-capsule" :class="p.type === 0 ? 'sc-lost' : 'sc-found'">{{ p.type === 0 ? '寻物' : '招领' }}</span>
                  <span class="archive-title">{{ p.title }}</span>
                </div>
                <span class="archive-status">{{ statusLabel(p.status) }}</span>
              </div>
            </div>
            <div v-if="!postsExpanded && myPosts.length > 3" class="gradient-fade"></div>
          </div>
          <div v-else class="empty-info">还没有发布过帖子</div>
        </el-skeleton>
        <button v-if="myPosts.length > 3" class="toggle-more-btn" @click="postsExpanded = !postsExpanded">
          {{ postsExpanded ? '收起 ▲' : '更多 ▼' }}
        </button>
      </div>

      <!-- Sign dialog -->
      <el-dialog v-model="showSignDialog" title="修改签名" width="380px">
        <el-input v-model="signForm.signature" maxlength="50" placeholder="写下你的个性签名" show-word-limit />
        <template #footer>
          <el-button @click="showSignDialog = false">取消</el-button>
          <el-button type="primary" @click="saveSign">保存</el-button>
        </template>
      </el-dialog>

      <!-- Info dialog -->
      <el-dialog v-model="showInfoDialog" title="修改个人信息" width="400px">
        <el-form label-width="60px">
          <el-form-item label="昵称"><el-input v-model="infoForm.nickname" maxlength="20" /></el-form-item>
          <el-form-item label="手机号"><el-input v-model="infoForm.phone" maxlength="11" placeholder="选填" /></el-form-item>
          <el-form-item label="邮箱"><el-input v-model="infoForm.email" maxlength="50" placeholder="选填" /></el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="showInfoDialog = false">取消</el-button>
          <el-button type="primary" @click="saveInfo">保存</el-button>
        </template>
      </el-dialog>

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
import { getUserInfo, updateProfile, getMyPosts } from '../api/user'
import { uploadImage } from '@/api/upload'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const userInfo = ref(null)
const myPosts = ref([])
const postsLoading = ref(false)
const postsExpanded = ref(false)

const showSignDialog = ref(false)
const showInfoDialog = ref(false)
const signForm = ref({ signature: '' })
const infoForm = ref({ nickname: '', phone: '', email: '' })
const avatarUploading = ref(false)

const isAdmin = computed(() => {
  return userInfo.value && (userInfo.value.role === 1 || userInfo.value.role === '1' || userInfo.value.role === 'ADMIN')
})

const getLocalUserInfo = () => {
  const localUser = localStorage.getItem('userInfo')
  if (!localUser) return null
  try { return JSON.parse(localUser) } catch { localStorage.removeItem('userInfo'); return null }
}

const loadUserInfo = async () => {
  loading.value = true
  try {
    const res = await getUserInfo()
    userInfo.value = res.data
    localStorage.setItem('userInfo', JSON.stringify(res.data))
  } catch {
    userInfo.value = getLocalUserInfo()
  } finally { loading.value = false }
}

const loadMyPosts = async () => {
  postsLoading.value = true
  try {
    const res = await getMyPosts({ page: 1, size: 20 })
    myPosts.value = res.data || []
  } catch { myPosts.value = [] }
  finally { postsLoading.value = false }
}

const formatRole = (role) => {
  if (role === 1 || role === '1' || role === 'ADMIN') return '管理员'
  return '普通用户'
}

function statusLabel(s) {
  const map = { 0: '进行中', 1: '已匹配', 2: '认领中', 3: '已完结', 4: '已归档', 5: '已下架' }
  return map[s] || '未知'
}

async function handleAvatarChange(e) {
  const file = e.target.files?.[0]
  if (!file) return
  avatarUploading.value = true
  try {
    const res = await uploadImage(file)
    const url = res.data?.url || res.data
    await updateProfile({ avatar: url })
    userInfo.value.avatar = url
    ElMessage.success('头像已更新')
  } catch { ElMessage.error('头像上传失败') }
  finally { avatarUploading.value = false }
}

function openSignDialog() {
  signForm.value.signature = userInfo.value?.signature || ''
  showSignDialog.value = true
}
async function saveSign() {
  try {
    await updateProfile({ signature: signForm.value.signature })
    userInfo.value.signature = signForm.value.signature
    showSignDialog.value = false
    ElMessage.success('签名已更新')
  } catch { /* 拦截器已处理错误 */ }
}

function openInfoDialog() {
  infoForm.value.nickname = userInfo.value?.nickname || ''
  infoForm.value.phone = userInfo.value?.phone || ''
  infoForm.value.email = userInfo.value?.email || ''
  showInfoDialog.value = true
}
async function saveInfo() {
  try {
    await updateProfile(infoForm.value)
    Object.assign(userInfo.value, infoForm.value)
    showInfoDialog.value = false
    ElMessage.success('资料已更新')
  } catch { /* 拦截器已处理错误 */ }
}

function handleMore(cmd) {
  if (cmd === 'avatar') {
    const input = document.querySelector('input[ref="avatarInput"]')
    if (input) input.click()
  } else if (cmd === 'info') {
    openInfoDialog()
  } else if (cmd === 'sign') {
    openSignDialog()
  }
}

function goPost(id) { router.push(`/post/${id}`) }

onMounted(() => {
  userInfo.value = getLocalUserInfo()
  loadUserInfo()
  loadMyPosts()
})
</script>

<style scoped>
.profile-page { max-width: 720px; margin: 0 auto; padding: 20px 20px 32px; background: #f8fafc; min-height: 100vh; }
.page-title { font-size: 32px; font-weight: 700; color: #1e293b; margin: 0 0 24px; text-align: left; }
.more-btn { background: #f1f5f9; border: 1px solid #e2e8f0; color: #475569; font-size: 13px; border-radius: 8px; padding: 6px 14px; }
.more-btn:hover { background: #eef2ff; border-color: #4f46e5; color: #4f46e5; }
.content-area { display: flex; flex-direction: column; gap: 14px; }
.profile-card { background: #fff; border-radius: 12px; padding: 18px 20px; border: 1px solid #e2e8f0; }
.profile-top { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.profile-avatar { width: 46px; height: 46px; border-radius: 50%; background: #4f46e5; color: #fff; font-size: 20px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.profile-name { font-size: 20px; font-weight: 700; color: #1e293b; }
.profile-main { flex: 1; }
.profile-sign { font-size: 12px; color: #64748b; margin-top: 2px; }
.profile-right { display: flex; align-items: center; gap: 10px; margin-left: auto; flex-shrink: 0; }
.admin-entry-btn { background: #4f46e5; border: none; color: #fff; font-size: 13px; border-radius: 8px; padding: 8px 18px; }
.admin-entry-btn:hover { opacity: 0.9; color: #fff; }
.stats-row { display: flex; align-items: center; padding: 12px 0; }
.stat-item { flex: 1; text-align: center; }
.stat-value { font-size: 24px; font-weight: 700; color: #4f46e5; }
.stat-label { font-size: 12px; color: #64748b; margin-top: 4px; }
.stat-divider { width: 1px; height: 32px; background: #e2e8f0; }
.empty-info { text-align: center; color: #94a3b8; padding: 20px 0; }
.quick-links { display: flex; gap: 12px; }
.quick-link { flex: 1; background: #fff; border-radius: 12px; padding: 20px; text-align: center; cursor: pointer; border: 1px solid #e2e8f0; transition: all 0.2s; }
.quick-link:hover { border-color: #4f46e5; box-shadow: 0 2px 8px rgba(79,70,229,0.08); }
.ql-icon { font-size: 28px; display: block; margin-bottom: 6px; }
.ql-text { font-size: 14px; color: #475569; font-weight: 500; }
.info-card { background: #fff; border-radius: 12px; padding: 24px; border: 1px solid #e2e8f0; }
.info-title { font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 16px; }
.info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
.info-row:last-child { border-bottom: none; }
.info-label { color: #64748b; font-size: 14px; }
.info-value { color: #1e293b; font-size: 14px; font-weight: 500; }
.archive-list { display: flex; flex-direction: column; gap: 6px; }
.archive-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; border-radius: 6px; border-bottom: 1px solid #f1f5f9; cursor: pointer; transition: background 0.15s; }
.archive-row:last-child { border-bottom: none; }
.archive-row:hover { background: #f1f5f9; }
.archive-info { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 0; }
.archive-title { font-size: 14px; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.archive-status { font-size: 12px; color: #64748b; white-space: nowrap; }
.s-capsule { padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; color: #fff; }
.sc-lost { background: #ef4444; }
.sc-found { background: #4f46e5; }

/* 我的帖子折叠展开 */
.posts-list-wrap { position: relative; overflow: hidden; }
.posts-list-wrap.collapsed { max-height: 180px; }
.gradient-fade {
  position: absolute; bottom: 0; left: 0; right: 0; height: 50px;
  background: linear-gradient(to bottom, transparent, #fff);
  pointer-events: none;
}
.toggle-more-btn {
  display: block; width: 100%; margin-top: 12px; padding: 8px 0;
  border: none; background: transparent; color: #4f46e5; font-size: 13px;
  font-weight: 600; cursor: pointer; transition: color 0.15s;
}
.toggle-more-btn:hover { color: #4338ca; }

/* Dialog overrides */
:deep(.el-dialog) { border-radius: 14px; overflow: hidden; }
:deep(.el-dialog__header) { padding: 20px 24px 0; margin: 0; }
:deep(.el-dialog__title) { font-size: 17px; font-weight: 700; color: #1e293b; }
:deep(.el-dialog__body) { padding: 20px 24px; }
:deep(.el-dialog__footer) { padding: 12px 24px 20px; }
:deep(.el-dialog .el-input__wrapper) { border-radius: 8px; box-shadow: 0 0 0 1px #e2e8f0 inset; }
:deep(.el-dialog .el-input__wrapper:hover) { box-shadow: 0 0 0 1px #cbd5e1 inset; }
:deep(.el-dialog .el-input.is-focus .el-input__wrapper) { box-shadow: 0 0 0 1px #4f46e5 inset; }
:deep(.el-dialog .el-button--primary) { background: #4f46e5; border-color: #4f46e5; border-radius: 8px; font-weight: 600; }
:deep(.el-dialog .el-button--primary:hover) { background: #4338ca; border-color: #4338ca; }
:deep(.el-dialog .el-button) { border-radius: 8px; }
</style>
