<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPosts } from '@/api/post'
import { getCategories } from '@/api/category'
import { imageUrl } from '@/utils/url'
import { Search } from '@element-plus/icons-vue'

const router = useRouter()
const posts = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(10)

const activeTab = ref(null)
const queryParams = ref({ type: null, itemCategory: '', keyword: '' })

const itemCategories = ref([])
const colors = ref([])
const campuses = ref([])
const sidebarOpen = ref(true)

onMounted(async () => {
  itemCategories.value = (await getCategories('item_category')).data
  colors.value = (await getCategories('color')).data
  campuses.value = (await getCategories('location')).data
  fetchPosts()
})

async function fetchPosts() {
  loading.value = true
  try {
    const params = { ...queryParams.value, page: page.value, pageSize: pageSize.value }
    Object.keys(params).forEach(k => {
      if (params[k] === '' || params[k] === null) delete params[k]
    })
    const res = await getPosts(params)
    posts.value = res.data.records
    total.value = res.data.total
  } finally { loading.value = false }
}

function onTabChange(type) { queryParams.value.type = type; page.value = 1; fetchPosts() }
function onSearch() { page.value = 1; fetchPosts() }
function onCategoryChange() { page.value = 1; fetchPosts() }
function onFilterClick(key, val) {
  queryParams.value[key] = queryParams.value[key] === val ? '' : val
  page.value = 1; fetchPosts()
}
function goDetail(id) { router.push(`/post/${id}`) }
function goPublish() { router.push('/publish') }
function onPageChange(p) { page.value = p; fetchPosts() }
function typeLabel(type) { return type === 0 ? '寻物启事' : '失物招领' }
function statusLabel(status) {
  const map = { 0: '进行中', 1: '已匹配', 2: '认领中', 3: '已完结', 4: '已过期', 5: '已下架' }
  return map[status] || '未知'
}
</script>

