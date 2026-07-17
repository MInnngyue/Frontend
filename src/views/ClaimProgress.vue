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

// Search & filter
const searchText = ref('')
const filterStatus = ref('all') // all | pending | waiting | done

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

// Sorting: 待我确认 > 我已确认等待对方 > 已完成
function sortPriority(c) {
  if (c.claimStatus === 2 || c.claimStatus === 3) return 3
  const myConfirmed = c.myRole === 'owner' ? c.ownerConfirmed : c.claimerConfirmed
  const otherConfirmed = c.myRole === 'owner' ? c.claimerConfirmed : c.ownerConfirmed
  if (!myConfirmed) return 0  // 待我确认 → 最高优先
  if (!otherConfirmed) return 1 // 我已确认，等对方
  return 2
}

const filteredClaims = computed(() => {
  let list = [...claims.value]

  // Sort: priority
  list.sort((a, b) => sortPriority(a) - sortPriority(b))

  // Search text
  if (searchText.value.trim()) {
    const q = searchText.value.trim().toLowerCase()
    list = list.filter(c =>
      c.postTitle?.toLowerCase().includes(q) ||
      typeLabel(c.postType).includes(q) ||
      c.otherPartyName?.toLowerCase().includes(q)
    )
  }

  // Status filter
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

function roleBadge(c) {
  if (c.myRole === 'owner') return { text: '我是发布者', cls: 'role-owner' }
  return { text: '我是认领人', cls: 'role-claimer' }
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
  <div class="claims-page">
    <h1 class="page-title">认领进度</h1>

    <div class="search-bar">
      <div class="search-input-wrap">
        <span class="search-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-300)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
        <input v-model="searchText" placeholder="搜索帖子标题、类型或对方昵称..." class="search-input" />
      </div>
      <div class="filter-chips">
        <button :class="['chip', { active: filterStatus === 'all' }]" @click="filterStatus = 'all'">全部</button>
        <button :class="['chip', { active: filterStatus === 'pending' }]" @click="filterStatus = 'pending'">待我确认</button>
        <button :class="['chip', { active: filterStatus === 'waiting' }]" @click="filterStatus = 'waiting'">等待对方</button>
        <button :class="['chip', { active: filterStatus === 'done' }]" @click="filterStatus = 'done'">已完成</button>
      </div>
    </div>

    <div class="claims-list" v-loading="loading">
      <div v-if="!loading && filteredClaims.length === 0" class="empty-state">
        <div class="empty-icon" style="font-size:48px;color:var(--ink-300);">—</div>
        <div class="empty-title">还没有认领记录</div>
        <div class="empty-desc">去广场看看有没有你丢的东西，找到了就点"这是我的物品"</div>
        <button class="empty-btn" @click="router.push('/')">去失物广场</button>
      </div>

      <div v-for="c in filteredClaims" :key="c.claimId" class="claim-card" :class="'status-' + c.claimStatus">
        <div class="claim-header" @click="goPost(c.postId)">
          <span class="claim-type" :class="c.postType === 0 ? 't-lost' : 't-found'">{{ typeLabel(c.postType) }}</span>
          <span class="claim-title">{{ c.postTitle }}</span>
          <span class="claim-badge" :class="'cs-' + c.claimStatus">{{ statusCn(c.claimStatus) }}</span>
        </div>

        <div class="party-row">
          <div class="party-card" :class="c.myRole === 'owner' ? 'pc-owner' : 'pc-claimer'">
            <span class="party-label">{{ c.myRole === 'owner' ? '我(发布者)' : '我(认领人)' }}</span>
            <span class="party-confirm" v-if="(c.myRole === 'owner' ? c.ownerConfirmed : c.claimerConfirmed)">✓ 已确认</span>
            <span class="party-confirm no" v-else>待确认</span>
          </div>
          <span class="party-arrow">⇄</span>
          <div class="party-card" :class="c.myRole === 'owner' ? 'pc-claimer' : 'pc-owner'">
            <span class="party-label">{{ c.otherPartyName }}</span>
            <span class="party-role-hint">{{ c.myRole === 'owner' ? '认领人' : '发布者' }}</span>
            <span class="party-confirm" v-if="(c.myRole === 'owner' ? c.claimerConfirmed : c.ownerConfirmed)">✓ 已确认</span>
            <span class="party-confirm no" v-else>待确认</span>
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

        <div class="claim-time">更新于 {{ c.updateTime?.substring(0, 16).replace('T', ' ') }}</div>

        <div class="claim-action" v-if="c.claimStatus < 2">
          <span class="action-hint">{{ actionLabel(c) }}</span>
          <div class="action-btns">
            <button v-if="canConfirm(c)" class="btn-confirm" :disabled="confirming === c.claimId" @click="handleConfirm(c)">
              {{ confirming === c.claimId ? '确认中...' : '确认认领' }}
            </button>
            <button class="btn-cancel" :disabled="canceling === c.claimId" @click="handleCancel(c)">
              {{ canceling === c.claimId ? '取消中...' : '取消认领' }}
            </button>
          </div>
        </div>
        <div class="claim-action" v-else>
          <span class="action-hint done">认领已完成</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.claims-page { max-width: 800px; margin: 0 auto; padding: 22px 24px 36px; min-height: 100vh; }
.page-title { font-size: 32px; font-weight: 700; color: var(--ink-900); margin: 0 0 22px; text-align: center; }

/* Search */
.search-bar { margin-bottom: 20px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.search-input-wrap { position: relative; width: 100%; max-width: 520px; }
.search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 15px; }
.search-input {
  width: 100%; padding: 10px 14px 10px 38px; border: 1px solid var(--page-edge); border-radius: 10px;
  font-size: 14px; color: var(--ink-900); outline: none; transition: border 0.15s; background: #fff;
}
.search-input:focus { border-color: var(--indigo); box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
.search-input::placeholder { color: var(--ink-300); }
.filter-chips { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; }
.chip {
  padding: 5px 14px; border-radius: 16px; border: 1px solid var(--page-edge); background: #fff;
  font-size: 12px; font-weight: 500; color: var(--ink-500); cursor: pointer; transition: all 0.15s;
}
.chip:hover { border-color: #cbd5e1; }
.chip.active { background: var(--indigo); border-color: var(--indigo); color: #fff; }

/* Empty */
.empty-state { text-align: center; padding: 60px 0; }
.empty-icon { font-size: 48px; margin-bottom: 16px; }
.empty-title { font-size: 18px; font-weight: 600; color: var(--ink-900); margin-bottom: 8px; }
.empty-desc { font-size: 14px; color: var(--ink-500); margin-bottom: 24px; }
.empty-btn { padding: 10px 24px; background: var(--indigo); color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.empty-btn:hover { background: var(--indigo-hover); }

/* Cards */
.claims-list { display: flex; flex-direction: column; gap: 16px; }
.claim-card { background: #fff; border: 1px solid var(--page-edge); border-radius: 14px; padding: 20px 24px; }
.claim-card.status-2 { border-color: var(--page-edge); }
.claim-card.status-3 { opacity: 0.5; }

/* Header */
.claim-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; cursor: pointer; }
.claim-type { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; color: #fff; }
.t-lost { background: #ef4444; }
.t-found { background: var(--indigo); }
.claim-title { flex: 1; font-size: 16px; font-weight: 600; color: var(--ink-900); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.claim-badge { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; white-space: nowrap; }
.cs-0 { background: var(--amber-light); color: #8a6535; }
.cs-1 { background: var(--indigo-light); color: var(--indigo); }
.cs-2 { background: var(--moss-light); color: var(--moss); }
.cs-3 { background: #f3f4f6; color: #6b7280; }

/* Party row */
.party-row { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
.party-card {
  flex: 1; padding: 10px 14px; border-radius: 10px; display: flex; flex-direction: column; gap: 3px;
}
.pc-owner { background: var(--indigo-light); border: 1px solid #fecaca; }
.pc-claimer { background: var(--amber-light); border: 1px solid #fecaca; }
.party-label { font-size: 14px; font-weight: 700; color: var(--ink-900); }
.party-role-hint { font-size: 11px; color: var(--ink-500); }
.party-confirm { font-size: 12px; font-weight: 600; color: #22c55e; }
.party-confirm.no { color: var(--ink-300); }
.party-arrow { font-size: 18px; color: var(--ink-300); flex-shrink: 0; }

/* Progress */
.progress-bar { margin-bottom: 10px; }
.progress-track { height: 3px; background: var(--page-edge); border-radius: 2px; margin-bottom: 6px; }
.progress-fill { height: 100%; background: var(--indigo); border-radius: 2px; transition: width 0.5s; }
.progress-labels { display: flex; justify-content: space-between; font-size: 11px; color: #cbd5e1; }
.pl-active { color: var(--indigo); font-weight: 600; }
.pl-done { color: var(--amber); font-weight: 600; }

/* Time */
.claim-time { font-size: 12px; color: var(--ink-300); margin-bottom: 12px; }

/* Action */
.claim-action { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding-top: 12px; border-top: 1px solid #f3f4f6; flex-wrap: wrap; }
.action-hint { font-size: 13px; color: var(--ink-500); }
.action-hint.done { color: var(--amber); font-weight: 600; }
.action-btns { display: flex; gap: 8px; }
.btn-confirm { padding: 8px 20px; background: var(--amber); color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-confirm:hover { background: #b07a4f; }
.btn-confirm:disabled { background: #cbd5e1; cursor: not-allowed; }
.btn-cancel { padding: 8px 20px; background: var(--indigo-light); color: var(--rose); border: 1px solid var(--rose-light); border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.btn-cancel:hover { background: var(--rose-light); }
.btn-cancel:disabled { background: #f3f4f6; color: var(--ink-300); cursor: not-allowed; }
</style>
