<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { getPendingPosts, approvePost, rejectPost, getUsers, freezeUser, adjustCredit, blacklistUser, getDict, addDict, updateDict, deleteDict, getStats, getAllPosts, archivePost } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const activeTab = ref('posts')
const posts = ref([])
const allPosts = ref([])
const users = ref([])
const dictType = ref('item_category')
const dictItems = ref([])
const stats = ref({})
const loading = ref(false)
const postFilter = ref('pending')

// ECharts refs
const categoryChartRef = ref(null)
const statusChartRef = ref(null)
let categoryChart = null
let statusChart = null

onMounted(() => { loadAllPosts(); loadStats() })

function initCharts() {
  nextTick(() => {
    initCategoryChart()
    initStatusChart()
  })
}

function initCategoryChart() {
  if (!categoryChartRef.value) return
  if (categoryChart) categoryChart.dispose()
  categoryChart = echarts.init(categoryChartRef.value)
  
  const cats = stats.value.categoryDistribution || []
  categoryChart.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '10%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: { type: 'value', axisLabel: { color: '#909399' }, splitLine: { lineStyle: { color: '#f3f4f6' } } },
    yAxis: { type: 'category', data: cats.map(c => c.name), axisLabel: { color: '#606266' }, axisLine: { show: false }, axisTick: { show: false } },
    series: [{
      name: '帖子数', type: 'bar', data: cats.map(c => c.count),
      itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
        { offset: 0, color: '#5a67d8' }, { offset: 1, color: '#7c8aff' }
      ]), borderRadius: [0, 6, 6, 0] },
      barWidth: 18,
      label: { show: true, position: 'right', color: '#303133', fontSize: 12 }
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
    legend: { bottom: 0, textStyle: { color: '#606266', fontSize: 12 } },
    series: [{
      name: '帖子状态', type: 'pie', radius: ['50%', '75%'], center: ['50%', '45%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 3 },
      label: { show: true, formatter: '{b}\n{d}%', fontSize: 11 },
      data: [
        { value: s.activePosts || 0, name: '进行中', itemStyle: { color: '#3b82f6' } },
        { value: s.matchedPosts || 0, name: '已匹配', itemStyle: { color: '#f59e0b' } },
        { value: s.completedPosts || 0, name: '已完结', itemStyle: { color: '#86d3a4' } },
        { value: s.pendingReviews || 0, name: '待审核', itemStyle: { color: '#ef4444' } }
      ]
    }]
  })
}

watch(activeTab, (tab) => { if (tab === 'stats') initCharts() })

function onTabChange(tab) {
  if (tab === 'posts') loadAllPosts()
  else if (tab === 'users') loadUsers()
  else if (tab === 'dict') loadDict()
  else if (tab === 'stats') loadStats()
}

// Posts
async function loadAllPosts() { loading.value = true; const res = await getAllPosts({ page: 1, size: 100 }); allPosts.value = res.data.records; posts.value = allPosts.value.filter(p => p.reviewStatus === 0); loading.value = false }
async function handleApprove(id) { await approvePost(id); ElMessage.success('已通过'); loadAllPosts() }
async function handleReject(id) {
  const { value } = await ElMessageBox.prompt('拒绝原因', '审核拒绝', { inputValue: '违规内容' }).catch(() => {})
  if (!value) return; await rejectPost(id, value); ElMessage.success('已拒绝'); loadAllPosts()
}
async function handleArchivePost(id) { await archivePost(id); ElMessage.success('已归档'); loadAllPosts() }
function statusLabel(s) { const map = { 0: '进行中', 1: '已匹配', 2: '认领中', 3: '已完结', 4: '已归档', 5: '已下架' }; return map[s] || '未知' }

