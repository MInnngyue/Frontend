<script setup>
import { ref, onMounted } from 'vue'
import { getPendingPosts, approvePost, rejectPost, getUsers, freezeUser, adjustCredit, getDict, addDict, updateDict, deleteDict, getStats } from '@/api/admin'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('review')
const posts = ref([])
const users = ref([])
const dictType = ref('item_category')
const dictItems = ref([])
const stats = ref({})
const loading = ref(false)

onMounted(() => {
  loadStats()
  loadPendingPosts()
})

async function loadPendingPosts(status) {
  loading.value = true
  const res = await getPendingPosts({ reviewStatus: status ?? undefined })
  posts.value = res.data.records
  loading.value = false
}

async function handleApprove(id) {
  await approvePost(id)
  ElMessage.success('已通过')
  loadPendingPosts()
}

async function handleReject(id) {
  const { value } = await ElMessageBox.prompt('拒绝原因', '审核拒绝', { inputValue: '违规内容' }).catch(() => {})
  if (!value) return
  await rejectPost(id, value)
  ElMessage.success('已拒绝')
  loadPendingPosts()
}

async function loadUsers() {
  loading.value = true
  const res = await getUsers({ page: 1, size: 50 })
  users.value = res.data.records
  loading.value = false
}

async function handleFreeze(id) {
  await freezeUser(id)
  ElMessage.success('已切换状态')
  loadUsers()
}

async function handleCredit(id) {
  const { value } = await ElMessageBox.prompt('增减分数（正数加分，负数扣分）', '调整信用分', { inputValue: '5' }).catch(() => {})
  if (!value) return
  await adjustCredit(id, parseInt(value))
  ElMessage.success('已调整')
  loadUsers()
}

async function loadDict() {
  const res = await getDict(dictType.value)
  dictItems.value = res.data
}

async function handleAddDict() {
  const { value } = await ElMessageBox.prompt('名称', '新增字典项').catch(() => {})
  if (!value) return
  await addDict({ type: dictType.value, name: value, parentId: 0, sortOrder: 0, status: 1 })
  ElMessage.success('已添加')
  loadDict()
}

async function handleUpdateDict(item) {
  const { value } = await ElMessageBox.prompt('新名称', '修改', { inputValue: item.name }).catch(() => {})
  if (!value) return
  await updateDict(item.id, { name: value })
  ElMessage.success('已更新')
  loadDict()
}

async function handleDeleteDict(id) {
  await ElMessageBox.confirm('确定删除？', '确认', { type: 'warning' })
  await deleteDict(id)
  ElMessage.success('已删除')
  loadDict()
}

async function loadStats() {
  stats.value = (await getStats()).data
}

function onTabChange(tab) {
  if (tab === 'review') loadPendingPosts()
  else if (tab === 'users') loadUsers()
  else if (tab === 'dict') loadDict()
  else if (tab === 'stats') loadStats()
}
</script>

