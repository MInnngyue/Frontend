<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyPosts } from '@/api/user'
import { deletePost, updatePost } from '@/api/post'
import { getCategories, getCategoryChildren } from '@/api/category'
import { ElMessage, ElMessageBox } from 'element-plus'

const router = useRouter()
const posts = ref([])
const loading = ref(false)
const saving = ref(false)

const categories = ref([])
const colors = ref([])
const campuses = ref([])
const areas = ref([])
const details = ref([])
let selectedCampusId = null
let selectedAreaId = null

const showEditDialog = ref(false)
const editForm = ref({
  id: null, type: 1, itemCategory: '', color: '', title: '', description: '',
  locationCampus: '', locationArea: '', locationDetail: '', lostTime: '', images: []
})

onMounted(async () => {
  await loadPosts()
  try {
    const [cats, cols, locs] = await Promise.all([
      getCategories('item_category'),
      getCategories('color'),
      getCategories('location')
    ])
    categories.value = cats.data || []
    colors.value = cols.data || []
    campuses.value = locs.data || []
  } catch {}
})

async function onCampusChange(name) {
  editForm.value.locationArea = ''
  editForm.value.locationDetail = ''
  areas.value = []
  details.value = []
  const campus = campuses.value.find(c => c.name === name)
  if (campus) {
    selectedCampusId = campus.id
    const res = await getCategoryChildren('location', campus.id)
    areas.value = res.data || []
  }
}

async function onAreaChange(name) {
  editForm.value.locationDetail = ''
  details.value = []
  const area = areas.value.find(c => c.name === name)
  if (area) {
    selectedAreaId = area.id
    const res = await getCategoryChildren('location', area.id)
    details.value = res.data || []
  }
}

async function openEdit(p) {
  editForm.value = {
    id: p.id, type: p.type, itemCategory: p.itemCategory || '', color: p.color || '',
    title: p.title || '', description: p.description || '',
    locationCampus: p.locationCampus || '', locationArea: p.locationArea || '',
    locationDetail: p.locationDetail || '',
    lostTime: (p.lostTime || '').substring(0, 10),
    images: []
  }
  showEditDialog.value = true
  areas.value = []
  details.value = []
  if (p.locationCampus) {
    const campus = campuses.value.find(c => c.name === p.locationCampus)
    if (campus) {
      selectedCampusId = campus.id
      const res = await getCategoryChildren('location', campus.id)
      areas.value = res.data || []
    }
    if (p.locationArea) {
      const area = areas.value.find(c => c.name === p.locationArea)
      if (area) {
        selectedAreaId = area.id
        const res = await getCategoryChildren('location', area.id)
        details.value = res.data || []
      }
    }
  }
}

async function saveEdit() {
  saving.value = true
  try {
    await updatePost(editForm.value.id, editForm.value)
    ElMessage.success('修改已保存')
    showEditDialog.value = false
    loadPosts()
  } catch {}
  finally { saving.value = false }
}

async function handleDelete(id) {
  try {
    await ElMessageBox.confirm('确定要删除该帖子吗？此操作不可撤销。', '确认删除', { type: 'warning' })
    await deletePost(id)
    ElMessage.success('已删除')
    loadPosts()
  } catch {}
}

function typeLabel(t) { return t === 0 ? '寻物' : '招领' }
function statusLabel(s) {
  const map = { 0: '进行中', 1: '已匹配', 2: '认领中', 3: '已完结', 4: '已归档', 5: '已下架' }
  return map[s] || '未知'
}
function goPost(id) { router.push(`/post/${id}`) }

async function loadPosts() {
  loading.value = true
  try { posts.value = (await getMyPosts({ page: 1, size: 100 })).data || [] }
  catch { posts.value = [] }
  finally { loading.value = false }
}
</script>

