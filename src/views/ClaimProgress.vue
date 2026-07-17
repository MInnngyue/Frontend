<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyClaims, confirmClaim, cancelClaim } from '@/api/claim'
import { ElMessage } from 'element-plus'

const router = useRouter()
const claims = ref([])
const loading = ref(true)
const confirming = ref(null)
const canceling = ref(null)

const searchText = ref('')
const filterStatus = ref('all')

onMounted(async () => {
  try { claims.value = (await getMyClaims()).data }
  catch { claims.value = [] }
  finally { loading.value = false }
})

function typeLabel(t) { return t === 0 ? '寻物' : '招领' }
function statusCn(s) {
  const map = { 0: '待确认', 1: '一方已确认', 2: '已完结', 3: '已取消' }
  return map[s] || '未知'
}

function sortPriority(c) {
  if (c.claimStatus === 2 || c.claimStatus === 3) return 3
  const myConfirmed = c.myRole === 'owner' ? c.ownerConfirmed : c.claimerConfirmed
  const otherConfirmed = c.myRole === 'owner' ? c.claimerConfirmed : c.ownerConfirmed
  if (!myConfirmed) return 0
  if (!otherConfirmed) return 1
  return 2
}

const filteredClaims = computed(() => {
  let list = [...claims.value]
  list.sort((a, b) => sortPriority(a) - sortPriority(b))
  if (searchText.value.trim()) {
    const q = searchText.value.trim().toLowerCase()
    list = list.filter(c =>
      c.postTitle?.toLowerCase().includes(q) ||
      typeLabel(c.postType).includes(q) ||
      c.otherPartyName?.toLowerCase().includes(q)
    )
  }
  if (filterStatus.value === 'pending') {
    list = list.filter(c => {
      const myC = c.myRole === 'owner' ? c.ownerConfirmed : c.claimerConfirmed
      return c.claimStatus < 2 && !myC
    })
  } else if (filterStatus.value === 'waiting') {
    list = list.filter(c => {
      const myC = c.myRole === 'owner' ? c.ownerConfirmed : c.claimerConfirmed
      const otherC = c.myRole === 'owner' ? c.claimerConfirmed : c.ownerConfirmed
      return c.claimStatus < 2 && myC && !otherC
    })
  } else if (filterStatus.value === 'done') {
    list = list.filter(c => c.claimStatus === 2)
  }
  return list
})

function progressStep(c) {
  if (c.claimStatus === 2) return 2
  const myConfirmed = c.myRole === 'owner' ? c.ownerConfirmed : c.claimerConfirmed
  const otherConfirmed = c.myRole === 'owner' ? c.claimerConfirmed : c.ownerConfirmed
  if (myConfirmed && otherConfirmed) return 2
  if (myConfirmed || otherConfirmed) return 1
  return 0
}

function actionLabel(c) {
  if (c.claimStatus === 2) return '已完成'
  if (c.claimStatus === 3) return '已取消'
  const myC = c.myRole === 'owner' ? c.ownerConfirmed : c.claimerConfirmed
  const otherC = c.myRole === 'owner' ? c.claimerConfirmed : c.ownerConfirmed
  if (!myC && !otherC) return '待我确认'
  if (!myC && otherC) return '对方已确认，待我确认'
  if (myC && !otherC) return '我已确认，等待对方'
  return ''
}

function canConfirm(c) {
  if (c.claimStatus >= 2) return false
  const myC = c.myRole === 'owner' ? c.ownerConfirmed : c.claimerConfirmed
  return !myC
}

async function handleConfirm(c) {
  confirming.value = c.claimId
  try {
    await confirmClaim(c.claimId)
    ElMessage.success('确认成功！对方已收到通知')
    claims.value = (await getMyClaims()).data
  } catch { }
  finally { confirming.value = null }
}

async function handleCancel(c) {
  canceling.value = c.claimId
  try {
    await cancelClaim(c.claimId)
    ElMessage.success('已取消认领')
    claims.value = (await getMyClaims()).data
  } catch { }
  finally { canceling.value = null }
}

function goPost(id) { router.push(`/post/${id}`) }
</script>

