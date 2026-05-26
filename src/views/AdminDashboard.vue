<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { getPendingPosts, approvePost, rejectPost, getUsers, freezeUser, adjustCredit, blacklistUser, getDict, addDict, updateDict, deleteDict, getStats, getAllPosts, archivePost } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()

const navItems = [
  { key: 'posts', label: '帖子管理', icon: '📋' },
  { key: 'users', label: '用户管理', icon: '👥' },
  { key: 'dict', label: '数据字典', icon: '📚' },
  { key: 'stats', label: '数据统计', icon: '📊' },
]

const activeNav = ref('posts')
const posts = ref([])
const allPosts = ref([])
const users = ref([])
const dictType = ref('item_category')
const dictItems = ref([])
const stats = ref({})
const loading = ref(false)
const postFilter = ref('pending')

const categoryChartRef = ref(null)
const statusChartRef = ref(null)
let categoryChart = null
let statusChart = null

onMounted(() => { loadAllPosts(); loadStats() })

// === Posts ===
async function loadAllPosts() {
  loading.value = true
  const res = await getAllPosts({ page: 1, size: 100 })
  allPosts.value = res.data.records
  posts.value = allPosts.value.filter(p => p.reviewStatus === 0)
  loading.value = false
}
async function handleApprove(id) { await approvePost(id); ElMessage.success('审核通过'); loadAllPosts() }
async function handleReject(id) {
  const { value } = await ElMessageBox.prompt('拒绝原因', '审核拒绝', { inputValue: '违规内容' }).catch(() => {})
  if (!value) return; await rejectPost(id, value); ElMessage.success('已拒绝'); loadAllPosts()
}
async function handleArchivePost(id) { await archivePost(id); ElMessage.success('已归档'); loadAllPosts() }
function statusLabel(s) { const m = { 0: '进行中', 1: '已匹配', 2: '认领中', 3: '已完结', 4: '已归档', 5: '已下架' }; return m[s] || '未知' }

// === Users ===
async function loadUsers() { loading.value = true; const res = await getUsers({ page: 1, size: 50 }); users.value = res.data.records; loading.value = false }
async function handleFreeze(id) {
  const { value } = await ElMessageBox.prompt('冻结天数（0=永久/切换）', '冻结用户', { inputValue: '0' }).catch(() => {})
  if (value === undefined) return; await freezeUser(id, parseInt(value)); ElMessage.success('已操作'); loadUsers()
}
async function handleBlacklist(id) {
  const { value } = await ElMessageBox.prompt('拉黑天数（0=永久/切换）', '拉黑用户', { inputValue: '0' }).catch(() => {})
  if (value === undefined) return; await blacklistUser(id, parseInt(value)); ElMessage.success('已操作'); loadUsers()
}
async function handleCredit(id) {
  const { value } = await ElMessageBox.prompt('增减分数', '调整信用分', { inputValue: '5' }).catch(() => {})
  if (!value) return; await adjustCredit(id, parseInt(value)); ElMessage.success('已调整'); loadUsers()
}

// === Dict ===
async function loadDict() { const res = await getDict(dictType.value); dictItems.value = res.data }
async function handleAddDict() {
  const { value } = await ElMessageBox.prompt('名称', '新增').catch(() => {})
  if (!value) return; await addDict({ type: dictType.value, name: value, parentId: 0, sortOrder: 0, status: 1 }); ElMessage.success('已添加'); loadDict()
}
async function handleUpdateDict(item) {
  const { value } = await ElMessageBox.prompt('新名称', '修改', { inputValue: item.name }).catch(() => {})
  if (!value) return; await updateDict(item.id, { name: value }); ElMessage.success('已更新'); loadDict()
}
async function handleDeleteDict(id) { await ElMessageBox.confirm('确定删除？', '确认', { type: 'warning' }); await deleteDict(id); ElMessage.success('已删除'); loadDict() }

