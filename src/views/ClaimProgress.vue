<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  ArrowRight,
  Check,
  CircleCheck,
  Clock3,
  ExternalLink,
  Handshake,
  Inbox,
  Search,
  UserRound,
  X,
} from 'lucide-vue-next'
import { ElMessage } from 'element-plus'
import { cancelClaim, confirmClaim, getMyClaims } from '@/api/claim'
import { useAuroraGlow } from '@/composables/useAuroraGlow'

const router = useRouter()
const { glowX, glowY, glowActive, glowBlocked, onMouseMove, onMouseLeave } = useAuroraGlow()

const claims = ref([])
const loading = ref(true)
const loadFailed = ref(false)
const confirming = ref(null)
const canceling = ref(null)
const searchText = ref('')
const filterStatus = ref('all')

let revealObserver = null

const activeCount = computed(() => claims.value.filter((claim) => claim.claimStatus < 2).length)

const filteredClaims = computed(() => {
  let list = [...claims.value].sort((a, b) => sortPriority(a) - sortPriority(b))

  if (searchText.value.trim()) {
    const query = searchText.value.trim().toLowerCase()
    list = list.filter(
      (claim) =>
        claim.postTitle?.toLowerCase().includes(query) ||
        typeLabel(claim.postType).includes(query) ||
        claim.otherPartyName?.toLowerCase().includes(query),
    )
  }

  if (filterStatus.value === 'pending') {
    list = list.filter((claim) => claim.claimStatus < 2 && !isMyConfirmed(claim))
  } else if (filterStatus.value === 'waiting') {
    list = list.filter(
      (claim) => claim.claimStatus < 2 && isMyConfirmed(claim) && !isOtherConfirmed(claim),
    )
  } else if (filterStatus.value === 'done') {
    list = list.filter((claim) => claim.claimStatus === 2)
  }

  return list
})

function initRevealObserver() {
  if (!('IntersectionObserver' in window)) return
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        revealObserver?.unobserve(entry.target)
      })
    },
    { threshold: 0.08 },
  )
}

function observeRevealElements() {
  const elements = document.querySelectorAll('.claims-page [data-reveal]:not(.is-visible)')
  if (!revealObserver) {
    elements.forEach((element) => element.classList.add('is-visible'))
    return
  }
  elements.forEach((element) => revealObserver.observe(element))
}

async function loadClaims() {
  loading.value = true
  loadFailed.value = false
  try {
    claims.value = (await getMyClaims()).data || []
  } catch {
    claims.value = []
    loadFailed.value = true
  } finally {
    loading.value = false
    await nextTick()
    observeRevealElements()
  }
}

onMounted(async () => {
  initRevealObserver()
  await nextTick()
  observeRevealElements()
  await loadClaims()
})

onBeforeUnmount(() => {
  revealObserver?.disconnect()
})

function typeLabel(type) {
  return type === 0 ? '寻物' : '招领'
}

function statusCn(status) {
  const map = { 0: '待确认', 1: '确认中', 2: '已完结', 3: '已取消' }
  return map[status] || '未知'
}

function isMyConfirmed(claim) {
  return claim.myRole === 'owner' ? claim.ownerConfirmed : claim.claimerConfirmed
}

function isOtherConfirmed(claim) {
  return claim.myRole === 'owner' ? claim.claimerConfirmed : claim.ownerConfirmed
}

function sortPriority(claim) {
  if (claim.claimStatus === 2 || claim.claimStatus === 3) return 3
  if (!isMyConfirmed(claim)) return 0
  if (!isOtherConfirmed(claim)) return 1
  return 2
}

function progressStep(claim) {
  if (claim.claimStatus === 2) return 2
  if (isMyConfirmed(claim) || isOtherConfirmed(claim)) return 1
  return 0
}

function actionLabel(claim) {
  if (claim.claimStatus === 2) return '认领已完成'
  if (claim.claimStatus === 3) return '认领已取消'
  if (!isMyConfirmed(claim) && !isOtherConfirmed(claim)) return '等待你确认本次认领'
  if (!isMyConfirmed(claim) && isOtherConfirmed(claim)) return '对方已确认，等待你确认'
  return '你已确认，等待对方确认'
}

