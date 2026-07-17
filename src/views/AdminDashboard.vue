<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { getPendingPosts, approvePost, rejectPost, getUsers, freezeUser, adjustCredit, blacklistUser, getDict, addDict, updateDict, deleteDict, getStats, getAllPosts, archivePost, deletePost } from '@/api/admin'
import { ElMessage } from 'element-plus'

const router = useRouter()

const navItems = [
  { key: 'posts', label: '帖子管理', icon: '' },
  { key: 'users', label: '用户管理', icon: '' },
  { key: 'dict', label: '数据字典', icon: '' },
  { key: 'stats', label: '数据统计', icon: '' },
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
const postKeyword = ref('')

const categoryChartRef = ref(null)
const statusChartRef = ref(null)
let categoryChart = null
let statusChart = null

onMounted(() => { loadAllPosts(); loadStats() })

// === Dialog system ===
const dialog = ref({ show: false, title: '', desc: '', inputValue: '', action: null, type: 'input' })
const currentItemId = ref(null)

function openDialog(title, desc, defaultValue, action) {
  dialog.value = { show: true, title, desc, inputValue: defaultValue || '', action, type: 'input' }
}
function openConfirm(title, desc, action) {
  dialog.value = { show: true, title, desc, inputValue: '', action, type: 'confirm' }
}
function closeDialog() { dialog.value.show = false }
async function submitDialog() {
  if (dialog.value.type === 'confirm') {
    await dialog.value.action()
  } else {
    const val = dialog.value.inputValue
    if (!val && dialog.value.type === 'input') { ElMessage.warning('请输入内容'); return }
    await dialog.value.action(val)
  }
  closeDialog()
}

// === Posts ===
async function loadAllPosts() {
  loading.value = true
  const params = { page: 1, size: 100 }
  if (postKeyword.value.trim()) params.keyword = postKeyword.value.trim()
  const res = await getAllPosts(params)
  allPosts.value = res.data.records
  posts.value = allPosts.value.filter(p => p.reviewStatus === 0)
  loading.value = false
}
async function handleApprove(id) { await approvePost(id); ElMessage.success('审核通过'); loadAllPosts() }
async function handleReject(id) {
  currentItemId.value = id
  openDialog('审核拒绝', '请输入拒绝原因', '违规内容', async (value) => {
    await rejectPost(currentItemId.value, value); ElMessage.success('已拒绝'); loadAllPosts()
  })
}
async function handleArchivePost(id) { await archivePost(id); ElMessage.success('已归档'); loadAllPosts() }
async function handleDeletePost(id) {
  currentItemId.value = id
  openConfirm('确认删除', '确定要删除该帖子吗？此操作不可撤销。', async () => {
    await deletePost(currentItemId.value); ElMessage.success('已删除'); loadAllPosts()
  })
}
function statusLabel(s) { const m = { 0: '进行中', 1: '已匹配', 2: '认领中', 3: '已完结', 4: '已归档', 5: '已下架' }; return m[s] || '未知' }

// === Users ===
async function loadUsers() { loading.value = true; const res = await getUsers({ page: 1, size: 50 }); users.value = res.data.records; loading.value = false }
async function handleFreeze(id) {
  currentItemId.value = id
  openDialog('冻结用户', '冻结天数（0=永久/切换）', '0', async (value) => {
    if (value === undefined) return; await freezeUser(currentItemId.value, parseInt(value)); ElMessage.success('已操作'); loadUsers()
  })
}
async function handleBlacklist(id) {
  currentItemId.value = id
  openDialog('拉黑用户', '拉黑天数（0=永久/切换）', '0', async (value) => {
    if (value === undefined) return; await blacklistUser(currentItemId.value, parseInt(value)); ElMessage.success('已操作'); loadUsers()
  })
}
async function handleCredit(id) {
  currentItemId.value = id
  openDialog('调整信用分', '请输入增减分数（正数增加，负数减少）', '5', async (value) => {
    if (!value) return; await adjustCredit(currentItemId.value, parseInt(value)); ElMessage.success('已调整'); loadUsers()
  })
}

// === Dict ===
async function loadDict() { const res = await getDict(dictType.value); dictItems.value = res.data }
async function handleAddDict() {
  openDialog('新增', '请输入名称', '', async (value) => {
    if (!value) return; await addDict({ type: dictType.value, name: value, parentId: 0, sortOrder: 0, status: 1 }); ElMessage.success('已添加'); loadDict()
  })
}
async function handleUpdateDict(item) {
  openDialog('修改', '请输入新名称', item.name, async (value) => {
    if (!value) return; await updateDict(item.id, { name: value }); ElMessage.success('已更新'); loadDict()
  })
}
async function handleDeleteDict(id) {
  currentItemId.value = id
  openConfirm('确认删除', '确定要删除该项吗？此操作不可撤销。', async () => {
    await deleteDict(currentItemId.value); ElMessage.success('已删除'); loadDict()
  })
}

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
    xAxis: { type: 'value', axisLabel: { color: '#b0a690', fontSize: 11 }, splitLine: { lineStyle: { color: '#e8dfc6' } } },
    yAxis: { type: 'category', data: cats.map(c => c.name), axisLabel: { color: '#5c5448', fontSize: 12 }, axisLine: { show: false }, axisTick: { show: false } },
    series: [{
      name: '帖子数', type: 'bar', data: cats.map(c => c.count),
      itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#c8553d' }, { offset: 1, color: '#e2a294' }]), borderRadius: [0, 6, 6, 0] },
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
    legend: { bottom: 0, textStyle: { color: '#8a8170', fontSize: 11 } },
    series: [{
      name: '帖子状态', type: 'pie', radius: ['55%', '78%'], center: ['50%', '45%'],
      avoidLabelOverlap: true, itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 3 },
      label: { show: true, formatter: '{b}\n{d}%', fontSize: 10, color: '#5c5448' },
      data: [
        { value: s.activePosts || 0, name: '进行中', itemStyle: { color: '#c8553d' } },
        { value: s.matchedPosts || 0, name: '已匹配', itemStyle: { color: '#c9956b' } },
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
function goPost(id) { router.push(`/post/${id}`) }
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
    <aside class="sidebar">
      <div class="sb-brand">
        <span class="sb-logo">LF</span>
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

    <main class="main-content">

      <section v-if="activeNav === 'posts'" class="panel">
        <header class="panel-header">
          <h2>帖子管理</h2>
          <div class="panel-actions">
            <div class="filter-pills">
              <button :class="['pill', { active: postFilter === 'pending' }]" @click="onPostFilterChange('pending')">待审核 <span class="badge">{{ posts.length }}</span></button>
              <button :class="['pill', { active: postFilter === 'all' }]" @click="onPostFilterChange('all')">全部</button>
            </div>
            <div class="post-search-wrap">
              <input v-model="postKeyword" placeholder="搜索标题/内容..." class="post-search-input" @keyup.enter="loadAllPosts()" />
              <button class="btn-search-icon" @click="loadAllPosts()"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8a8170" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></button>
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
                <th style="width:210px">操作</th>
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
                    <button class="btn btn-view" @click="goPost(row.id)">查看</button>
                    <button class="btn btn-approve" @click="handleApprove(row.id)">通过</button>
                    <button class="btn btn-reject" @click="handleReject(row.id)">拒绝</button>
                  </template>
                  <template v-else>
                    <button v-if="row.status !== 4 && row.status !== 5" class="btn btn-archive" @click="handleArchivePost(row.id)">归档</button>
                    <button class="btn btn-del" @click="handleDeletePost(row.id)">删除</button>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="filteredPosts().length === 0 && !loading" class="empty-state">当前没有待处理的内容</div>
        </div>
      </section>

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
                  <button class="btn btn-credit" @click="handleCredit(row.id)">信用</button>
                  <button class="btn btn-freeze" @click="handleFreeze(row.id)">{{ row.status === 0 ? '冻结' : '解冻' }}</button>
                  <button class="btn btn-ban" @click="handleBlacklist(row.id)">{{ row.blacklisted ? '取消拉黑' : '拉黑' }}</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="activeNav === 'dict'" class="panel">
        <header class="panel-header">
          <h2>数据字典</h2>
          <div class="panel-actions">
            <div class="dict-select-wrap">
              <select v-model="dictType" @change="loadDict" class="dict-native-select">
                <option value="item_category">物品大类</option>
                <option value="color">颜色</option>
                <option value="location">校区</option>
              </select>
              <span class="select-arrow">▾</span>
            </div>
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
                  <button class="btn btn-edit" @click="handleUpdateDict(row)">编辑</button>
                  <button class="btn btn-del" @click="handleDeleteDict(row.id)">删除</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section v-if="activeNav === 'stats'" class="panel">
        <header class="panel-header"><h2>数据统计</h2></header>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c8553d" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg></span>
            <div class="stat-body"><div class="stat-num">{{ stats.totalPosts || 0 }}</div><div class="stat-label">总帖子</div></div>
          </div>
          <div class="stat-card">
            <span class="stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c8553d" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
            <div class="stat-body"><div class="stat-num">{{ stats.totalUsers || 0 }}</div><div class="stat-label">总用户</div></div>
          </div>
          <div class="stat-card">
            <span class="stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c8553d" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg></span>
            <div class="stat-body"><div class="stat-num">{{ stats.activePosts || 0 }}</div><div class="stat-label">进行中</div></div>
          </div>
          <div class="stat-card">
            <span class="stat-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c8553d" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></span>
            <div class="stat-body"><div class="stat-num">{{ stats.completedPosts || 0 }}</div><div class="stat-label">已完结</div></div>
          </div>
        </div>
        <div class="charts-row">
          <div class="chart-card"><h4>物品分类分布</h4><div ref="categoryChartRef" class="chart-box"></div></div>
          <div class="chart-card"><h4>帖子状态分布</h4><div ref="statusChartRef" class="chart-box"></div></div>
        </div>
      </section>
    </main>

    <el-dialog v-model="dialog.show" :title="dialog.title" width="400px" :close-on-click-modal="false">
      <p class="dialog-desc" v-if="dialog.desc">{{ dialog.desc }}</p>
      <el-input v-if="dialog.type === 'input'" v-model="dialog.inputValue" :placeholder="dialog.desc" maxlength="50" @keyup.enter="submitDialog" />
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="submitDialog">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/* === Layout === */
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #faf6ee;
}

/* === Sidebar === */
.sidebar {
  width: 220px;
  background: #f3ecdb;
  border-right: 1px solid #d9cfb8;
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
.sb-name { font-size: 17px; font-weight: 700; color: #2d2a26; letter-spacing: -0.3px; font-family: 'Noto Serif SC', Georgia, serif; }
.sb-nav { flex: 1; padding: 4px 10px; display: flex; flex-direction: column; gap: 2px; }
.sb-item {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 11px 14px; border: none; border-radius: 6px;
  background: transparent; color: #5c5448; font-size: 14px; font-weight: 500;
  cursor: pointer; transition: all 0.15s; text-align: left;
}
.sb-item:hover { background: #e8dfc6; color: #2d2a26; }
.sb-item.active { background: #f7ede9; color: #c8553d; font-weight: 600; }
.sb-icon { font-size: 17px; width: 22px; text-align: center; }
.sb-footer { padding: 16px 20px; border-top: 1px solid #d9cfb8; }
.sb-back {
  width: 100%; padding: 10px 0; border: none; border-radius: 6px;
  background: #e8dfc6; color: #5c5448; font-size: 14px; font-weight: 600;
  cursor: pointer; transition: all 0.15s;
}
.sb-back:hover { background: #f7ede9; color: #c8553d; }

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
.panel-header h2 { font-size: 22px; font-weight: 700; color: #2d2a26; margin: 0; letter-spacing: -0.4px; font-family: 'Noto Serif SC', Georgia, serif; }
.panel-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

/* === Search === */
.post-search-wrap { display: flex; align-items: center; margin-left: auto; }
.post-search-input {
  width: 200px; padding: 7px 12px; border: 1px solid #c4b896; border-radius: 6px 0 0 6px;
  font-size: 13px; color: #2d2a26; outline: none; transition: border 0.15s; background: #f3ecdb;
}
.post-search-input:focus { border-color: #c8553d; }
.post-search-input::placeholder { color: #b0a690; }
.btn-search-icon {
  padding: 7px 12px; border: 1px solid #c4b896; border-left: none; border-radius: 0 6px 6px 0;
  background: #faf6ee; cursor: pointer; font-size: 14px; transition: background 0.15s;
}
.btn-search-icon:hover { background: #e8dfc6; }

/* === Filter pills === */
.filter-pills { display: flex; gap: 6px; }
.pill {
  padding: 7px 16px; border-radius: 6px; border: 1px solid #c4b896; background: #f3ecdb;
  font-size: 13px; font-weight: 600; color: #5c5448; cursor: pointer; transition: all 0.15s;
  display: flex; align-items: center; gap: 6px;
}
.pill:hover { border-color: #b0a690; color: #2d2a26; }
.pill.active { background: #c8553d; border-color: #c8553d; color: #faf6ee; }
.badge { background: rgba(250,246,238,0.3); padding: 1px 7px; border-radius: 6px; font-size: 11px; font-weight: 700; }

/* === Table === */
.table-wrap {
  background: #f3ecdb; border-radius: 6px; border: 1px solid #c4b896;
  border-bottom: 3px solid #c4b896;
  overflow: hidden;
}
.data-table { width: 100%; border-collapse: collapse; table-layout: auto; }
.data-table th {
  padding: 13px 16px; text-align: left; font-size: 11px; font-weight: 700;
  color: #8a8170; text-transform: uppercase; letter-spacing: 0.6px;
  background: #e8dfc6; border-bottom: 2px solid #d9cfb8; white-space: nowrap;
}
.data-table td {
  padding: 15px 16px; font-size: 14px; color: #2d2a26;
  border-bottom: 1px solid #d9cfb8; vertical-align: middle;
}
.data-table tr:last-child td { border-bottom: none; }
.data-table tbody tr { transition: background 0.12s; }
.data-table tbody tr:hover { background: #e8dfc6; }
.td-id { font-family: 'JetBrains Mono', 'Courier New', monospace; color: #8a8170; font-size: 13px; font-weight: 500; }
.td-title { font-weight: 500; max-width: 480px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.td-actions { display: flex; gap: 6px; flex-wrap: nowrap; align-items: center; }

/* === Badges === */
.type-badge {
  display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; white-space: nowrap;
}
.type-lost { background: #f7ede9; color: #b54a3a; }
.type-found { background: #e8efd9; color: #6b8e4e; }
.status-badge {
  display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 600;
}
.s-active { background: #f7ede9; color: #c8553d; }
.s-matched { background: #f5ebd6; color: #c9956b; }
.s-claiming { background: #f5ebd6; color: #c9956b; }
.s-done { background: #e8efd9; color: #6b8e4e; }
.s-archive, .s-off { background: #e8dfc6; color: #8a8170; }
.credit-badge { font-weight: 700; font-size: 14px; font-family: 'JetBrains Mono', 'Courier New', monospace; }
.credit-ok { color: #6b8e4e; }
.credit-low { color: #b54a3a; }
.status-dot { font-size: 13px; font-weight: 500; }
.dot-ok { color: #6b8e4e; }
.dot-bad { color: #b54a3a; }

/* === Buttons === */
.btn {
  padding: 6px 14px; border: none; border-radius: 6px; font-size: 13px; font-weight: 600;
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.btn-approve { background: #e8efd9; color: #6b8e4e; }
.btn-approve:hover { background: #d4e1bc; }
.btn-reject { background: #f7ede9; color: #b54a3a; }
.btn-reject:hover { background: #f0dcd6; }
.btn-view { background: #f7ede9; color: #a8442f; }
.btn-view:hover { background: #f0dcd6; }
.btn-archive { background: #e8dfc6; color: #5c5448; border: 1px solid #d9cfb8; }
.btn-archive:hover { background: #d9cfb8; color: #2d2a26; }
.btn-credit { background: #e8efd9; color: #6b8e4e; }
.btn-credit:hover { background: #d4e1bc; }
.btn-freeze { background: #f5ebd6; color: #c9956b; }
.btn-freeze:hover { background: #e8d5b8; }
.btn-ban { background: #f7ede9; color: #b54a3a; }
.btn-ban:hover { background: #f0dcd6; }
.btn-edit { background: #f7ede9; color: #a8442f; }
.btn-edit:hover { background: #f0dcd6; }
.btn-del { background: #f7ede9; color: #b54a3a; }
.btn-del:hover { background: #f0dcd6; }
.btn-ghost { background: transparent; color: #5c5448; padding: 6px 12px; }
.btn-ghost:hover { background: #e8dfc6; }
.btn-primary { background: #c8553d; color: #faf6ee; padding: 7px 16px; font-weight: 600; }
.btn-primary:hover { background: #a8442f; }

/* === Native Select === */
.dict-select-wrap { position: relative; width: 150px; }
.dict-native-select {
  width: 100%; padding: 9px 36px 9px 14px; border: 1px solid #c4b896; border-radius: 6px;
  background: #f3ecdb; color: #2d2a26; font-size: 14px; font-weight: 500;
  cursor: pointer; appearance: none; -webkit-appearance: none; outline: none;
  transition: all 0.15s; line-height: 1.4;
}
.dict-native-select:hover { border-color: #b0a690; background: #faf6ee; }
.dict-native-select:focus { border-color: #c8553d; }
.select-arrow {
  position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
  color: #b0a690; font-size: 13px; pointer-events: none;
}

/* === Stats === */
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
.stat-card {
  background: #f3ecdb; border: 1px solid #c4b896; border-radius: 6px; padding: 20px;
  border-bottom: 3px solid #c4b896;
  display: flex; align-items: center; gap: 14px; transition: border-color 0.2s;
}
.stat-card:hover { border-color: #b0a690; }
.stat-icon { font-size: 28px; }
.stat-body { flex: 1; }
.stat-num { font-size: 28px; font-weight: 700; color: #2d2a26; letter-spacing: -0.5px; font-family: 'JetBrains Mono', 'Courier New', monospace; }
.stat-label { font-size: 12px; color: #b0a690; margin-top: 2px; }
.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.chart-card { background: #f3ecdb; border: 1px solid #c4b896; border-radius: 6px; padding: 24px; border-bottom: 3px solid #c4b896; }
.chart-card h4 { margin: 0 0 16px; font-size: 15px; font-weight: 600; color: #2d2a26; font-family: 'Noto Serif SC', Georgia, serif; }
.chart-box { width: 100%; height: 320px; }

/* === Empty === */
.empty-state { text-align: center; padding: 48px 0; color: #b0a690; font-size: 14px; }

/* === Dialog === */
.dialog-desc { margin: 0 0 12px; color: #8a8170; font-size: 14px; line-height: 1.5; }
</style>