// === Stats ===
async function loadStats() { stats.value = (await getStats()).data }
function initCharts() { nextTick(() => { initCategoryChart(); initStatusChart() }) }
function initCategoryChart() {
  if (!categoryChartRef.value) return
  if (categoryChart) categoryChart.dispose()
  categoryChart = echarts.init(categoryChartRef.value)
  const cats = stats.value.categoryDistribution || []
  categoryChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '2%', right: '8%', bottom: '2%', top: '6%', containLabel: true },
    xAxis: { type: 'value', axisLabel: { color: '#94a3b8', fontSize: 11 }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
    yAxis: { type: 'category', data: cats.map(c => c.name), axisLabel: { color: '#475569', fontSize: 12 }, axisLine: { show: false }, axisTick: { show: false } },
    series: [{
      name: '帖子数', type: 'bar', data: cats.map(c => c.count),
      itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#6366f1' }, { offset: 1, color: '#a5b4fc' }]), borderRadius: [0, 6, 6, 0] },
      barWidth: 16, label: { show: true, position: 'right', color: '#334155', fontSize: 11, fontWeight: 600 }
    }]
  })
}
function initStatusChart() {
  if (!statusChartRef.value) return
  if (statusChart) statusChart.dispose()
  statusChart = echarts.init(statusChartRef.value)
  const s = stats.value
  statusChart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: '#64748b', fontSize: 11 } },
    series: [{
      name: '帖子状态', type: 'pie', radius: ['55%', '78%'], center: ['50%', '45%'],
      avoidLabelOverlap: true, itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 3 },
      label: { show: true, formatter: '{b}\n{d}%', fontSize: 10, color: '#475569' },
      data: [
        { value: s.activePosts || 0, name: '进行中', itemStyle: { color: '#3b82f6' } },
        { value: s.matchedPosts || 0, name: '已匹配', itemStyle: { color: '#f59e0b' } },
        { value: s.completedPosts || 0, name: '已完结', itemStyle: { color: '#22c55e' } },
        { value: s.pendingReviews || 0, name: '待审核', itemStyle: { color: '#ef4444' } }
      ]
    }]
  })
}

function switchNav(key) {
  activeNav.value = key
  if (key === 'posts') loadAllPosts()
  else if (key === 'users') loadUsers()
  else if (key === 'dict') loadDict()
  else if (key === 'stats') { loadStats(); initCharts() }
}

function onPostFilterChange(val) { postFilter.value = val }
const filteredPosts = () => postFilter.value === 'pending' ? posts.value : allPosts.value

const getPostType = (type) => type === 0 ? '寻物' : '招领'
const getTypeClass = (type) => type === 0 ? 'type-lost' : 'type-found'
const getStatusClass = (s) => {
  const map = { 0: 's-active', 1: 's-matched', 2: 's-claiming', 3: 's-done', 4: 's-archive', 5: 's-off' }
  return map[s] || ''
}
</script>