function canConfirm(claim) {
  return claim.claimStatus < 2 && !isMyConfirmed(claim)
}

function formatTime(value) {
  return value?.substring(0, 16).replace('T', ' ') || '-'
}

async function handleConfirm(claim) {
  confirming.value = claim.claimId
  try {
    await confirmClaim(claim.claimId)
    ElMessage.success('确认成功，对方已收到通知')
    await loadClaims()
  } catch {
  } finally {
    confirming.value = null
  }
}

async function handleCancel(claim) {
  canceling.value = claim.claimId
  try {
    await cancelClaim(claim.claimId)
    ElMessage.success('已取消认领')
    await loadClaims()
  } catch {
  } finally {
    canceling.value = null
  }
}

function goPost(id) {
  router.push(`/post/${id}`)
}
</script>

<template>
  <div class="page claims-page" @mousemove="onMouseMove" @mouseleave="onMouseLeave">
    <div
      class="aurora-glow"
      :class="{ active: glowActive, blocked: glowBlocked }"
      :style="{ transform: `translate3d(${glowX - 150}px, ${glowY - 100}px, 0)` }"
      aria-hidden="true"
    />
    <div
      class="aurora-glow aurora-glow--teal"
      :class="{ active: glowActive, blocked: glowBlocked }"
      :style="{ transform: `translate3d(${glowX - 130}px, ${glowY - 160}px, 0)` }"
      aria-hidden="true"
    />

    <header class="page-header" data-reveal>
      <div>
        <h1 class="page-title">认领进度</h1>
        <p class="page-subtitle">查看双方确认状态与认领结果</p>
      </div>
      <div class="stat-block">
        <span class="stat-num">{{ activeCount }}</span>
        <span class="stat-label">项进行中</span>
      </div>
    </header>

    <div class="claims-content">
      <section class="claims-toolbar" data-reveal style="--reveal-delay: 60ms">
        <div class="search-shell" data-aurora-block>
          <Search :size="18" aria-hidden="true" />
          <input
            v-model="searchText"
            type="search"
            placeholder="搜索帖子、类型或对方昵称"
            aria-label="搜索认领记录"
          />
          <button
            v-if="searchText"
            class="clear-search"
            type="button"
            title="清空搜索"
            aria-label="清空搜索"
            @click="searchText = ''"
          >
            <X :size="16" aria-hidden="true" />
          </button>
        </div>

        <div class="filter-chips" aria-label="认领状态筛选">
          <button
            type="button"
            class="filter-chip"
            :class="{ active: filterStatus === 'all' }"
            :aria-pressed="filterStatus === 'all'"
            @click="filterStatus = 'all'"
          >
            全部
          </button>
          <button
            type="button"
            class="filter-chip"
            :class="{ active: filterStatus === 'pending' }"
            :aria-pressed="filterStatus === 'pending'"
            @click="filterStatus = 'pending'"
          >
            待我确认
          </button>
          <button
            type="button"
            class="filter-chip"
            :class="{ active: filterStatus === 'waiting' }"
            :aria-pressed="filterStatus === 'waiting'"
            @click="filterStatus = 'waiting'"
          >
            等待对方
          </button>
          <button
            type="button"
            class="filter-chip"
            :class="{ active: filterStatus === 'done' }"
            :aria-pressed="filterStatus === 'done'"
            @click="filterStatus = 'done'"
          >
            已完成
          </button>
        </div>
      </section>

      <div class="claims-list" v-loading="loading" data-reveal style="--reveal-delay: 120ms">
        <section v-if="!loading && loadFailed" class="empty-state" data-aurora-block>
          <Inbox :size="38" aria-hidden="true" />
          <h2>认领记录加载失败</h2>
          <p>请检查服务状态后重试</p>
          <button type="button" class="primary-btn compact" @click="loadClaims">
            重新加载
            <ArrowRight :size="16" aria-hidden="true" />
          </button>
        </section>

        <section
          v-else-if="!loading && filteredClaims.length === 0"
          class="empty-state"
          data-aurora-block
        >
          <Inbox :size="38" aria-hidden="true" />
          <h2>{{ claims.length ? '没有符合条件的记录' : '还没有认领记录' }}</h2>
          <p>{{ claims.length ? '调整搜索或筛选条件后再试' : '去广场看看有没有你丢失的物品' }}</p>
          <button
            v-if="!claims.length"
            type="button"
            class="primary-btn compact"
            @click="router.push('/')"
          >
            去失物广场
            <ArrowRight :size="16" aria-hidden="true" />
          </button>
        </section>

        <template v-else>
          <article
            v-for="claim in filteredClaims"
            :key="claim.claimId"
            class="claim-card"
            :class="`status-${claim.claimStatus}`"
            data-aurora-block
          >
            <header class="claim-header">
              <div class="claim-heading">
                <div class="claim-tags">
                  <span class="type-tag" :class="claim.postType === 0 ? 'lost' : 'found'">
                    {{ typeLabel(claim.postType) }}
                  </span>
                  <span class="status-tag" :class="`state-${claim.claimStatus}`">
                    {{ statusCn(claim.claimStatus) }}
                  </span>
                </div>
                <button type="button" class="post-link" @click="goPost(claim.postId)">
                  <span>{{ claim.postTitle || '无标题' }}</span>
                  <ExternalLink :size="16" aria-hidden="true" />
                </button>
              </div>
              <div class="claim-time">
                <Clock3 :size="15" aria-hidden="true" />
                <time>{{ formatTime(claim.updateTime) }}</time>
              </div>
            </header>

            <div class="party-flow">
              <div class="party-person">
                <span class="party-avatar" :class="{ confirmed: isMyConfirmed(claim) }">
                  <UserRound :size="20" aria-hidden="true" />
                </span>
                <span class="party-copy">
                  <strong>{{ claim.myRole === 'owner' ? '我（发布者）' : '我（认领人）' }}</strong>
                  <small>{{ isMyConfirmed(claim) ? '已完成确认' : '尚未确认' }}</small>
                </span>
                <span class="confirm-state" :class="{ confirmed: isMyConfirmed(claim) }">
                  <Check v-if="isMyConfirmed(claim)" :size="14" aria-hidden="true" />
                  {{ isMyConfirmed(claim) ? '已确认' : '待确认' }}
                </span>
              </div>

              <span class="exchange-mark" aria-hidden="true">
                <Handshake :size="20" />
              </span>

              <div class="party-person">
                <span class="party-avatar" :class="{ confirmed: isOtherConfirmed(claim) }">
                  <UserRound :size="20" aria-hidden="true" />
                </span>
                <span class="party-copy">
                  <strong>{{ claim.otherPartyName || '对方用户' }}</strong>
                  <small>{{ claim.myRole === 'owner' ? '认领人' : '发布者' }}</small>
                </span>
                <span class="confirm-state" :class="{ confirmed: isOtherConfirmed(claim) }">
                  <Check v-if="isOtherConfirmed(claim)" :size="14" aria-hidden="true" />
                  {{ isOtherConfirmed(claim) ? '已确认' : '待确认' }}
                </span>
              </div>
            </div>

            <div class="claim-progress" :class="`step-${progressStep(claim)}`">
              <div class="progress-line" aria-hidden="true">
                <span :style="{ width: `${progressStep(claim) * 50}%` }"></span>
              </div>
              <div class="progress-step complete">
                <span class="step-dot"><Check :size="13" aria-hidden="true" /></span>
                <span>发起认领</span>
              </div>
              <div class="progress-step" :class="{ complete: progressStep(claim) >= 1 }">
                <span class="step-dot"
                  ><Check v-if="progressStep(claim) >= 1" :size="13" aria-hidden="true"
                /></span>
                <span>双方确认</span>
              </div>
              <div class="progress-step" :class="{ complete: progressStep(claim) >= 2 }">
                <span class="step-dot"
                  ><Check v-if="progressStep(claim) >= 2" :size="13" aria-hidden="true"
                /></span>
                <span>认领完结</span>
              </div>
            </div>

            <footer class="claim-footer">
              <div class="action-status" :class="`state-${claim.claimStatus}`">
                <CircleCheck v-if="claim.claimStatus === 2" :size="17" aria-hidden="true" />
                <Clock3 v-else :size="17" aria-hidden="true" />
                <span>{{ actionLabel(claim) }}</span>
              </div>

              <div v-if="claim.claimStatus < 2" class="claim-actions">
                <button
                  v-if="canConfirm(claim)"
                  type="button"
                  class="primary-btn"
                  :disabled="confirming === claim.claimId"
                  @click="handleConfirm(claim)"
                >
                  <Check :size="16" aria-hidden="true" />
                  {{ confirming === claim.claimId ? '确认中' : '确认认领' }}
                </button>
                <button
                  type="button"
                  class="danger-btn"
                  :disabled="canceling === claim.claimId"
                  @click="handleCancel(claim)"
                >
                  <X :size="16" aria-hidden="true" />
                  {{ canceling === claim.claimId ? '取消中' : '取消认领' }}
                </button>
              </div>
            </footer>
          </article>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.claims-page {
  width: 100%;
  min-height: calc(100vh - 60px);
  padding: 31px 20px 48px;
  position: relative;
  isolation: isolate;
  color: #475569;
  font-family: 'HarmonyOS Sans', 'PingFang SC', sans-serif;
}

