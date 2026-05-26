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
const pageSize = ref(20)

const activeTab = ref(null)
const queryParams = ref({ type: null, itemCategory: '', keyword: '' })

const itemCategories = ref([])

onMounted(async () => {
  itemCategories.value = (await getCategories('item_category')).data
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
function onFilterClick(key, val) {
  if (queryParams.value[key] === val) { delete queryParams.value[key] }
  else { queryParams.value[key] = val }
  page.value = 1; fetchPosts()
}
function goDetail(id) { router.push(`/post/${id}`) }
function goPublish() { router.push('/publish') }
function onPageChange(p) { page.value = p; fetchPosts() }
function typeLabel(type) { return type === 0 ? '寻物启事' : '失物招领' }
function statusLabel(status) {
  const map = { 0: '进行中', 1: '已匹配', 2: '认领中', 3: '已完结', 4: '已归档', 5: '已下架' }
  return map[status] || '未知'
}
</script>

<template>
  <div class="post-square">
    <!-- 标题栏 -->
    <div class="title-bar">
      <h1 class="page-title">失物广场</h1>
    </div>

    <div class="main-layout">
      <!-- 左侧筛选栏 -->
      <aside class="sidebar">
        <!-- 搜索 -->
        <div class="filter-section">
          <el-input v-model="queryParams.keyword" placeholder="搜索..." clearable :prefix-icon="Search" @keyup.enter="onSearch" @clear="onSearch" />
        </div>

        <!-- 类型 -->
        <div class="filter-section">
          <div class="section-title">类型</div>
          <div class="section-body">
            <span class="chip" :class="{ active: activeTab === null }" @click="onTabChange(null)">全部</span>
            <span class="chip" :class="{ active: activeTab === 0 }" @click="onTabChange(0)">寻物</span>
            <span class="chip" :class="{ active: activeTab === 1 }" @click="onTabChange(1)">招领</span>
          </div>
        </div>

        <!-- 状态 -->
        <div class="filter-section">
          <div class="section-title">状态</div>
          <div class="section-body">
            <span class="chip" :class="{ active: queryParams.status === undefined }" @click="delete queryParams.status; page=1; fetchPosts()">全部</span>
            <span class="chip" :class="{ active: queryParams.status === 0 }" @click="onFilterClick('status', 0)">进行中</span>
            <span class="chip" :class="{ active: queryParams.status === 1 }" @click="onFilterClick('status', 1)">已匹配</span>
            <span class="chip" :class="{ active: queryParams.status === 2 }" @click="onFilterClick('status', 2)">认领中</span>
            <span class="chip" :class="{ active: queryParams.status === 3 }" @click="onFilterClick('status', 3)">已完结</span>
          </div>
        </div>

        <!-- 物品大类 -->
        <div class="filter-section">
          <div class="section-title">分类</div>
          <div class="section-body">
            <span
              v-for="c in itemCategories" :key="c.id"
              class="chip"
              :class="{ active: queryParams.itemCategory === c.name }"
              @click="onFilterClick('itemCategory', c.name)"
            >{{ c.name }}</span>
          </div>
        </div>
      </aside>

      <!-- 右侧卡片区 -->
      <section class="content-area" v-loading="loading">
        <div v-if="posts.length === 0 && !loading" class="empty-state">
          <p class="empty-text">还没有帖子</p>
          <p class="empty-hint">成为第一个发布寻物或招领信息的人吧</p>
        </div>

        <div class="card-grid">
          <div v-for="post in posts" :key="post.id" class="card" @click="goDetail(post.id)">
            <div class="card-cover">
              <el-image v-if="post.coverImage" :src="imageUrl(post.coverImage)" fit="cover" />
              <div v-else class="cover-placeholder">📷</div>
            </div>
            <div class="card-body">
              <span class="card-type-tag" :class="post.type === 0 ? 'lost' : 'found'">{{ typeLabel(post.type) }}</span>
              <span class="card-status-tag" :class="'s-' + post.status">{{ statusLabel(post.status) }}</span>
              <h3 class="card-title">{{ post.title || '无标题' }}</h3>
              <div class="card-meta">
                <span class="meta-capsule mc-cat">{{ post.itemCategory }}</span>
                <span class="meta-capsule mc-loc">{{ post.locationCampus }}</span>
                <span class="meta-capsule mc-time">{{ post.lostTime }}</span>
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
.post-square { max-width: 1280px; margin: 0 auto; padding: 20px 24px 32px; }

/* Title Bar */
.title-bar { margin-bottom: 24px; }
.page-title { font-size: 56px; font-weight: 800; color: #111827; margin: 0 0 12px; text-align: center; }

/* Layout */
.main-layout { display: flex; gap: 24px; align-items: flex-start; }

/* Sidebar */
.sidebar {
  width: 260px; flex-shrink: 0; background: #fff; border-radius: 10px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04); padding: 16px;
  position: sticky; top: 72px;
}
.filter-section { margin-bottom: 18px; }
.filter-section:last-child { margin-bottom: 0; }
.section-title {
  font-size: 13px; font-weight: 700; color: #374151; margin-bottom: 10px;
  text-transform: uppercase; letter-spacing: 0.5px;
}
.section-body { display: flex; flex-wrap: wrap; gap: 6px; }
.chip {
  display: inline-block; font-size: 13px; padding: 5px 14px; border-radius: 8px;
  cursor: pointer; background: #f3f4f6; color: #4b5563;
  transition: all 0.15s; user-select: none;
}
.chip:hover { background: #e5e7eb; }
.chip.active { background: #3b82f6; color: #fff; }

/* Content */
.content-area { flex: 1; min-height: 400px; }

/* Cards */
.card-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }

.card {
  background: #fff; border-radius: 10px; overflow: hidden; cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06); border: 1px solid #d6d0ca;
  transition: box-shadow 0.15s, transform 0.15s;
}
.card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-1px); }

.card-cover { width: 100%; height: 240px; background: #f9fafb; overflow: hidden; }
.card-cover :deep(.el-image) { width: 100%; height: 100%; }
.card-cover :deep(.el-image img) { object-fit: cover; width: 100%; height: 100%; }
.cover-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 48px; }

.card-body { padding: 12px 16px; }
.card-type-tag {
  display: inline-block; font-size: 12px; padding: 3px 12px; border-radius: 20px;
  font-weight: 600; color: #fff; margin-right: 6px;
}
.card-type-tag.lost { background: #ef4444; }
.card-type-tag.found { background: #22c55e; }

.card-status-tag {
  display: inline-block; font-size: 11px; padding: 3px 10px; border-radius: 20px;
  font-weight: 500; color: #fff;
}
.s-0 { background: #3b82f6; }
.s-1, .s-2 { background: #f59e0b; }
.s-3 { background: #22c55e; }
.s-4, .s-5 { background: #6b7280; }

.card-title {
  font-size: 15px; font-weight: 600; color: #111827; margin: 4px 0 0;
  line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta { display: flex; align-items: center; gap: 6px; margin-top: 2px; }

.meta-capsule {
  padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; color: #fff;
}
.mc-cat { background: #6366f1; }
.mc-loc { background: #8b5cf6; }
.mc-time { background: #f59e0b; }

/* Empty */
.empty-state { text-align: center; padding: 120px 0; }
.empty-text { font-size: 16px; color: #6b7280; margin: 0 0 6px; }
.empty-hint { font-size: 13px; color: #9ca3af; margin: 0; }

/* Pagination */
.pagination { display: flex; justify-content: center; margin-top: 28px; }
</style>