// Users
async function loadUsers() { loading.value = true; const res = await getUsers({ page: 1, size: 50 }); users.value = res.data.records; loading.value = false }
async function handleFreeze(id) {
  const { value } = await ElMessageBox.prompt('冻结天数（0=永久/切换）', '冻结用户', { inputValue: '0' }).catch(() => {})
  if (value === undefined) return; await freezeUser(id, parseInt(value)); ElMessage.success('已操作'); loadUsers()
}
async function handleBlacklist(id) {
  const { value } = await ElMessageBox.prompt('拉黑天数（0=永久/切换）', '拉黑用户', { inputValue: '0' }).catch(() => {})
  if (value === undefined) return
  await blacklistUser(id, parseInt(value))
  ElMessage.success('已操作'); loadUsers()
}
async function handleCredit(id) {
  const { value } = await ElMessageBox.prompt('增减分数', '调整信用分', { inputValue: '5' }).catch(() => {})
  if (!value) return; await adjustCredit(id, parseInt(value)); ElMessage.success('已调整'); loadUsers()
}

// Dict
async function loadDict() { const res = await getDict(dictType.value); dictItems.value = res.data }
async function handleAddDict() { const { value } = await ElMessageBox.prompt('名称', '新增').catch(() => {}); if (!value) return; await addDict({ type: dictType.value, name: value, parentId: 0, sortOrder: 0, status: 1 }); ElMessage.success('已添加'); loadDict() }
async function handleUpdateDict(item) { const { value } = await ElMessageBox.prompt('新名称', '修改', { inputValue: item.name }).catch(() => {}); if (!value) return; await updateDict(item.id, { name: value }); ElMessage.success('已更新'); loadDict() }
async function handleDeleteDict(id) { await ElMessageBox.confirm('确定删除？', '确认', { type: 'warning' }); await deleteDict(id); ElMessage.success('已删除'); loadDict() }

// Stats
async function loadStats() { stats.value = (await getStats()).data }
function onPostFilterChange(val) { postFilter.value = val }
</script>