.aurora-glow {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 0;
  width: 300px;
  height: 300px;
  pointer-events: none;
  opacity: 0;
  background: radial-gradient(
    circle,
    rgba(139, 92, 246, 0.3) 0%,
    rgba(139, 92, 246, 0.1) 40%,
    transparent 70%
  );
  border-radius: 50%;
  filter: blur(40px);
  mix-blend-mode: normal;
  transition: opacity 0.5s ease;
  will-change: transform;
}

.aurora-glow--teal {
  width: 260px;
  height: 260px;
  background: radial-gradient(
    circle,
    rgba(6, 182, 212, 0.25) 0%,
    rgba(6, 182, 212, 0.08) 40%,
    transparent 70%
  );
  mix-blend-mode: screen;
}

.aurora-glow.active {
  opacity: 1;
}

.aurora-glow.blocked {
  opacity: 0;
  transition: none;
}

.page-header,
.claims-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 960px;
  margin-right: auto;
  margin-left: auto;
}

.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}

.page-title {
  margin: 0;
  color: #1e293b;
  font-family: 'Noto Serif SC', serif;
  font-size: 36px;
  font-weight: 700;
  line-height: 1.35;
  letter-spacing: 0;
}

.page-subtitle {
  margin: 4px 0 0;
  color: #64748b;
  font-size: 16px;
  line-height: 1.6;
}