<template>
  <div class="admin-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sb-brand">
        <span class="sb-logo">🔍</span>
        <span class="sb-name">管理后台</span>
      </div>
      <nav class="sb-nav">
        <button
          v-for="item in navItems" :key="item.key"
          class="sb-item"
          :class="{ active: activeNav === item.key }"
          @click="switchNav(item.key)"
        >
          <span class="sb-icon">{{ item.icon }}</span>
          <span class="sb-label">{{ item.label }}</span>
        </button>
      </nav>
      <div class="sb-footer">
        <button class="sb-back" @click="router.push('/profile')">← 返回</button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">

      <!-- ====== 帖子管理 ====== -->
      <section v-if="activeNav === 'posts'" class="panel">
        <header class="panel-header">
          <h2>帖子管理</h2>
          <div class="panel-actions">
            <div class="filter-pills">
              <button :class="['pill', { active: postFilter === 'pending' }]" @click="onPostFilterChange('pending')">待审核 <span class="badge">{{ posts.length }}</span></button>
              <button :class="['pill', { active: postFilter === 'all' }]" @click="onPostFilterChange('all')">全部</button>
            </div>
          </div>
        </header>

        <div class="table-wrap" v-loading="loading">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:64px">ID</th>
                <th style="width:80px">类型</th>
                <th>标题</th>
                <th v-if="postFilter === 'all'" style="width:96px">状态</th>
                <th style="width:140px">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in filteredPosts()" :key="row.id">
                <td class="td-id">{{ row.id }}</td>
                <td><span class="type-badge" :class="getTypeClass(row.type)">{{ getPostType(row.type) }}</span></td>
                <td class="td-title">{{ row.title }}</td>
                <td v-if="postFilter === 'all'"><span class="status-badge" :class="getStatusClass(row.status)">{{ statusLabel(row.status) }}</span></td>
                <td class="td-actions">
                  <template v-if="postFilter === 'pending'">
                    <button class="btn btn-approve" @click="handleApprove(row.id)">通过</button>
                    <button class="btn btn-reject" @click="handleReject(row.id)">拒绝</button>
                  </template>
                  <template v-else>
                    <button v-if="row.status !== 4 && row.status !== 5" class="btn btn-archive" @click="handleArchivePost(row.id)">归档</button>
                    <span v-else class="text-muted">—</span>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="filteredPosts().length === 0 && !loading" class="empty-state">暂无数据</div>
        </div>
      </section>

      <!-- ====== 用户管理 ====== -->
      <section v-if="activeNav === 'users'" class="panel">
        <header class="panel-header"><h2>用户管理</h2></header>
        <div class="table-wrap" v-loading="loading">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:64px">ID</th>
                <th>用户名</th>
                <th>昵称</th>
                <th style="width:84px">信用分</th>
                <th style="width:84px">状态</th>
                <th style="width:240px">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in users" :key="row.id">
                <td class="td-id">{{ row.id }}</td>
                <td>{{ row.username }}</td>
                <td>{{ row.nickname }}</td>
                <td><span class="credit-badge" :class="row.creditScore >= 80 ? 'credit-ok' : 'credit-low'">{{ row.creditScore }}</span></td>
                <td><span :class="['status-dot', row.status === 0 ? 'dot-ok' : 'dot-bad']">{{ row.status === 0 ? '正常' : '冻结' }}</span></td>
                <td class="td-actions">
                  <button class="btn btn-ghost" @click="handleCredit(row.id)">信用</button>
                  <button class="btn btn-ghost" @click="handleFreeze(row.id)">{{ row.status === 0 ? '冻结' : '解冻' }}</button>
                  <button class="btn btn-ghost" @click="handleBlacklist(row.id)">{{ row.blacklisted ? '取消拉黑' : '拉黑' }}</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ====== 数据字典 ====== -->
      <section v-if="activeNav === 'dict'" class="panel">
        <header class="panel-header">
          <h2>数据字典</h2>
          <div class="panel-actions">
            <el-select v-model="dictType" @change="loadDict" class="dict-select" size="small">
              <el-option label="物品大类" value="item_category" />
              <el-option label="颜色" value="color" />
              <el-option label="校区" value="location" />
            </el-select>
            <button class="btn btn-primary" @click="handleAddDict">+ 新增</button>
          </div>
        </header>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:64px">ID</th>
                <th>名称</th>
                <th style="width:80px">排序</th>
                <th style="width:140px">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in dictItems" :key="row.id">
                <td class="td-id">{{ row.id }}</td>
                <td>{{ row.name }}</td>
                <td>{{ row.sortOrder }}</td>
                <td class="td-actions">
                  <button class="btn btn-ghost" @click="handleUpdateDict(row)">编辑</button>
                  <button class="btn btn-ghost btn-ghost-danger" @click="handleDeleteDict(row.id)">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- ====== 数据统计 ====== -->
      <section v-if="activeNav === 'stats'" class="panel">
        <header class="panel-header"><h2>数据统计</h2></header>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-icon">📝</span>
            <div class="stat-body"><div class="stat-num">{{ stats.totalPosts || 0 }}</div><div class="stat-label">总帖子</div></div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">👤</span>
            <div class="stat-body"><div class="stat-num">{{ stats.totalUsers || 0 }}</div><div class="stat-label">总用户</div></div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">🔄</span>
            <div class="stat-body"><div class="stat-num">{{ stats.activePosts || 0 }}</div><div class="stat-label">进行中</div></div>
          </div>
          <div class="stat-card">
            <span class="stat-icon">✅</span>
            <div class="stat-body"><div class="stat-num">{{ stats.completedPosts || 0 }}</div><div class="stat-label">已完结</div></div>
          </div>
        </div>
        <div class="charts-row">
          <div class="chart-card"><h4>物品分类分布</h4><div ref="categoryChartRef" class="chart-box"></div></div>
          <div class="chart-card"><h4>帖子状态分布</h4><div ref="statusChartRef" class="chart-box"></div></div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
/* === Layout === */
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f8fafc;
}

