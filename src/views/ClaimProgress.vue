<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyClaims, confirmClaim } from '@/api/claim'
import { ElMessage } from 'element-plus'

const router = useRouter()
const claims = ref([])
const loading = ref(true)
const confirming = ref(null)

onMounted(async () => {
  try { claims.value = (await getMyClaims()).data }
  catch { claims.value = [] }
  finally { loading.value = false }
})

function typeLabel(t) { return t === 0 ? '寻物' : '招领' }
function statusLabel(s) {
  const map = { 0: '待确认', 1: '一方已确认', 2: '已完结', 3: '已取消' }
  return map[s] || '未知'
}

const steps = [
  { key: 'init', label: '发起认领', desc: '一方发起认领申请' },
  { key: 'confirm', label: '双方确认', desc: '双方均确认物品归属' },
  { key: 'done', label: '认领完结', desc: '流程结束，双方加分' },
]

function progressStep(status, ownerConfirmed, claimerConfirmed, myRole) {
  // Determine which step we're at
  if (status === 2) return 2  // 已完结 → step 2 done
  if (status === 0) return 0  // 待确认 → step 0
  if (status === 1) {
    // 一方已确认 → step 1
    return 1
  }
  return 0
}

function stepClass(stepIdx, claim) {
  const current = progressStep(claim.claimStatus, claim.ownerConfirmed, claim.claimerConfirmed, claim.myRole)
  if (stepIdx < current) return 'step-done'
  if (stepIdx === current) return 'step-active'
  return 'step-pending'
}

function actionText(claim) {
  if (claim.claimStatus === 2) return '已完成'
  if (claim.claimStatus === 3) return '已取消'

  const myConfirmed = claim.myRole === 'owner' ? claim.ownerConfirmed : claim.claimerConfirmed
  const otherConfirmed = claim.myRole === 'owner' ? claim.claimerConfirmed : claim.ownerConfirmed

  if (!myConfirmed && !otherConfirmed) return '待我确认'
  if (!myConfirmed && otherConfirmed) return '对方已确认，待我确认'
  if (myConfirmed && !otherConfirmed) return '我已确认，等待对方'
  return '确认中'
}

function canConfirm(claim) {
  if (claim.claimStatus >= 2) return false
  const myConfirmed = claim.myRole === 'owner' ? claim.ownerConfirmed : claim.claimerConfirmed
  return !myConfirmed
}

async function handleConfirm(claim) {
  confirming.value = claim.claimId
  try {
    await confirmClaim(claim.claimId)
    ElMessage.success('确认成功！')
    claims.value = (await getMyClaims()).data
  } catch { }
  finally { confirming.value = null }
}

function goPost(id) { router.push(`/post/${id}`) }
</script>

<template>
  <div class="claims-page">
    <h1 class="page-title">认领进度</h1>

    <div class="claims-list" v-loading="loading">
      <!-- Empty state -->
      <div v-if="!loading && claims.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <div class="empty-title">暂无认领记录</div>
        <div class="empty-desc">在失物广场找到你的物品后，点击"这是我的物品"即可发起认领</div>
        <button class="empty-btn" @click="router.push('/')">去失物广场</button>
      </div>

      <!-- Claim cards -->
      <div v-for="c in claims" :key="c.claimId" class="claim-card" :class="'status-' + c.claimStatus">
        <!-- Header -->
        <div class="claim-header" @click="goPost(c.postId)">
          <span class="claim-type" :class="c.postType === 0 ? 't-lost' : 't-found'">{{ typeLabel(c.postType) }}</span>
          <span class="claim-title">{{ c.postTitle }}</span>
          <span class="claim-status-tag" :class="'st-' + c.claimStatus">{{ statusLabel(c.claimStatus) }}</span>
        </div>

        <!-- Progress timeline -->
        <div class="progress-bar">
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: progressStep(c.claimStatus, c.ownerConfirmed, c.claimerConfirmed, c.myRole) === 2 ? '100%' : progressStep(c.claimStatus, c.ownerConfirmed, c.claimerConfirmed, c.myRole) === 1 ? '50%' : '0%' }"></div>
          </div>
          <div class="progress-steps">
            <div v-for="(step, idx) in steps" :key="step.key" class="progress-step" :class="stepClass(idx, c)">
              <div class="step-dot">{{ idx < progressStep(c.claimStatus, c.ownerConfirmed, c.claimerConfirmed, c.myRole) ? '✓' : idx + 1 }}</div>
              <div class="step-label">{{ step.label }}</div>
              <div class="step-desc">{{ step.desc }}</div>
            </div>
          </div>
        </div>

        <!-- Info row -->
        <div class="claim-info">
          <span class="info-role" :class="c.myRole === 'owner' ? 'role-owner' : 'role-claimer'">
            {{ c.myRole === 'owner' ? '我是发布者' : '我是认领人' }}
          </span>
          <span class="info-party">对方：{{ c.otherPartyName }}</span>
          <span class="info-time">{{ c.updateTime?.substring(0, 16).replace('T', ' ') }}</span>
        </div>

        <!-- Action -->
        <div class="claim-action" v-if="c.claimStatus < 2">
          <span class="action-hint">{{ actionText(c) }}</span>
          <button
            v-if="canConfirm(c)"
            class="btn-confirm"
            :disabled="confirming === c.claimId"
            @click="handleConfirm(c)"
          >
            {{ confirming === c.claimId ? '确认中...' : '确认认领' }}
          </button>
        </div>
        <div class="claim-action" v-else>
          <span class="action-hint done">🎉 认领已完成</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.claims-page { max-width: 800px; margin: 0 auto; padding: 24px 20px 40px; min-height: 100vh; }
