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
    xAxis: { type: 'value', axisLabel: { color: '#6b7280', fontSize: 12 }, splitLine: { lineStyle: { color: '#f3f4f6' } } },
    yAxis: { type: 'category', data: cats.map(c => c.name), axisLabel: { color: '#6b7280', fontSize: 12 }, axisLine: { show: false }, axisTick: { show: false } },
    series: [{
      name: '帖子数', type: 'bar', data: cats.map(c => c.count),
      itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#4f46e5' }, { offset: 1, color: '#818cf8' }]), borderRadius: [0, 6, 6, 0] },
      barWidth: 16, label: { show: true, position: 'right', color: '#1f2937', fontSize: 11, fontWeight: 600 }
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
    legend: { bottom: 0, textStyle: { color: '#6b7280', fontSize: 11 } },
    series: [{
      name: '帖子状态', type: 'pie', radius: ['55%', '78%'], center: ['50%', '45%'],
      avoidLabelOverlap: true, itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 3 },
      label: { show: true, formatter: '{b}\n{d}%', fontSize: 10, color: '#6b7280' },
      data: [
        { value: s.activePosts || 0, name: '进行中', itemStyle: { color: '#4f46e5' } },
        { value: s.matchedPosts || 0, name: '已匹配', itemStyle: { color: '#059669' } },
        { value: s.completedPosts || 0, name: '已完结', itemStyle: { color: '#d97706' } },
        { value: s.pendingReviews || 0, name: '待审核', itemStyle: { color: '#f3f4f6' } }
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
  <div class="admin-content">
    <!-- internal section tabs -->
    <nav class="admin-tabs">
      <button
        v-for="item in navItems" :key="item.key"
        class="admin-tab"
        :class="{ active: activeNav === item.key }"
        @click="switchNav(item.key)"
      >{{ item.label }}</button>
    </nav>

    <!-- ===== 数据统计 / 数据概览 ===== -->
    <section v-if="activeNav === 'stats'" class="admin-section">
      <div class="admin-section-header">
        <h2>数据概览</h2>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon-wrap stat-icon-indigo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div class="stat-body">
            <div class="stat-num">{{ stats.totalPosts || 0 }}</div>
            <div class="stat-label">总帖子</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrap stat-icon-moss">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
          <div class="stat-body">
            <div class="stat-num">{{ stats.totalUsers || 0 }}</div>
            <div class="stat-label">总用户</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrap stat-icon-amber">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </div>
          <div class="stat-body">
            <div class="stat-num">{{ stats.activePosts || 0 }}</div>
            <div class="stat-label">进行中</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon-wrap stat-icon-indigo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div class="stat-body">
            <div class="stat-num">{{ stats.completedPosts || 0 }}</div>
            <div class="stat-label">已完结</div>
          </div>
        </div>
      </div>

      <div class="charts-row">
        <div class="chart-card">
          <h4>物品分类分布</h4>
          <div ref="categoryChartRef" class="chart-box"></div>
        </div>
        <div class="chart-card">
          <h4>帖子状态分布</h4>
          <div ref="statusChartRef" class="chart-box"></div>
        </div>
      </div>
    </section>

    <!-- ===== 帖子管理 ===== -->
    <section v-if="activeNav === 'posts'" class="admin-section">
      <div class="admin-section-header">
        <h2>帖子管理</h2>
        <div class="admin-actions">
          <div class="filter-pills">
            <button :class="['pill', { active: postFilter === 'pending' }]" @click="onPostFilterChange('pending')">待审核 <span class="pill-badge">{{ posts.length }}</span></button>
            <button :class="['pill', { active: postFilter === 'all' }]" @click="onPostFilterChange('all')">全部</button>
          </div>
          <el-input
            v-model="postKeyword"
            placeholder="搜索标题/内容..."
            class="post-search"
            clearable
            @keyup.enter="loadAllPosts()"
          >
            <template #append>
              <el-button @click="loadAllPosts()">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </el-button>
            </template>
          </el-input>
        </div>
      </div>

      <el-table :data="filteredPosts()" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="64" />
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            <span class="tag-type" :class="getTypeClass(row.type)">{{ getPostType(row.type) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" show-overflow-tooltip />
        <el-table-column v-if="postFilter === 'all'" label="状态" width="96">
          <template #default="{ row }">
            <span class="tag-status" :class="'s-' + row.status">{{ statusLabel(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <template v-if="postFilter === 'pending'">
              <button class="act-btn act-view" @click="goPost(row.id)">查看</button>
              <button class="act-btn act-approve" @click="handleApprove(row.id)">通过</button>
              <button class="act-btn act-reject" @click="handleReject(row.id)">拒绝</button>
            </template>
            <template v-else>
              <button v-if="row.status !== 4 && row.status !== 5" class="act-btn act-archive" @click="handleArchivePost(row.id)">归档</button>
              <button class="act-btn act-del" @click="handleDeletePost(row.id)">删除</button>
            </template>
          </template>
        </el-table-column>
      </el-table>
      <div v-if="filteredPosts().length === 0 && !loading" class="empty-state">
        <p class="empty-text">当前没有待处理的内容</p>
      </div>
    </section>

    <!-- ===== 用户管理 ===== -->
    <section v-if="activeNav === 'users'" class="admin-section">
      <div class="admin-section-header">
        <h2>用户管理</h2>
      </div>
      <el-table :data="users" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="64" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column label="信用分" width="84">
          <template #default="{ row }">
            <span class="credit-num" :class="row.creditScore >= 80 ? 'credit-ok' : 'credit-low'">{{ row.creditScore }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="84">
          <template #default="{ row }">
            <span :class="['status-text', row.status === 0 ? 'st-ok' : 'st-bad']">{{ row.status === 0 ? '正常' : '冻结' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <button class="act-btn act-credit" @click="handleCredit(row.id)">信用</button>
            <button class="act-btn act-freeze" @click="handleFreeze(row.id)">{{ row.status === 0 ? '冻结' : '解冻' }}</button>
            <button class="act-btn act-ban" @click="handleBlacklist(row.id)">{{ row.blacklisted ? '取消拉黑' : '拉黑' }}</button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <!-- ===== 数据字典 / 分类管理 ===== -->
    <section v-if="activeNav === 'dict'" class="admin-section">
      <div class="admin-section-header">
        <h2>分类管理</h2>
        <div class="admin-actions">
          <el-select v-model="dictType" @change="loadDict" class="dict-select">
            <el-option label="物品大类" value="item_category" />
            <el-option label="颜色" value="color" />
            <el-option label="校区" value="location" />
          </el-select>
          <button class="btn-primary" @click="handleAddDict">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            新增
          </button>
        </div>
      </div>
      <el-table :data="dictItems" style="width: 100%">
        <el-table-column prop="id" label="ID" width="64" />
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="sortOrder" label="排序" width="80" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <button class="act-btn act-edit" @click="handleUpdateDict(row)">编辑</button>
            <button class="act-btn act-del" @click="handleDeleteDict(row.id)">删除</button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <!-- ===== Dialog ===== -->
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
/* ===== admin content wrapper ===== */
.admin-content {
  padding: 24px 28px;
  position: relative;
  z-index: 1;
}

/* ===== internal section tabs ===== */
.admin-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  border-bottom: 2px solid var(--page-edge);
  padding-bottom: 0;
}
.admin-tab {
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--ink-500);
  font-size: 15px;
  font-weight: 500;
  padding: 8px 18px;
  cursor: pointer;
  transition: var(--transition);
  margin-bottom: -2px;
}
.admin-tab:hover { color: var(--ink-900); }
.admin-tab.active { color: var(--indigo); font-weight: 600; border-bottom-color: var(--indigo); }

/* ===== section ===== */
.admin-section {
  background: var(--page);
  border: 1px solid var(--page-edge);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-card);
  padding: 24px 28px;
}
.admin-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--page-edge);
  flex-wrap: wrap;
  gap: 12px;
}
.admin-section-header h2 {
  font-family: var(--pen-font);
  font-size: var(--fs-h2);
  font-weight: 700;
  color: var(--ink-900);
  margin: 0;
  letter-spacing: -0.3px;
}
.admin-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* ===== filter pills ===== */
.filter-pills { display: flex; gap: 6px; }
.pill {
  padding: 6px 16px;
  border-radius: var(--r-pill);
  border: 1px solid var(--page-edge);
  background: var(--page);
  font-size: 13px;
  font-weight: 500;
  color: var(--ink-700);
  cursor: pointer;
  transition: var(--transition);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.pill:hover { background: var(--indigo-light); color: var(--indigo); }
.pill.active { background: var(--indigo); border-color: var(--indigo); color: #fff; font-weight: 600; }
.pill-badge {
  background: rgba(255,255,255,0.25);
  padding: 1px 7px;
  border-radius: var(--r-pill);
  font-size: 11px;
  font-weight: 700;
}

/* ===== post search ===== */
.post-search { width: 240px; }

/* ===== dict select ===== */
.dict-select { width: 160px; }

/* ===== stat cards ===== */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}
.stat-card {
  background: var(--page);
  border: 1px solid var(--page-edge);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-card);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: var(--transition-slow);
}
.stat-card:hover { box-shadow: var(--shadow-hover); transform: translateY(-2px); }
.stat-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: var(--r-card);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.stat-icon-indigo { background: var(--indigo-light); color: var(--indigo); }
.stat-icon-moss { background: var(--moss-light); color: var(--moss); }
.stat-icon-amber { background: var(--amber-light); color: var(--amber); }
.stat-body { flex: 1; }
.stat-num {
  font-family: var(--mono-font);
  font-size: 28px;
  font-weight: 700;
  color: var(--ink-900);
  letter-spacing: -0.5px;
  line-height: 1.1;
}
.stat-label {
  font-size: var(--fs-caption);
  color: var(--ink-500);
  margin-top: 2px;
}

/* ===== charts ===== */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.chart-card {
  background: var(--page);
  border: 1px solid var(--page-edge);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-card);
  padding: 24px;
}
.chart-card h4 {
  margin: 0 0 16px;
  font-size: var(--fs-h3);
  font-weight: 600;
  color: var(--ink-900);
  font-family: var(--pen-font);
}
.chart-box { width: 100%; height: 320px; }

/* ===== type / status tags (reuse global classes) ===== */
.type-lost { background: var(--rose-light); color: var(--rose); border: 1px solid #fecaca; }
.type-found { background: var(--moss-light); color: var(--moss); border: 1px solid #bbf7d0; }

/* ===== credit / status text ===== */
.credit-num {
  font-family: var(--mono-font);
  font-weight: 700;
  font-size: 15px;
}
.credit-ok { color: var(--moss); }
.credit-low { color: var(--rose); }
.status-text { font-size: var(--fs-small); font-weight: 500; }
.st-ok { color: var(--moss); }
.st-bad { color: var(--rose); }

/* ===== action buttons ===== */
.act-btn {
  padding: 5px 12px;
  border: 1px solid var(--page-edge);
  border-radius: var(--r-btn);
  font-size: var(--fs-small);
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
  white-space: nowrap;
  background: var(--page);
  color: var(--ink-700);
}
.act-btn:hover { transform: scale(0.97); }
.act-view { color: var(--indigo); border-color: #c7d2fe; background: var(--indigo-light); }
.act-view:hover { background: #e0e7ff; }
.act-approve { color: var(--moss); border-color: #bbf7d0; background: var(--moss-light); }
.act-approve:hover { background: #d1fae5; }
.act-reject { color: var(--rose); border-color: #fecaca; background: var(--rose-light); }
.act-reject:hover { background: #fee2e2; }
.act-archive { color: var(--ink-500); }
.act-archive:hover { background: #f3f4f6; color: var(--ink-900); }
.act-credit { color: var(--indigo); border-color: #c7d2fe; background: var(--indigo-light); }
.act-credit:hover { background: #e0e7ff; }
.act-freeze { color: var(--amber); border-color: #fde68a; background: var(--amber-light); }
.act-freeze:hover { background: #fef3c7; }
.act-ban { color: var(--rose); border-color: #fecaca; background: var(--rose-light); }
.act-ban:hover { background: #fee2e2; }
.act-edit { color: var(--indigo); border-color: #c7d2fe; background: var(--indigo-light); }
.act-edit:hover { background: #e0e7ff; }
.act-del { color: var(--rose); border-color: #fecaca; background: var(--rose-light); }
.act-del:hover { background: #fee2e2; }

/* ===== dialog ===== */
.dialog-desc {
  margin: 0 0 12px;
  color: var(--ink-500);
  font-size: 14px;
  line-height: 1.5;
}
</style>