<template>
  <div class="post-square">
    <!-- Hero -->
    <div class="hero-section">
      <div class="hero-left">
        <h1 class="hero-title">失物广场</h1>
        <p class="hero-sub">找到你遗失的物品，或帮助他人找回失物</p>
      </div>
      <el-button class="publish-btn" @click="goPublish">
        <span style="font-size:18px;margin-right:4px">+</span> 发布帖子
      </el-button>
    </div>

    <div class="main-layout">
      <!-- 左侧筛选栏 -->
      <aside class="sidebar" :class="{ collapsed: !sidebarOpen }">
        <div class="sidebar-toggle" @click="sidebarOpen = !sidebarOpen">
          {{ sidebarOpen ? '◀ 收起' : '▶' }}
        </div>
        <div v-if="sidebarOpen" class="sidebar-content">
          <!-- 类型 -->
          <div class="filter-group">
            <div class="filter-label">帖子类型</div>
            <div class="filter-tags">
              <span class="filter-tag" :class="{ active: activeTab === null }" @click="onTabChange(null)">全部</span>
              <span class="filter-tag" :class="{ active: activeTab === 0 }" @click="onTabChange(0)">寻物</span>
              <span class="filter-tag" :class="{ active: activeTab === 1 }" @click="onTabChange(1)">招领</span>
            </div>
          </div>

          <!-- 物品大类 -->
          <div class="filter-group">
            <div class="filter-label">物品大类</div>
            <div class="filter-tags">
              <span
                v-for="c in itemCategories" :key="c.id"
                class="filter-tag"
                :class="{ active: queryParams.itemCategory === c.name }"
                @click="onFilterClick('itemCategory', c.name)"
              >{{ c.name }}</span>
            </div>
          </div>

          <!-- 搜索 -->
          <div class="filter-group">
            <div class="filter-label">关键词</div>
            <el-input v-model="queryParams.keyword" placeholder="搜索..." clearable size="small" :prefix-icon="Search" @keyup.enter="onSearch" @clear="onSearch" />
          </div>

          <el-button size="small" type="primary" @click="onSearch" style="width:100%;margin-top:8px">搜索</el-button>
        </div>
      </aside>

      <!-- 右侧帖子网格 -->
      <section class="post-grid" v-loading="loading">
        <div v-if="posts.length === 0 && !loading" class="empty-state">
          <div class="empty-icon">📋</div>
          <p class="empty-text">还没有帖子</p>
          <p class="empty-hint">成为第一个发布寻物或招领信息的人吧</p>
        </div>

        <div class="grid-cards">
          <div
            v-for="post in posts" :key="post.id"
            class="grid-card" @click="goDetail(post.id)"
          >
            <div class="card-img">
              <el-image v-if="post.coverImage" :src="imageUrl(post.coverImage)" fit="cover" />
              <div v-else class="card-img-placeholder">📷</div>
              <!-- 胶囊覆盖层 -->
              <div class="card-overlays">
                <span class="overlay-tag overlay-type" :class="post.type === 0 ? 'lost' : 'found'">
                  {{ typeLabel(post.type) }}
                </span>
                <span class="overlay-tag overlay-item">{{ post.itemCategory }}</span>
              </div>
            </div>
            <div class="card-info">
              <div class="card-title">{{ post.title || '无标题' }}</div>
              <div class="card-sub">
                <div class="sub-left">
                  <span>{{ post.color }}</span>
                  <span class="dot">·</span>
                  <span>{{ post.locationCampus }}</span>
                  <span class="dot">·</span>
                  <span class="time-text">{{ post.lostTime }}</span>
                </div>
                <span class="status-capsule" :class="'status-' + post.status">{{ statusLabel(post.status) }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="total > pageSize" class="pagination">
          <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="page" @current-change="onPageChange" />
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.post-square { max-width: 1100px; margin: 0 auto; padding: 24px 20px 32px; }

/* Hero */
.hero-section {
  display: flex; justify-content: space-between; align-items: center;
  padding: 28px 32px; margin-bottom: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px; color: #fff;
}
.hero-title { font-size: 26px; font-weight: 700; margin: 0 0 6px; letter-spacing: 0.5px; }
.hero-sub { margin: 0; opacity: 0.85; font-size: 14px; }
.publish-btn {
  background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3);
  color: #fff; font-size: 15px; border-radius: 8px; padding: 10px 24px; transition: all 0.2s;
}
.publish-btn:hover { background: rgba(255,255,255,0.35); border-color: rgba(255,255,255,0.5); color: #fff; }

/* Layout */
.main-layout { display: flex; gap: 20px; align-items: flex-start; }

/* Sidebar */
.sidebar {
  width: 240px; flex-shrink: 0; background: #fff; border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04); padding: 12px;
  position: sticky; top: 72px; transition: width 0.2s;
}
.sidebar.collapsed { width: 40px; padding: 8px; }
.sidebar-toggle { font-size: 12px; color: #909399; cursor: pointer; text-align: right; margin-bottom: 8px; }
.sidebar-content { display: flex; flex-direction: column; gap: 4px; }
.filter-group { margin-bottom: 12px; }
.filter-label { font-size: 13px; font-weight: 600; color: #303133; margin-bottom: 6px; }
.filter-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.filter-tag {
  font-size: 12px; padding: 3px 10px; border-radius: 12px; cursor: pointer;
  background: #f5f7fa; color: #606266; transition: all 0.15s; white-space: nowrap;
}
.filter-tag:hover { background: #ecf5ff; color: #409eff; }
.filter-tag.active { background: #409eff; color: #fff; }

/* Grid */
.post-grid { flex: 1; min-height: 300px; }
.grid-cards { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }

.grid-card {
  background: #fff; border-radius: 12px; overflow: hidden; cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04); transition: transform 0.2s, box-shadow 0.2s;
}
.grid-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.08); }

.card-img {
  position: relative; width: 100%; height: 200px; overflow: hidden;
  background: #f0f2f5;
}
.card-img .el-image { width: 100%; height: 100%; }
.card-img-placeholder {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  font-size: 40px; color: #dcdfe6;
}

.card-overlays {
  position: absolute; top: 10px; left: 10px; right: 10px;
  display: flex; justify-content: space-between;
}
.overlay-tag {
  padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; color: #fff;
}
.overlay-type.lost { background: #f56c6c; }
.overlay-type.found { background: #67c23a; }
.overlay-item { background: rgba(0,0,0,0.55); }

.status-capsule {
  padding: 3px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; color: #fff; white-space: nowrap;
}
.status-0 { background: #409eff; }
.status-1 { background: #e6a23c; }
.status-2 { background: #e6a23c; }
.status-3 { background: #67c23a; }
.status-4 { background: #909399; }
.status-5 { background: #f56c6c; }

.card-info { padding: 14px 16px; }
.card-title {
  font-size: 15px; font-weight: 600; color: #303133; margin-bottom: 6px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.card-sub { font-size: 12px; color: #909399; display: flex; justify-content: space-between; align-items: center; }
.sub-left { display: flex; gap: 4px; align-items: center; }
.dot { color: #dcdfe6; }
.time-text { color: #409eff; font-weight: 500; }

/* Empty & Pagination */
.empty-state { padding: 100px 0; text-align: center; }
.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-text { font-size: 16px; color: #606266; margin: 0 0 4px; }
.empty-hint { font-size: 13px; color: #c0c4cc; margin: 0; }
.pagination { display: flex; justify-content: center; margin-top: 24px; }
</style>