<template>
  <div class="page myposts-page">
    <div class="page-header">
      <div>
        <h1>我的帖子</h1>
        <p class="subtitle">管理你发布的帖子</p>
      </div>
      <button class="btn-secondary" @click="router.push('/profile')">返回个人中心</button>
    </div>

    <div class="card-wrap">
      <div class="bind-rings"><span></span><span></span><span></span></div>
      <div class="note-card table-card" v-loading="loading">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width:56px">ID</th>
              <th style="width:68px">类型</th>
              <th style="min-width:140px">标题</th>
              <th style="width:80px">状态</th>
              <th style="width:100px">时间</th>
              <th style="width:190px">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in posts" :key="row.id">
              <td class="td-id">{{ row.id }}</td>
              <td><span class="tag-type" :class="row.type === 0 ? 'lost' : 'found'">{{ typeLabel(row.type) }}</span></td>
              <td><div class="td-title">{{ row.title }}</div></td>
              <td><span class="tag-status" :class="'s-' + row.status">{{ statusLabel(row.status) }}</span></td>
              <td class="td-time">{{ (row.lostTime || '').replace('T', ' ')?.substring(0, 10) }}</td>
              <td class="td-actions">
                <button class="btn-icon" title="查看" @click="goPost(row.id)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--indigo)" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </button>
                <button class="btn-icon" title="编辑" @click="openEdit(row)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-500)" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="btn-icon" title="删除" @click="handleDelete(row.id)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--rose)" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-if="!loading && posts.length === 0" class="empty-state">
          <p class="empty-text">还没有发布过帖子</p>
          <button class="btn-primary" @click="router.push('/publish')">去发布帖子</button>
        </div>
      </div>
    </div>

    <el-dialog v-model="showEditDialog" title="编辑帖子" width="580px" :close-on-click-modal="false">
      <el-form label-width="80px" class="edit-form">
        <el-form-item label="类型">
          <el-radio-group v-model="editForm.type">
            <el-radio :value="0">寻物启事</el-radio>
            <el-radio :value="1">失物招领</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="标题">
          <el-input v-model="editForm.title" maxlength="200" placeholder="请输入帖子标题" />
        </el-form-item>
        <el-form-item label="物品分类">
          <el-select v-model="editForm.itemCategory" placeholder="选择物品分类" style="width:100%">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="颜色">
          <el-select v-model="editForm.color" placeholder="选择颜色" style="width:100%">
            <el-option v-for="c in colors" :key="c.id" :label="c.name" :value="c.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="地点" required>
          <div style="display:flex;gap:8px;width:100%">
            <el-select v-model="editForm.locationCampus" placeholder="校区" style="flex:1" @change="onCampusChange">
              <el-option v-for="c in campuses" :key="c.id" :label="c.name" :value="c.name" />
            </el-select>
            <el-select v-model="editForm.locationArea" placeholder="区域" style="flex:1" :disabled="!editForm.locationCampus" @change="onAreaChange">
              <el-option v-for="c in areas" :key="c.id" :label="c.name" :value="c.name" />
            </el-select>
            <el-select v-if="details.length > 0" v-model="editForm.locationDetail" placeholder="具体地点" style="flex:1">
              <el-option v-for="c in details" :key="c.id" :label="c.name" :value="c.name" />
            </el-select>
            <el-input v-else v-model="editForm.locationDetail" placeholder="具体地点" style="flex:1" :disabled="!editForm.locationArea" />
          </div>
        </el-form-item>
        <el-form-item label="时间">
          <el-date-picker v-model="editForm.lostTime" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" :rows="4" maxlength="2000" show-word-limit placeholder="请详细描述物品特征..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="saveEdit">保存修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.myposts-page { max-width: 960px; }

/* table inside note-card */
.table-card { padding: 0; overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.data-table th {
  text-align: left; padding: 14px; font-size: 13px; font-weight: 600;
  color: var(--ink-500); background: #f9fafb; border-bottom: 1px solid var(--page-edge); white-space: nowrap;
}
.data-table td { padding: 12px 14px; font-size: 14px; color: var(--ink-900); border-bottom: 1px solid #f3f4f6; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: #f9fafb; }

.td-id { font-family: var(--mono-font); color: var(--ink-300); font-size: 13px; }
.td-title { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.td-time { font-family: var(--mono-font); font-size: 13px; color: var(--ink-300); white-space: nowrap; }
.td-actions { display: flex; gap: 6px; flex-wrap: nowrap; }

/* edit form */
.edit-form { padding: 8px 0; max-height: 65vh; overflow-y: auto; }
</style>
