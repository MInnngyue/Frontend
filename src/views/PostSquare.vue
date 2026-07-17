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
const catExpanded = ref(false)

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

function onTabChange(type) { activeTab.value = type; queryParams.value.type = type; page.value = 1; fetchPosts() }
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
    <h1 class="page-title">失物广场</h1>

    <div class="main-layout">
      <aside class="sidebar">
        <div class="filter-card">
          <el-input v-model="queryParams.keyword" placeholder="搜索..." clearable :prefix-icon="Search" @keyup.enter="onSearch" @clear="onSearch" />
        </div>

        <div class="filter-card">
          <div class="section-title">类型</div>
          <div class="row-list">
            <div class="row-chip" :class="{ active: activeTab === null }" @click="onTabChange(null)">全部 <span v-if="activeTab === null" class="check"><span style="color:#111827;font-weight:700">✓</span></span></div>
            <div class="row-chip" :class="{ active: activeTab === 0 }" @click="onTabChange(0)">寻物 <span v-if="activeTab === 0" class="check"><span style="color:#111827;font-weight:700">✓</span></span></div>
            <div class="row-chip" :class="{ active: activeTab === 1 }" @click="onTabChange(1)">招领 <span v-if="activeTab === 1" class="check"><span style="color:#111827;font-weight:700">✓</span></span></div>
          </div>
        </div>

        <div class="filter-card">
          <div class="section-title">状态</div>
          <div class="row-list">
            <div class="row-chip" :class="{ active: queryParams.status === undefined }" @click="delete queryParams.status; page=1; fetchPosts()">全部 <span v-if="queryParams.status === undefined" class="check"><span style="color:#111827;font-weight:700">✓</span></span></div>
            <div class="row-chip" :class="{ active: queryParams.status === 0 }" @click="onFilterClick('status', 0)">进行中 <span v-if="queryParams.status === 0" class="check"><span style="color:#111827;font-weight:700">✓</span></span></div>
            <div class="row-chip" :class="{ active: queryParams.status === 1 }" @click="onFilterClick('status', 1)">已匹配 <span v-if="queryParams.status === 1" class="check"><span style="color:#111827;font-weight:700">✓</span></span></div>
            <div class="row-chip" :class="{ active: queryParams.status === 2 }" @click="onFilterClick('status', 2)">认领中 <span v-if="queryParams.status === 2" class="check"><span style="color:#111827;font-weight:700">✓</span></span></div>
            <div class="row-chip" :class="{ active: queryParams.status === 3 }" @click="onFilterClick('status', 3)">已完结 <span v-if="queryParams.status === 3" class="check"><span style="color:#111827;font-weight:700">✓</span></span></div>
          </div>
        </div>

        <div class="filter-card">
          <div class="section-title">分类</div>
          <div class="cat-list-wrap" :class="{ collapsed: !catExpanded && itemCategories.length > 5 }">
            <div class="row-list">
              <div v-for="c in (catExpanded ? itemCategories : itemCategories.slice(0, 5))" :key="c.id" class="row-chip" :class="{ active: queryParams.itemCategory === c.name }" @click="onFilterClick('itemCategory', c.name)">{{ c.name }} <span v-if="queryParams.itemCategory === c.name" class="check"><span style="color:#111827;font-weight:700">✓</span></span></div>
            </div>
            <div v-if="!catExpanded && itemCategories.length > 5" class="gradient-fade"></div>
          </div>
          <button v-if="itemCategories.length > 5" class="toggle-more-btn" @click="catExpanded = !catExpanded">
            {{ catExpanded ? '收起 ▲' : '更多 ▼' }}
          </button>
        </div>
      </aside>

      <section class="content-area" v-loading="loading">
        <div v-if="posts.length === 0 && !loading" class="empty-state">
          <p class="empty-text">广场暂时空空如也</p>
          <p class="empty-hint">发一条寻物或招领，帮自己也帮别人</p>
        </div>

        <div class="card-grid">
          <div v-for="post in posts" :key="post.id" class="card" :class="post.type === 0 ? 'card-lost' : 'card-found'" @click="goDetail(post.id)">
            <div class="card-pin" :class="post.type === 0 ? 'pin-lost' : 'pin-found'">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1 2.89-2.64l3.05 2.05a2 2 0 0 1-.14 3.5l-2.5 1.8a2 2 0 0 1-2.3-.1l-1.5-1.2a2 2 0 0 1-.5-2.6z"/><circle cx="12" cy="6" r="2.5"/></svg>
            </div>
            <div class="card-cover">
              <el-image v-if="post.coverImage" :src="imageUrl(post.coverImage)" fit="cover" />
              <div v-else class="cover-placeholder"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b0a690" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>
            </div>
            <div class="card-body">
              <span class="card-type-tag" :class="post.type === 0 ? 'lost' : 'found'">{{ typeLabel(post.type) }}</span>
              <span class="card-status-tag" :class="'s-' + post.status">{{ statusLabel(post.status) }}</span>
              <h3 class="card-title">{{ post.title || '无标题' }}</h3>
              <div class="card-meta">
                <span class="meta-capsule mc-cat">{{ post.itemCategory }}</span>
                <span class="meta-capsule mc-loc">{{ post.locationCampus }}</span>
                <span class="meta-capsule mc-time">{{ post.lostTime?.replace('T', ' ') }}</span>
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
.post-square { max-width: 1280px; margin: 0 auto; padding: 22px 24px 36px; background: #faf6ee; min-height: 100vh; }

.page-title { font-family: 'Noto Serif SC', Georgia, serif; font-size: 32px; font-weight: 700; color: #2d2a26; margin: 0 0 22px; text-align: center; }

.main-layout { display: flex; gap: 22px; align-items: flex-start; }

.sidebar {
  width: 320px; flex-shrink: 0; display: flex; flex-direction: column; gap: 11px;
}
.filter-card {
  background: #f3ecdb; border-radius: 8px; padding: 16px;
  border: 1px solid #d9cfb8;
}
.section-title {
  font-family: 'Noto Serif SC', Georgia, serif; font-size: 20px; font-weight: 700; color: #2d2a26; margin-bottom: 10px;
}
.row-list { display: flex; flex-direction: column; gap: 2px; }
.row-chip {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 14px; padding: 9px 14px; border-radius: 6px;
  cursor: pointer; background: #faf6ee; color: #5c5448;
  transition: all 0.15s; user-select: none;
}
.row-chip:hover { background: #f7ede9; color: #c8553d; }
.row-chip.active { background: #f7ede9; color: #c8553d; font-weight: 600; }
.row-chip:active { transform: scale(0.98); }
.row-chip .check { font-size: 14px; color: #c8553d; }

/* cat fold */
.cat-list-wrap { position: relative; overflow: hidden; }
.cat-list-wrap.collapsed { max-height: 240px; }
.gradient-fade {
  position: absolute; bottom: 0; left: 0; right: 0; height: 40px;
  background: linear-gradient(to bottom, transparent, #f3ecdb);
  pointer-events: none;
}
.toggle-more-btn {
  display: block; width: 100%; margin-top: 8px; padding: 6px 0;
  border: none; background: transparent; color: #c8553d; font-size: 13px;
  font-weight: 600; cursor: pointer; transition: color 0.15s;
}
.toggle-more-btn:hover { color: #a8442f; }

.content-area { flex: 1; min-height: 400px; }

.card-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 22px; }

/* sticky note card */
.card {
  background: #f3ecdb; border-radius: 6px; overflow: visible; cursor: pointer;
  border: 1px solid #d9cfb8;
  border-bottom: 3px solid #c4b896;
  transition: transform 0.2s, border-color 0.2s;
  position: relative;
}
.card:hover {
  transform: translateY(-3px);
  border-color: #c4b896;
  border-bottom-color: #a89770;
}
.card:active { transform: scale(0.99); }

/* pushpin */
.card-pin {
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #faf6ee;
  z-index: 2;
  border: 2px solid;
}
.pin-lost { background: #c8553d; border-color: #a8442f; }
.pin-found { background: #6b8e4e; border-color: #547039; }

.card-cover { width: 100%; height: 240px; background: #e8dfc6; overflow: hidden; }
.card-cover :deep(.el-image) { width: 100%; height: 100%; }
.card-cover :deep(.el-image img) { object-fit: cover; width: 100%; height: 100%; }
.cover-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 48px; color: #b0a690; }

.card-body { padding: 14px 16px 16px; }
.card-type-tag {
  display: inline-block; font-size: 12px; padding: 3px 10px; border-radius: 4px;
  font-weight: 600; margin-right: 6px;
}
.card-type-tag.lost { background: #f7ede9; color: #c8553d; border: 1px solid #e2a294; }
.card-type-tag.found { background: #e8efd9; color: #547039; border: 1px solid #b5cc97; }

.card-status-tag {
  display: inline-block; font-size: 12px; padding: 3px 10px; border-radius: 4px;
  font-weight: 600;
}
.s-0 { background: #f7ede9; color: #a8442f; }
.s-1, .s-2 { background: #f5ebd6; color: #8a6535; }
.s-3 { background: #e8efd9; color: #547039; }
.s-4, .s-5 { background: #e8dfc6; color: #8a8170; }

.card-title {
  font-size: 17px; font-weight: 600; color: #2d2a26; margin: 8px 0 2px;
  line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-meta { display: flex; align-items: center; gap: 6px; margin-top: 8px; flex-wrap: wrap; }

.meta-capsule {
  padding: 3px 10px; border-radius: 4px; font-size: 12px; font-weight: 500;
}
.mc-cat { background: #f7ede9; color: #c8553d; }
.mc-loc { background: #e8dfc6; color: #5c5448; }
.mc-time { background: #faf6ee; color: #8a8170; font-family: 'JetBrains Mono', 'Courier New', monospace; }

.empty-state { text-align: center; padding: 110px 0; }
.empty-text { font-size: 16px; color: #8a8170; margin: 0 0 6px; }
.empty-hint { font-size: 13px; color: #b0a690; margin: 0; }

.pagination { display: flex; justify-content: center; margin-top: 26px; }
</style>
