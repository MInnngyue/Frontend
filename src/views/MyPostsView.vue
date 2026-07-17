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

// 字典数据
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
  } catch { /* ignore */ }
})

// 校区变化 → 加载区域
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

// 区域变化 → 加载具体地点
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

// 打开编辑时，如果已有校区信息，预加载下属数据
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

  // 预加载已有的校区下属区域
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
  } catch { }
  finally { saving.value = false }
}

async function handleDelete(id) {
  try {
    await ElMessageBox.confirm('确定要删除该帖子吗？此操作不可撤销。', '确认删除', { type: 'warning' })
    await deletePost(id)
    ElMessage.success('已删除')
    loadPosts()
  } catch { /* 取消或失败 */ }
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
  <div class="myposts-page">
    <div class="mp-header">
      <h1 class="page-title">我的帖子</h1>
      <button class="btn-back" @click="router.push('/profile')">← 返回个人中心</button>
    </div>

    <div class="table-wrap" v-loading="loading">
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
            <td><span class="type-badge" :class="row.type === 0 ? 't-lost' : 't-found'">{{ typeLabel(row.type) }}</span></td>
            <td><div class="td-title">{{ row.title }}</div></td>
            <td><span class="status-badge" :class="'s-' + row.status">{{ statusLabel(row.status) }}</span></td>
            <td class="td-time">{{ (row.lostTime || '').replace('T', ' ')?.substring(0, 10) }}</td>
            <td class="td-actions">
              <button class="btn btn-view" @click="goPost(row.id)">查看</button>
              <button class="btn btn-edit" @click="openEdit(row)">编辑</button>
              <button class="btn btn-del" @click="handleDelete(row.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="!loading && posts.length === 0" class="empty-state">
        <div class="empty-icon" style="font-size:48px;color:var(--ink-300);">—</div>
        <div class="empty-title">还没有发布过帖子</div>
        <button class="empty-btn" @click="router.push('/publish')">去发布帖子</button>
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
          <el-date-picker
            v-model="editForm.lostTime"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width:100%"
          />
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
.myposts-page { max-width: 960px; margin: 0 auto; padding: 22px 24px 36px; background: var(--page); min-height: 100vh; }
.mp-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0; }
.mp-header h1 { font-family: 'Noto Serif SC', Georgia, serif; font-size: 32px; font-weight: 700; color: var(--ink-900); margin: 0 0 22px; text-align: center; }
.btn-back {
  padding: 8px 18px; border: 1px solid var(--page-edge); border-radius: 6px; background: var(--page);
  font-size: 14px; color: var(--ink-700); cursor: pointer; transition: all 0.15s;
}
.btn-back:hover { background: #f3f4f6; border-color: #cbd5e1; color: var(--ink-900); }

/* Table */
.table-wrap { background: var(--page); border-radius: 6px; border: 1px solid #cbd5e1; border-bottom: 3px solid #cbd5e1; overflow: hidden; }
.data-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.data-table th {
  text-align: left; padding: 14px 14px; font-size: 13px; font-weight: 600;
  color: var(--ink-500); background: #f3f4f6; border-bottom: 1px solid var(--page-edge); white-space: nowrap;
}
.data-table td { padding: 12px 14px; font-size: 14px; color: var(--ink-900); border-bottom: 1px solid #f3f4f6; }
.data-table tr:last-child td { border-bottom: none; }
.data-table tr:hover td { background: #f3f4f6; }
.td-id { font-family: 'JetBrains Mono', 'Courier New', monospace; color: var(--ink-300); font-size: 13px; }
.td-title { max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.td-time { font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 13px; color: var(--ink-300); white-space: nowrap; }
.td-actions { display: flex; gap: 6px; flex-wrap: nowrap; }

/* Badges */
.type-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; color: #fff; white-space: nowrap; }
.t-lost { background: var(--rose); }
.t-found { background: var(--moss); }
.status-badge { display: inline-block; padding: 3px 10px; border-radius: 6px; font-size: 12px; font-weight: 600; white-space: nowrap; }
.s-0 { background: var(--indigo-light); color: var(--indigo); }
.s-1 { background: var(--amber-light); color: var(--amber); }
.s-2 { background: var(--amber-light); color: var(--amber); }
.s-3 { background: var(--moss-light); color: var(--moss); }
.s-4, .s-5 { background: #f3f4f6; color: var(--ink-500); }

/* Buttons */
.btn { padding: 6px 14px; border: none; border-radius: 6px; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.btn-view { background: var(--indigo-light); color: var(--indigo); }
.btn-view:hover { background: #eedfd9; }
.btn-edit { background: var(--indigo-light); color: var(--indigo-hover); }
.btn-edit:hover { background: #eedfd9; }
.btn-del { background: var(--indigo-light); color: var(--rose); }
.btn-del:hover { background: #eedfd9; }

/* Empty */
.empty-state { text-align: center; padding: 60px 20px; }
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-title { font-size: 16px; font-weight: 600; color: var(--ink-900); margin-bottom: 8px; }
.empty-btn { padding: 10px 24px; background: var(--indigo); color: #fff; border: none; border-radius: 6px; font-size: 14px; font-weight: 600; cursor: pointer; margin-top: 12px; }
.empty-btn:hover { background: var(--indigo-hover); }

/* Dialog */
.edit-form { padding: 8px 0; max-height: 65vh; overflow-y: auto; }
:deep(.el-dialog) { border-radius: 6px; overflow: hidden; }
:deep(.el-dialog__title) { font-family: 'Noto Serif SC', Georgia, serif; font-size: 17px; font-weight: 700; color: var(--ink-900); }
:deep(.el-dialog .el-input__wrapper) { border-radius: 6px; box-shadow: 0 0 0 1px var(--page-edge) inset; }
:deep(.el-dialog .el-select .el-input__wrapper) { border-radius: 6px; box-shadow: 0 0 0 1px var(--page-edge) inset; }
:deep(.el-dialog .el-date-editor .el-input__wrapper) { border-radius: 6px; box-shadow: 0 0 0 1px var(--page-edge) inset; }
:deep(.el-dialog .el-button--primary) { background: var(--indigo); border-color: var(--indigo); border-radius: 6px; font-weight: 600; }
:deep(.el-dialog .el-button--primary:hover) { background: var(--indigo-hover); border-color: var(--indigo-hover); }
:deep(.el-dialog .el-button) { border-radius: 6px; }
</style>