/* === Sidebar === */
.sidebar {
  width: 220px;
  background: #fff;
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 10;
}
.sb-brand { display: flex; align-items: center; gap: 10px; padding: 24px 20px 20px; }
.sb-logo { font-size: 22px; }
.sb-name { font-size: 17px; font-weight: 700; color: #0f172a; letter-spacing: -0.3px; }
.sb-nav { flex: 1; padding: 4px 10px; display: flex; flex-direction: column; gap: 2px; }
.sb-item {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 10px 14px; border: none; border-radius: 8px;
  background: transparent; color: #64748b; font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all 0.15s; text-align: left;
}
.sb-item:hover { background: #f1f5f9; color: #334155; }
.sb-item.active { background: #eef2ff; color: #4f46e5; font-weight: 600; }
.sb-icon { font-size: 16px; width: 22px; text-align: center; }
.sb-footer { padding: 16px 20px; border-top: 1px solid #f1f5f9; }
.sb-back {
  width: 100%; padding: 8px 0; border: 1px solid #e2e8f0; border-radius: 8px;
  background: #fff; color: #64748b; font-size: 13px; cursor: pointer; transition: all 0.15s;
}
.sb-back:hover { background: #f8fafc; color: #334155; }

/* === Main === */
.main-content {
  flex: 1;
  margin-left: 220px;
  padding: 28px 32px 40px;
  min-width: 0;
}

.panel { max-width: none; }
.panel-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 20px;
}
.panel-header h2 { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0; letter-spacing: -0.4px; }
.panel-actions { display: flex; align-items: center; gap: 12px; }

/* === Filter pills === */
.filter-pills { display: flex; gap: 6px; }
.pill {
  padding: 6px 14px; border-radius: 20px; border: 1px solid #e2e8f0; background: #fff;
  font-size: 13px; font-weight: 500; color: #64748b; cursor: pointer; transition: all 0.15s;
  display: flex; align-items: center; gap: 6px;
}
.pill:hover { border-color: #cbd5e1; color: #334155; }
.pill.active { background: #4f46e5; border-color: #4f46e5; color: #fff; }
.badge { background: rgba(255,255,255,0.25); padding: 1px 7px; border-radius: 10px; font-size: 11px; font-weight: 600; }

/* === Table === */
.table-wrap {
  background: #fff; border-radius: 12px; border: 1px solid #e2e8f0;
  overflow: hidden;
}
.data-table { width: 100%; border-collapse: collapse; table-layout: auto; }
.data-table th {
  padding: 12px 16px; text-align: left; font-size: 12px; font-weight: 600;
  color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px;
  background: #f8fafc; border-bottom: 1px solid #e2e8f0; white-space: nowrap;
}
.data-table td {
  padding: 14px 16px; font-size: 14px; color: #334155;
  border-bottom: 1px solid #f1f5f9; vertical-align: middle;
}
.data-table tr:last-child td { border-bottom: none; }
.data-table tbody tr { transition: background 0.12s; }
.data-table tbody tr:hover { background: #f8fafc; }
.td-id { font-family: 'SF Mono', 'JetBrains Mono', monospace; color: #94a3b8; font-size: 13px; }
.td-title { font-weight: 500; max-width: 480px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.td-actions { display: flex; gap: 6px; flex-wrap: nowrap; }
.text-muted { color: #cbd5e1; font-size: 13px; }

/* === Badges === */
.type-badge {
  display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600; white-space: nowrap;
}
.type-lost { background: #fef2f2; color: #dc2626; }
.type-found { background: #ecfeff; color: #0891b2; }
.status-badge {
  display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;
}
.s-active { background: #eff6ff; color: #2563eb; }
.s-matched { background: #fffbeb; color: #d97706; }
.s-claiming { background: #fefce8; color: #ca8a04; }
.s-done { background: #f0fdf4; color: #16a34a; }
.s-archive, .s-off { background: #f3f4f6; color: #6b7280; }
.credit-badge { font-weight: 700; font-size: 14px; }
.credit-ok { color: #16a34a; }
.credit-low { color: #dc2626; }
.status-dot { font-size: 13px; font-weight: 500; }
.dot-ok { color: #16a34a; }
.dot-bad { color: #dc2626; }

/* === Buttons === */
.btn {
  padding: 6px 14px; border: none; border-radius: 7px; font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.btn-approve { background: #ecfdf5; color: #059669; }
.btn-approve:hover { background: #d1fae5; }
.btn-reject { background: #fef2f2; color: #dc2626; }
.btn-reject:hover { background: #fee2e2; }
.btn-archive { background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; }
.btn-archive:hover { background: #f1f5f9; color: #334155; }
.btn-ghost { background: transparent; color: #64748b; padding: 6px 12px; }
.btn-ghost:hover { background: #f1f5f9; color: #334155; }
.btn-ghost-danger:hover { background: #fef2f2; color: #dc2626; }
.btn-primary { background: #4f46e5; color: #fff; padding: 7px 16px; font-weight: 600; }
.btn-primary:hover { background: #4338ca; }

/* === Select === */
.dict-select { width: 130px; }
.dict-select :deep(.el-input__wrapper) { border-radius: 8px; box-shadow: 0 0 0 1px #e2e8f0 inset; }
.dict-select :deep(.el-input__wrapper:hover) { box-shadow: 0 0 0 1px #cbd5e1 inset; }

/* === Stats === */
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
.stat-card {
  background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px;
  display: flex; align-items: center; gap: 14px; transition: box-shadow 0.2s;
}
.stat-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.04); }
.stat-icon { font-size: 28px; }
.stat-body { flex: 1; }
.stat-num { font-size: 28px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px; }
.stat-label { font-size: 12px; color: #94a3b8; margin-top: 2px; }
.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.chart-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; }
.chart-card h4 { margin: 0 0 16px; font-size: 15px; font-weight: 600; color: #0f172a; }
.chart-box { width: 100%; height: 320px; }

/* === Empty === */
.empty-state { text-align: center; padding: 48px 0; color: #cbd5e1; font-size: 14px; }
</style>