.stat-block {
  display: flex;
  align-items: baseline;
  gap: 6px;
  white-space: nowrap;
}

.stat-num {
  color: #3b82f6;
  font-family: 'JetBrains Mono', monospace;
  font-size: 36px;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  color: #64748b;
  font-size: 16px;
}

.claims-content,
.claims-list {
  display: flex;
  flex-direction: column;
}

.claims-content {
  gap: 18px;
}

.claims-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.search-shell {
  display: flex;
  width: min(100%, 390px);
  height: 50px;
  padding: 5px 15px;
  align-items: center;
  gap: 9px;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.46);
  border: 1px solid rgba(15, 23, 42, 0.1);
  border-radius: 999px;
  box-shadow: 0 12px 28px rgba(34, 48, 132, 0.1);
  backdrop-filter: blur(12px) saturate(160%);
  -webkit-backdrop-filter: blur(12px) saturate(160%);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.search-shell:focus-within {
  color: #0f172a;
  border-color: #0f172a;
  box-shadow: 0 0 0 4px rgba(15, 23, 42, 0.1);
}

.search-shell input {
  min-width: 0;
  flex: 1;
  color: #334155;
  font: inherit;
  font-size: 14px;
  background: transparent;
  border: 0;
  outline: 0;
}

.search-shell input::placeholder {
  color: #94a3b8;
}

.search-shell input::-webkit-search-cancel-button {
  display: none;
}