<template>
  <div class="page claims-page">
    <div class="page-header">
      <div>
        <h1>认领进度</h1>
        <p class="subtitle">跟踪你的认领申请状态</p>
      </div>
    </div>

    <!-- search & filter -->
    <div class="search-bar">
      <el-input v-model="searchText" placeholder="搜索帖子标题、类型或对方昵称..." clearable prefix-icon="Search" />
      <div class="filter-chips">
        <button class="tab-pill" :class="{ active: filterStatus === 'all' }" @click="filterStatus = 'all'">全部</button>
        <button class="tab-pill" :class="{ active: filterStatus === 'pending' }" @click="filterStatus = 'pending'">待我确认</button>
        <button class="tab-pill" :class="{ active: filterStatus === 'waiting' }" @click="filterStatus = 'waiting'">等待对方</button>
        <button class="tab-pill" :class="{ active: filterStatus === 'done' }" @click="filterStatus = 'done'">已完成</button>
      </div>
    </div>

    <!-- claims list -->
    <div class="claims-list" v-loading="loading">
      <div v-if="!loading && filteredClaims.length === 0" class="empty-state">
        <p class="empty-text">还没有认领记录</p>
        <p class="empty-hint">去广场看看有没有你丢的东西</p>
        <button class="btn-primary" @click="router.push('/')">去失物广场</button>
      </div>

      <div v-for="c in filteredClaims" :key="c.claimId" class="card-wrap">
        <div class="bind-rings"><span></span><span></span><span></span></div>
        <div class="note-card claim-card" :class="'status-' + c.claimStatus">
          <div class="claim-header" @click="goPost(c.postId)">
            <span class="tag-type" :class="c.postType === 0 ? 'lost' : 'found'">{{ typeLabel(c.postType) }}</span>
            <span class="claim-title">{{ c.postTitle }}</span>
            <span class="tag-status" :class="'s-' + c.claimStatus">{{ statusCn(c.claimStatus) }}</span>
          </div>

          <div class="party-row">
            <div class="party-card" :class="c.myRole === 'owner' ? 'pc-owner' : 'pc-claimer'">
              <span class="party-label">{{ c.myRole === 'owner' ? '我(发布者)' : '我(认领人)' }}</span>
              <span class="party-confirm" v-if="(c.myRole === 'owner' ? c.ownerConfirmed : c.claimerConfirmed)">已确认</span>
              <span class="party-confirm pending" v-else>待确认</span>
            </div>
            <span class="party-arrow">&harr;</span>
            <div class="party-card" :class="c.myRole === 'owner' ? 'pc-claimer' : 'pc-owner'">
              <span class="party-label">{{ c.otherPartyName }}</span>
              <span class="party-hint">{{ c.myRole === 'owner' ? '认领人' : '发布者' }}</span>
              <span class="party-confirm" v-if="(c.myRole === 'owner' ? c.claimerConfirmed : c.ownerConfirmed)">已确认</span>
              <span class="party-confirm pending" v-else>待确认</span>
            </div>
          </div>

          <div class="progress-bar">
            <div class="progress-track">
              <div class="progress-fill" :style="{ width: progressStep(c) === 2 ? '100%' : progressStep(c) === 1 ? '50%' : '0%' }"></div>
            </div>
            <div class="progress-labels">
              <span :class="progressStep(c) >= 1 ? 'pl-done' : 'pl-active'">发起认领</span>
              <span :class="progressStep(c) >= 2 ? 'pl-done' : (progressStep(c) === 1 ? 'pl-active' : '')">双方确认</span>
              <span :class="progressStep(c) === 2 ? 'pl-done' : ''">完结</span>
            </div>
          </div>

          <div class="claim-meta">
            <span class="claim-time">{{ c.updateTime?.substring(0, 16).replace('T', ' ') }}</span>
            <span class="action-hint" v-if="c.claimStatus < 2">{{ actionLabel(c) }}</span>
            <span class="action-hint done" v-else>认领已完成</span>
          </div>

          <div class="claim-actions" v-if="c.claimStatus < 2">
            <button v-if="canConfirm(c)" class="btn-primary" :disabled="confirming === c.claimId" @click="handleConfirm(c)">
              {{ confirming === c.claimId ? '确认中...' : '确认认领' }}
            </button>
            <button class="btn-danger" :disabled="canceling === c.claimId" @click="handleCancel(c)">
              {{ canceling === c.claimId ? '取消中...' : '取消认领' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.claims-page { max-width: 800px; }

/* search bar */
.search-bar { margin-bottom: 24px; display: flex; flex-direction: column; gap: 12px; }
.search-bar .el-input { max-width: 520px; }
.filter-chips { display: flex; gap: 8px; flex-wrap: wrap; }

/* claims list */
.claims-list { display: flex; flex-direction: column; gap: 20px; }

/* claim card */
.claim-card.status-3 { opacity: 0.6; }
.claim-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; cursor: pointer; }
.claim-title { flex: 1; font-size: 16px; font-weight: 600; color: var(--ink-900); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* party row */
.party-row { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.party-card {
  flex: 1; padding: 12px 16px; border-radius: var(--r-btn);
  display: flex; flex-direction: column; gap: 4px;
}
.pc-owner { background: var(--indigo-light); border: 1px solid rgba(79,70,229,0.15); }
.pc-claimer { background: var(--amber-light); border: 1px solid rgba(217,119,6,0.15); }
.party-label { font-size: 14px; font-weight: 700; color: var(--ink-900); }
.party-hint { font-size: 11px; color: var(--ink-500); }
.party-confirm { font-size: 12px; font-weight: 600; color: var(--moss); }
.party-confirm.pending { color: var(--ink-300); }
.party-arrow { font-size: 18px; color: var(--ink-300); flex-shrink: 0; }

/* progress */
.progress-bar { margin-bottom: 12px; }
.progress-track { height: 3px; background: var(--page-edge); border-radius: 2px; margin-bottom: 8px; }
.progress-fill { height: 100%; background: var(--indigo); border-radius: 2px; transition: width 0.5s; }
.progress-labels { display: flex; justify-content: space-between; font-size: 11px; color: var(--ink-300); }
.pl-active { color: var(--indigo); font-weight: 600; }
.pl-done { color: var(--amber); font-weight: 600; }

/* meta & actions */
.claim-meta { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #f3f4f6; margin-bottom: 12px; }
.claim-time { font-family: var(--mono-font); font-size: 12px; color: var(--ink-300); }
.action-hint { font-size: 13px; color: var(--ink-500); }
.action-hint.done { color: var(--amber); font-weight: 600; }
.claim-actions { display: flex; gap: 10px; }
</style>