<template>
  <div class="admin-page">
    <div class="hero-section">
      <h1 class="hero-title">管理后台</h1>
      <p class="hero-sub">帖子审核 · 用户管理 · 数据字典 · 数据统计</p>
    </div>

    <el-tabs v-model="activeTab" @tab-change="onTabChange" class="admin-tabs">
      <!-- 审核 -->
      <el-tab-pane label="帖子审核" name="review">
        <div class="filter-row" style="margin-bottom:12px">
          <el-button size="small" @click="loadPendingPosts(0)" type="warning">待审核</el-button>
          <el-button size="small" @click="loadPendingPosts(1)">已通过</el-button>
          <el-button size="small" @click="loadPendingPosts(2)">已拒绝</el-button>
          <el-button size="small" @click="loadPendingPosts()">全部</el-button>
        </div>
        <el-table :data="posts" v-loading="loading" border stripe>
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="title" label="标题" />
          <el-table-column label="审核状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.reviewStatus === 1 ? 'success' : row.reviewStatus === 2 ? 'danger' : 'warning'" size="small">
                {{ row.reviewStatus === 1 ? '已通过' : row.reviewStatus === 2 ? '已拒绝' : '待审核' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="{ row }">
              <el-button v-if="row.reviewStatus !== 1" size="small" type="success" @click="handleApprove(row.id)">通过</el-button>
              <el-button v-if="row.reviewStatus !== 2" size="small" type="danger" @click="handleReject(row.id)">拒绝</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 用户管理 -->
      <el-tab-pane label="用户管理" name="users">
        <el-table :data="users" v-loading="loading" border stripe>
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="username" label="用户名" />
          <el-table-column prop="nickname" label="昵称" />
          <el-table-column prop="creditScore" label="信用分" width="80" />
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.status === 0 ? 'success' : 'danger'" size="small">
                {{ row.status === 0 ? '正常' : '已冻结' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220">
            <template #default="{ row }">
              <el-button size="small" @click="handleCredit(row.id)">信用分</el-button>
              <el-button size="small" :type="row.status === 0 ? 'warning' : 'success'" @click="handleFreeze(row.id)">
                {{ row.status === 0 ? '冻结' : '解冻' }}
              </el-button>
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
            <el-option label="地点" value="location" />
          </el-select>
          <el-button size="small" type="primary" @click="handleAddDict">+ 新增</el-button>
        </div>
        <el-table :data="dictItems" border stripe>
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="sortOrder" label="排序" width="80" />
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <el-button size="small" @click="handleUpdateDict(row)">编辑</el-button>
              <el-button size="small" type="danger" @click="handleDeleteDict(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 统计 -->
      <el-tab-pane label="数据统计" name="stats">
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-num">{{ stats.totalPosts || 0 }}</div><div class="stat-label">总帖子</div></div>
          <div class="stat-card"><div class="stat-num">{{ stats.totalUsers || 0 }}</div><div class="stat-label">总用户</div></div>
          <div class="stat-card"><div class="stat-num">{{ stats.activePosts || 0 }}</div><div class="stat-label">进行中</div></div>
          <div class="stat-card"><div class="stat-num">{{ stats.completedPosts || 0 }}</div><div class="stat-label">已完结</div></div>
          <div class="stat-card"><div class="stat-num">{{ stats.pendingReviews || 0 }}</div><div class="stat-label">待审核</div></div>
        </div>
        <div style="margin-top:20px" v-if="stats.categoryDistribution">
          <h4>物品分类分布</h4>
          <div class="cat-bars">
            <div v-for="c in stats.categoryDistribution" :key="c.name" class="cat-bar-item">
              <span class="cat-name">{{ c.name }}</span>
              <div class="cat-bar"><div class="cat-fill" :style="{ width: Math.max(2, (c.count / Math.max(1, stats.totalPosts)) * 100) + '%' }"></div></div>
              <span class="cat-count">{{ c.count }}</span>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.admin-page { max-width: 1000px; margin: 0 auto; padding: 32px 20px; }
.hero-section { padding: 28px 32px; margin-bottom: 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px; color: #fff; }
.hero-title { font-size: 26px; font-weight: 700; margin: 0 0 6px; }
.hero-sub { margin: 0; opacity: 0.85; font-size: 14px; }
.admin-tabs :deep(.el-tabs__header) { background: #fff; border-radius: 12px; padding: 0 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); margin-bottom: 12px; }
.stats-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
.stat-card { background: #fff; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.stat-num { font-size: 28px; font-weight: 700; color: #409eff; }
.stat-label { font-size: 12px; color: #909399; margin-top: 4px; }
.cat-bars { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
.cat-bar-item { display: flex; align-items: center; gap: 10px; }
.cat-name { width: 80px; font-size: 13px; color: #606266; text-align: right; }
.cat-bar { flex: 1; height: 20px; background: #f0f2f5; border-radius: 10px; overflow: hidden; }
.cat-fill { height: 100%; background: linear-gradient(90deg, #409eff, #66b1ff); border-radius: 10px; transition: width 0.5s; }
.cat-count { width: 30px; font-size: 13px; color: #909399; }
.filter-row { display: flex; gap: 8px; }
</style>