.clear-search {
  display: grid;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  padding: 0;
  color: #64748b;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 50%;
  place-items: center;
}

.clear-search:hover {
  color: #1e293b;
  background: rgba(15, 23, 42, 0.06);
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 7px;
}

.filter-chip {
  min-height: 38px;
  padding: 7px 16px;
  color: #64748b;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.62);
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 999px;
  transition: all 0.2s ease;
}

.filter-chip:hover {
  color: #1e293b;
  border-color: rgba(15, 23, 42, 0.28);
}

.filter-chip.active {
  color: #fff;
  background: rgba(15, 23, 42, 0.92);
  border-color: rgba(15, 23, 42, 0.92);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.16);
}

.claims-list {
  min-height: 180px;
  gap: 16px;
}

.claim-card,
.empty-state {
  overflow: hidden;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  box-shadow:
    0 8px 32px rgba(31, 38, 135, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}

.claim-card {
  padding: 24px 28px;
}

.claim-card.status-3 {
  opacity: 0.72;
}

.claim-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding-bottom: 18px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.07);
}

.claim-heading {
  min-width: 0;
  flex: 1;
}

.claim-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-bottom: 10px;
}

.type-tag,
.status-tag {
  display: inline-flex;
  min-height: 26px;
  padding: 4px 11px;
  align-items: center;
  color: #475569;
  font-size: 13.2px;
  font-weight: 600;
  line-height: 1.3;
  border-radius: 999px;
}

.type-tag.lost {
  color: #ef4444;
  background: #fef2f2;
}

.type-tag.found {
  color: #10b981;
  background: #f0fdf4;
}

.status-tag.state-0 {
  color: #2563eb;
  background: #eff6ff;
}

.status-tag.state-1 {
  color: #f59e0b;
  background: #fffbeb;
}

.status-tag.state-2 {
  color: #10b981;
  background: #f0fdf4;
}

.status-tag.state-3 {
  color: #6b7280;
  background: #f3f4f6;
}

.post-link {
  display: inline-flex;
  max-width: 100%;
  padding: 0;
  align-items: center;
  gap: 7px;
  color: #1e293b;
  font: inherit;
  font-family: 'Noto Serif SC', serif;
  font-size: 19px;
  font-weight: 600;
  line-height: 1.45;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
}

.post-link span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.post-link svg {
  flex: none;
  color: #94a3b8;
}

.post-link:hover,
.post-link:focus-visible {
  color: #2563eb;
  outline: none;
}

.claim-time {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #94a3b8;
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  white-space: nowrap;
}

.party-flow {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 44px minmax(0, 1fr);
  gap: 12px;
  padding: 22px 0;
  align-items: center;
}

.party-person {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 11px;
}

.party-avatar,
.exchange-mark {
  display: grid;
  flex: none;
  place-items: center;
}

.party-avatar {
  width: 40px;
  height: 40px;
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 50%;
}

.party-avatar.confirmed {
  color: #059669;
  background: rgba(16, 185, 129, 0.1);
}

.party-copy {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: 3px;
}