.page-title { font-size: 28px; font-weight: 700; color: #1e293b; margin: 0 0 24px; }

/* Empty */
.empty-state { text-align: center; padding: 60px 0; }
.empty-icon { font-size: 48px; margin-bottom: 16px; }
.empty-title { font-size: 18px; font-weight: 600; color: #1e293b; margin-bottom: 8px; }
.empty-desc { font-size: 14px; color: #64748b; margin-bottom: 24px; }
.empty-btn { padding: 10px 24px; background: #4f46e5; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; }
.empty-btn:hover { background: #4338ca; }

/* Cards */
.claims-list { display: flex; flex-direction: column; gap: 16px; }
.claim-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px 24px; transition: border-color 0.2s; }
.claim-card:hover { border-color: #cbd5e1; }
.claim-card.status-2 { border-color: #bbf7d0; }
.claim-card.status-3 { opacity: 0.6; }

/* Header */
.claim-header { display: flex; align-items: center; gap: 10px; margin-bottom: 18px; cursor: pointer; }
.claim-type { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; color: #fff; }
.t-lost { background: #ef4444; }
.t-found { background: #4f46e5; }
.claim-title { flex: 1; font-size: 16px; font-weight: 600; color: #1e293b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.claim-status-tag { padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; white-space: nowrap; }
.st-0 { background: #fef3c7; color: #b45309; }
.st-1 { background: #eef2ff; color: #4f46e5; }
.st-2 { background: #dcfce7; color: #15803d; }
.st-3 { background: #f3f4f6; color: #6b7280; }

/* Progress */
.progress-bar { margin-bottom: 16px; padding: 0 4px; }
.progress-track { height: 3px; background: #e2e8f0; border-radius: 2px; margin-bottom: 14px; position: relative; }
.progress-fill { height: 100%; background: #4f46e5; border-radius: 2px; transition: width 0.5s ease; }
.progress-steps { display: flex; justify-content: space-between; }
.progress-step { flex: 1; text-align: center; position: relative; }
.step-dot {
  width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; margin: 0 auto 6px;
  background: #f1f5f9; color: #94a3b8; border: 2px solid #e2e8f0;
}
.step-active .step-dot { background: #4f46e5; border-color: #4f46e5; color: #fff; }
.step-done .step-dot { background: #22c55e; border-color: #22c55e; color: #fff; }
.step-label { font-size: 13px; font-weight: 600; color: #94a3b8; }
.step-active .step-label { color: #4f46e5; }
.step-done .step-label { color: #22c55e; }
.step-desc { font-size: 11px; color: #cbd5e1; margin-top: 2px; display: none; }

/* Info */
.claim-info { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; font-size: 13px; }
.info-role { padding: 2px 8px; border-radius: 6px; font-weight: 600; }
.role-owner { background: #eef2ff; color: #4f46e5; }
.role-claimer { background: #fef3c7; color: #b45309; }
.info-party { color: #64748b; }
.info-time { color: #94a3b8; margin-left: auto; }

/* Action */
.claim-action { display: flex; align-items: center; justify-content: flex-end; gap: 12px; padding-top: 12px; border-top: 1px solid #f1f5f9; }
.action-hint { font-size: 13px; color: #64748b; }
.action-hint.done { color: #22c55e; font-weight: 600; }
.btn-confirm {
  padding: 8px 20px; background: #4f46e5; color: #fff; border: none; border-radius: 8px;
  font-size: 14px; font-weight: 600; cursor: pointer; transition: background 0.15s;
}
.btn-confirm:hover { background: #4338ca; }
.btn-confirm:disabled { background: #cbd5e1; cursor: not-allowed; }
</style>