<template>
  <div class="admin-page">
    <div class="hero-section">
      <div class="hero-left"><h1 class="hero-title">管理后台</h1><p class="hero-sub">帖子管理 · 数据字典 · 用户管理 · 数据统计</p></div>
      <el-button class="back-btn" @click="router.push('/profile')">&larr; 返回个人中心</el-button>
    </div>

    <el-tabs v-model="activeTab" @tab-change="onTabChange" class="admin-tabs">
      <!-- 帖子管理 -->
      <el-tab-pane label="帖子管理" name="posts">
        <div class="post-filter-row">
          <el-radio-group v-model="postFilter" size="small" @change="onPostFilterChange">
            <el-radio-button value="pending">待审核 ({{ posts.length }})</el-radio-button>
            <el-radio-button value="all">全部帖子</el-radio-button>
          </el-radio-group>
        </div>
        <el-table :data="postFilter === 'pending' ? posts : allPosts" v-loading="loading" max-height="500">
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column label="类型" width="80">
            <template #default="{ row }"><span class="s-capsule" :class="row.type === 0 ? 'sc-lost' : 'sc-found'">{{ row.type === 0 ? '寻物' : '招领' }}</span></template>
          </el-table-column>
          <el-table-column prop="title" label="标题" min-width="200" />
          <el-table-column v-if="postFilter === 'all'" label="状态" width="90">
            <template #default="{ row }"><span class="s-capsule" :class="'sc-' + row.status">{{ statusLabel(row.status) }}</span></template>
          </el-table-column>
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <template v-if="postFilter === 'pending'">
                <el-button size="small" type="success" @click="handleApprove(row.id)">通过</el-button>
                <el-button size="small" type="danger" @click="handleReject(row.id)">拒绝</el-button>
              </template>
              <template v-else>
                <el-button v-if="row.status !== 4 && row.status !== 5" size="small" type="warning" @click="handleArchivePost(row.id)">归档</el-button>
                <span v-else style="color:#c0c4cc;font-size:12px">已归档</span>
              </template>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 数据字典 -->
      <el-tab-pane label="数据字典" name="dict">
        <div style="margin-bottom:12px;display:flex;gap:12px;align-items:center">
          <el-select v-model="dictType" @change="loadDict" style="width:140px">
            <el-option label="物品大类" value="item_category" />
            <el-option label="颜色" value="color" />
            <el-option label="校区" value="location" />
          </el-select>
          <el-button size="small" type="primary" @click="handleAddDict">+ 新增</el-button>
        </div>
        <el-table :data="dictItems" border stripe>
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="sortOrder" label="排序" width="80" />
          <el-table-column label="操作" width="160">
            <template #default="{ row }"><el-button size="small" @click="handleUpdateDict(row)">编辑</el-button><el-button size="small" type="danger" @click="handleDeleteDict(row.id)">删除</el-button></template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 用户管理 -->
      <el-tab-pane label="用户管理" name="users">
        <el-table :data="users" v-loading="loading" border stripe>
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="username" label="用户名" />
          <el-table-column prop="nickname" label="昵称" />
          <el-table-column prop="creditScore" label="信用分" width="75" />
          <el-table-column label="状态" width="75">
            <template #default="{ row }"><el-tag :type="row.status === 0 ? 'success' : 'danger'" size="small">{{ row.status === 0 ? '正常' : '冻结' }}</el-tag></template>
          </el-table-column>
          <el-table-column label="操作" width="280">
            <template #default="{ row }">
              <el-button size="small" @click="handleCredit(row.id)">信用分</el-button>
              <el-button size="small" :type="row.status === 0 ? 'warning' : 'success'" @click="handleFreeze(row.id)">冻结</el-button>
              <el-button size="small" :type="row.blacklisted ? 'danger' : 'info'" @click="handleBlacklist(row.id)">{{ row.blacklisted ? '已拉黑' : '拉黑' }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 数据统计 -->
      <el-tab-pane label="数据统计" name="stats">
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-num">{{ stats.totalPosts || 0 }}</div><div class="stat-label">总帖子</div></div>
          <div class="stat-card"><div class="stat-num">{{ stats.totalUsers || 0 }}</div><div class="stat-label">总用户</div></div>
          <div class="stat-card"><div class="stat-num">{{ stats.activePosts || 0 }}</div><div class="stat-label">进行中</div></div>
          <div class="stat-card"><div class="stat-num">{{ stats.completedPosts || 0 }}</div><div class="stat-label">已完结</div></div>
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
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.admin-page { max-width: 1100px; margin: 0 auto; padding: 24px 20px 32px; }
.hero-section { display: flex; justify-content: space-between; align-items: center; padding: 28px 32px; margin-bottom: 20px; background: #5a67d8; border-radius: 16px; color: #fff; }
.hero-title { font-size: 24px; font-weight: 700; margin: 0 0 4px; }
.hero-sub { margin: 0; opacity: 0.85; font-size: 14px; }
.back-btn { background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: #fff; font-size: 14px; border-radius: 8px; padding: 8px 18px; }
.back-btn:hover { background: rgba(255,255,255,0.35); }
.admin-tabs :deep(.el-tabs__header) { background: #fff; border-radius: 10px; padding: 0 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); margin-bottom: 12px; }
.post-filter-row { margin-bottom: 12px; }

/* Modern table */
.admin-tabs :deep(.el-table) { border-radius: 10px; overflow: hidden; }
.admin-tabs :deep(.el-table th) { background: #f9fafb; color: #6b7280; font-weight: 600; font-size: 13px; border: none; padding: 12px 16px; }
.admin-tabs :deep(.el-table td) { border-bottom: 1px solid #f3f4f6; padding: 10px 16px; font-size: 14px; }
.admin-tabs :deep(.el-table tr:last-child td) { border-bottom: none; }
.admin-tabs :deep(.el-table--striped .el-table__body tr.el-table__row--striped td) { background: #fafafa; }
.admin-tabs :deep(.el-table__body tr:hover td) { background: #f5f7fa; }
.admin-tabs :deep(.el-tabs__nav-wrap::after) { display: none; }

.s-capsule { padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; color: #fff; }
.sc-lost { background: #ef4444; }
.sc-found { background: #0891b2; }
.sc-0 { background: #3b82f6; } .sc-1, .sc-2 { background: #f59e0b; } .sc-3 { background: #86d3a4; } .sc-4, .sc-5 { background: #6b7280; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
.stat-card { background: #fff; border-radius: 10px; padding: 18px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.stat-num { font-size: 26px; font-weight: 700; color: #409eff; }
.stat-label { font-size: 12px; color: #909399; margin-top: 4px; }
.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.chart-card { background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.chart-card h4 { margin: 0 0 12px; color: #303133; font-size: 15px; font-weight: 600; }
.chart-box { width: 100%; height: 320px; }
</style>
