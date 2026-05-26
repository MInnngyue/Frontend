<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
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

onMounted(() => { loadAllPosts(); loadStats() })

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
        <el-tabs type="card" style="margin-top:-8px">
          <el-tab-pane :label="'待审核 (' + posts.length + ')'">
            <el-table :data="posts" v-loading="loading" border stripe max-height="500">
              <el-table-column prop="id" label="ID" width="60" />
              <el-table-column label="类型" width="75">
                <template #default="{ row }"><span class="s-capsule" :class="row.type === 0 ? 'sc-lost' : 'sc-found'">{{ row.type === 0 ? '寻物' : '招领' }}</span></template>
              </el-table-column>
              <el-table-column prop="title" label="标题" />
              <el-table-column label="操作" width="140">
                <template #default="{ row }"><el-button size="small" type="success" @click="handleApprove(row.id)">通过</el-button><el-button size="small" type="danger" @click="handleReject(row.id)">拒绝</el-button></template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
          <el-tab-pane label="全部帖子">
            <el-table :data="allPosts" v-loading="loading" border stripe max-height="500">
              <el-table-column prop="id" label="ID" width="60" />
              <el-table-column label="类型" width="75">
                <template #default="{ row }"><span class="s-capsule" :class="row.type === 0 ? 'sc-lost' : 'sc-found'">{{ row.type === 0 ? '寻物' : '招领' }}</span></template>
              </el-table-column>
              <el-table-column prop="title" label="标题" />
              <el-table-column label="状态" width="90">
                <template #default="{ row }"><span class="s-capsule" :class="'sc-' + row.status">{{ statusLabel(row.status) }}</span></template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template #default="{ row }"><el-button v-if="row.status !== 4 && row.status !== 5" size="small" type="warning" @click="handleArchivePost(row.id)">归档</el-button><span v-else style="color:#c0c4cc;font-size:12px">已归档</span></template>
              </el-table-column>
            </el-table>
          </el-tab-pane>
        </el-tabs>
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
        <div class="chart-section" v-if="stats.categoryDistribution">
          <h4>物品分类分布</h4>
          <div class="bar-chart">
            <div v-for="c in stats.categoryDistribution" :key="c.name" class="bar-row">
              <span class="bar-label">{{ c.name }}</span>
              <div class="bar-track"><div class="bar-fill" :style="{ height: Math.max(4, (c.count / Math.max(1, stats.totalPosts || 1)) * 200) + 'px' }"></div></div>
              <span class="bar-num">{{ c.count }}</span>
            </div>
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
.s-capsule { padding: 3px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; color: #fff; }
.sc-lost { background: #ef4444; }
.sc-found { background: #0891b2; }
.sc-0 { background: #3b82f6; } .sc-1, .sc-2 { background: #f59e0b; } .sc-3 { background: #86d3a4; } .sc-4, .sc-5 { background: #6b7280; }
.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
.stat-card { background: #fff; border-radius: 10px; padding: 18px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.stat-num { font-size: 26px; font-weight: 700; color: #409eff; }
.stat-label { font-size: 12px; color: #909399; margin-top: 4px; }
.chart-section { background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.chart-section h4 { margin: 0 0 16px; color: #303133; }
.bar-chart { display: flex; align-items: flex-end; gap: 16px; height: 240px; padding: 0 4px; }
.bar-row { display: flex; flex-direction: column; align-items: center; gap: 6px; flex: 1; }
.bar-label { font-size: 12px; color: #606266; white-space: nowrap; }
.bar-track { width: 100%; height: 200px; display: flex; align-items: flex-end; justify-content: center; background: #f5f6f8; border-radius: 6px; }
.bar-fill { width: 32px; background: #409eff; border-radius: 4px 4px 0 0; min-height: 4px; transition: height 0.4s; }
.bar-num { font-size: 12px; color: #909399; font-weight: 600; }
</style>
