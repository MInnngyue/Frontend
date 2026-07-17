<template>
  <div class="page profile-page">
    <div class="page-header">
      <div>
        <h1>个人中心</h1>
        <p class="subtitle">{{ userInfo?.nickname || userInfo?.username || '-' }}，欢迎回来</p>
      </div>
      <el-button v-if="isAdmin" type="primary" @click="$router.push('/admin')">进入管理后台</el-button>
    </div>

    <div class="content-area">
      <!-- user info card -->
      <div class="card-wrap">
        <div class="bind-rings"><span></span><span></span><span></span></div>
        <div class="note-card profile-card">
          <div class="profile-top">
            <div class="avatar avatar-lg">{{ (userInfo?.nickname || userInfo?.username || 'U').charAt(0) }}</div>
            <div class="profile-main">
              <div class="profile-name">{{ userInfo?.nickname || userInfo?.username || '-' }}</div>
              <div class="profile-sign">{{ userInfo?.signature || '还没有写签名' }}</div>
            </div>
            <div class="profile-right">
              <input ref="avatarInput" type="file" accept="image/*" style="display:none" @change="handleAvatarChange" />
              <el-dropdown @command="handleMore">
                <el-button class="btn-secondary" :loading="avatarUploading">更多 <span style="font-size:10px">&#9662;</span></el-button>
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
            <div v-else class="empty-state">
              <p class="empty-text">信息加载中...</p>
            </div>
          </el-skeleton>
        </div>
      </div>

      <!-- quick links -->
      <div class="quick-links">
        <div class="quick-link" @click="$router.push('/publish')">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          <span>发布帖子</span>
        </div>
        <div class="quick-link" @click="$router.push('/messages')">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span>消息中心</span>
        </div>
        <div class="quick-link" @click="$router.push('/my-posts')">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          <span>我的帖子</span>
        </div>
        <div class="quick-link" @click="$router.push('/claims')">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <span>认领进度</span>
        </div>
      </div>

      <!-- my posts -->
      <div class="card-wrap">
        <div class="bind-rings"><span></span><span></span><span></span></div>
        <div class="note-card">
          <h2 class="section-title">我的帖子</h2>
          <el-skeleton :loading="postsLoading" animated :rows="3">
            <div v-if="myPosts.length > 0">
              <div v-for="p in myPosts.slice(0, 5)" :key="p.id" class="post-row" @click="goPost(p.id)">
                <span class="tag-type" :class="p.type === 0 ? 'lost' : 'found'">{{ p.type === 0 ? '寻物' : '招领' }}</span>
                <span class="post-title">{{ p.title }}</span>
                <span class="post-time">{{ p.createTime?.replace('T', ' ') }}</span>
              </div>
              <button v-if="myPosts.length > 5" class="btn-ghost more-btn" @click="$router.push('/my-posts')">查看全部 &rarr;</button>
            </div>
            <div v-else class="empty-state">
              <p class="empty-text">你还没有发过帖子</p>
              <p class="empty-hint">去广场看看吧</p>
            </div>
          </el-skeleton>
        </div>
      </div>

      <!-- account info -->
      <div class="card-wrap" v-if="userInfo">
        <div class="bind-rings"><span></span><span></span><span></span></div>
        <div class="note-card">
          <h2 class="section-title">账号信息</h2>
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

    <!-- dialogs -->
    <el-dialog v-model="showSignDialog" title="修改签名" width="380px">
      <el-input v-model="signForm.signature" maxlength="50" placeholder="写下你的个性签名" show-word-limit />
      <template #footer>
        <el-button @click="showSignDialog = false">取消</el-button>
        <el-button type="primary" @click="saveSign">保存</el-button>
      </template>
    </el-dialog>

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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getUserInfo, updateProfile, getMyPosts } from '../api/user'
import { uploadImage } from '@/api/upload'
import { ElMessage } from 'element-plus'

const router = useRouter()
const loading = ref(false)
const userInfo = ref(null)
const myPosts = ref([])
const postsLoading = ref(false)

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
  } catch {}
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
  } catch {}
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
.profile-page { max-width: 720px; }

.section-title {
  font-family: var(--pen-font);
  font-size: 18px;
  font-weight: 700;
  color: var(--ink-900);
  margin-bottom: 16px;
}

/* profile top */
.profile-top { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
.profile-main { flex: 1; min-width: 0; }
.profile-name { font-size: 20px; font-weight: 700; color: var(--ink-900); }
.profile-sign { font-size: 13px; color: var(--ink-500); margin-top: 4px; }
.profile-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

/* stats */
.stats-row { display: flex; align-items: center; padding: 16px 0; }
.stat-item { flex: 1; text-align: center; }
.stat-value { font-family: var(--mono-font); font-size: 28px; font-weight: 700; color: var(--indigo); }
.stat-label { font-size: 12px; color: var(--ink-500); margin-top: 4px; }
.stat-divider { width: 1px; height: 36px; background: var(--page-edge); }

/* quick links */
.quick-links { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.quick-link {
  background: var(--page);
  border: 1px solid var(--page-edge);
  border-radius: var(--r-card);
  padding: 20px 12px;
  text-align: center;
  cursor: pointer;
  transition: var(--transition);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.quick-link:hover { border-color: var(--indigo); box-shadow: 0 2px 8px rgba(79,70,229,0.08); }
.quick-link span { font-size: 14px; color: var(--ink-700); font-weight: 500; }

/* post rows */
.post-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: var(--transition);
}
.post-row:last-child { border-bottom: none; }
.post-row:hover { background: #f9fafb; }
.post-title { flex: 1; font-size: 14px; color: var(--ink-900); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.post-time { font-family: var(--mono-font); font-size: 12px; color: var(--ink-300); white-space: nowrap; }
.more-btn { margin-top: 12px; }

/* account info rows */
.info-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}
.info-row:last-child { border-bottom: none; }
.info-label { color: var(--ink-500); font-size: 14px; }
.info-value { color: var(--ink-900); font-size: 14px; font-weight: 500; }
</style>