.party-copy strong {
  overflow: hidden;
  color: #1e293b;
  font-size: 14px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.party-copy small {
  color: #94a3b8;
  font-size: 12px;
}

.confirm-state {
  display: inline-flex;
  min-height: 25px;
  padding: 3px 9px;
  align-items: center;
  gap: 4px;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  background: #f1f5f9;
  border-radius: 999px;
}

.confirm-state.confirmed {
  color: #047857;
  background: #ecfdf5;
}

.exchange-mark {
  width: 38px;
  height: 38px;
  color: #64748b;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 50%;
}

.claim-progress {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  padding: 2px 0 20px;
}

.progress-line {
  position: absolute;
  top: 13px;
  right: 16.666%;
  left: 16.666%;
  height: 3px;
  overflow: hidden;
  background: #e2e8f0;
  border-radius: 999px;
}

.progress-line span {
  display: block;
  height: 100%;
  background: #3b82f6;
  border-radius: inherit;
  transition: width 0.4s ease;
}

.progress-step {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 7px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.step-dot {
  display: grid;
  width: 24px;
  height: 24px;
  color: #94a3b8;
  background: #fff;
  border: 2px solid #cbd5e1;
  border-radius: 50%;
  place-items: center;
}

.progress-step.complete {
  color: #2563eb;
}

.progress-step.complete .step-dot {
  color: #fff;
  background: #3b82f6;
  border-color: #3b82f6;
}

.claim-card.status-2 .progress-line span,
.claim-card.status-2 .progress-step.complete .step-dot {
  background: #10b981;
  border-color: #10b981;
}

.claim-card.status-2 .progress-step.complete {
  color: #047857;
}

.claim-card.status-3 .progress-line span {
  background: #94a3b8;
}

.claim-footer {
  display: flex;
  min-height: 42px;
  padding-top: 16px;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border-top: 1px solid rgba(15, 23, 42, 0.07);
}

.action-status {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 7px;
  color: #64748b;
  font-size: 13px;
}

.action-status.state-1 {
  color: #b45309;
}

.action-status.state-2 {
  color: #047857;
  font-weight: 600;
}

.action-status.state-3 {
  color: #64748b;
}

.claim-actions {
  display: flex;
  flex: none;
  gap: 8px;
}

.primary-btn,
.danger-btn {
  display: inline-flex;
  min-height: 40px;
  padding: 0 17px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  font: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border-radius: 999px;
  transition: all 0.2s ease;
}

.primary-btn {
  color: #fff;
  background: rgba(15, 23, 42, 0.92);
  border: 1px solid rgba(15, 23, 42, 0.92);
}

.primary-btn:hover:not(:disabled),
.primary-btn:focus-visible:not(:disabled) {
  background: #000;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.22);
  transform: translateY(-1px);
  outline: none;
}

.danger-btn {
  color: #dc2626;
  background: #fff;
  border: 1px solid rgba(220, 38, 38, 0.24);
}

.danger-btn:hover:not(:disabled),
.danger-btn:focus-visible:not(:disabled) {
  background: #fef2f2;
  border-color: rgba(220, 38, 38, 0.44);
  outline: none;
}

.primary-btn:disabled,
.danger-btn:disabled {
  cursor: not-allowed;
  opacity: 0.48;
}

.primary-btn.compact {
  min-height: 42px;
  margin-top: 18px;
  padding: 0 20px;
}

.empty-state {
  display: flex;
  min-height: 260px;
  padding: 42px 24px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: #94a3b8;
  text-align: center;
}

.empty-state h2 {
  margin: 14px 0 4px;
  color: #334155;
  font-family: 'Noto Serif SC', serif;
  font-size: 18px;
  font-weight: 600;
}

.empty-state p {
  margin: 0;
  color: #94a3b8;
  font-size: 14px;
}

[data-reveal] {
  opacity: 0;
  transform: translate3d(0, 30px, 0) scale(0.985);
  transition:
    opacity 760ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 760ms cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: var(--reveal-delay, 0ms);
}

[data-reveal].is-visible {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
}

@media (max-width: 820px) {
  .claims-page {
    min-height: calc(100vh - 108px);
    padding: 24px 16px 36px;
  }

  .page-header {
    align-items: flex-start;
  }

  .page-title {
    font-size: 29px;
  }

  .stat-num {
    font-size: 27px;
  }

  .claims-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .search-shell {
    width: 100%;
  }

  .filter-chips {
    justify-content: flex-start;
  }

  .claim-card {
    padding: 20px;
  }

  .claim-header {
    flex-direction: column;
    gap: 12px;
  }

  .party-flow {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .exchange-mark {
    display: none;
  }
}

@media (max-width: 560px) {
  .page-header {
    gap: 12px;
  }

  .filter-chip {
    padding-right: 13px;
    padding-left: 13px;
  }

  .party-person {
    display: grid;
    grid-template-columns: 40px minmax(0, 1fr) auto;
  }

  .claim-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .claim-actions {
    width: 100%;
  }

  .primary-btn,
  .danger-btn {
    flex: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  [data-reveal],
  [data-reveal].is-visible {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
