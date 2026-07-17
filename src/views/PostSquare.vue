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
function statusDotClass(status) {
  if (status === 0) return 'dot-active'
  if (status === 1 || status === 2) return 'dot-claiming'
  if (status === 3) return 'dot-done'
  return 'dot-archived'
}
</script>

<template>
  <div class="post-square">
    <!-- bulletin board header banner -->
    <div class="board-banner">
      <div class="banner-left">
        <h1 class="page-title">失物广场</h1>
        <p class="page-subtitle">在这里找到你丢失的，或拾到他人遗失的</p>
      </div>
      <div class="banner-right">
        <div class="stat-block">
          <span class="stat-num">{{ total }}</span>
          <span class="stat-label">条帖子</span>
        </div>
      </div>
    </div>

    <div class="main-layout">
      <!-- left: card grid -->
      <section class="content-area" v-loading="loading">
        <div v-if="posts.length === 0 && !loading" class="empty-state">
          <p class="empty-text">广场暂时空空如也</p>
          <p class="empty-hint">发一条寻物或招领，帮自己也帮别人</p>
          <button class="empty-action-btn" @click="goPublish">去发布帖子</button>
        </div>

        <div v-else class="card-grid">
          <div
            v-for="post in posts"
            :key="post.id"
            class="card"
            :class="post.type === 0 ? 'card-lost' : 'card-found'"
            @click="goDetail(post.id)"
          >
            <!-- left color stripe -->
            <div class="card-stripe" :class="post.type === 0 ? 'stripe-lost' : 'stripe-found'"></div>

            <!-- pushpin with status dot hole -->
            <div class="card-pin" :class="post.type === 0 ? 'pin-lost' : 'pin-found'">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1 2.89-2.64l3.05 2.05a2 2 0 0 1-.14 3.5l-2.5 1.8a2 2 0 0 1-2.3-.1l-1.5-1.2a2 2 0 0 1-.5-2.6z"/><circle cx="12" cy="6" r="2.5"/></svg>
            </div>
            <!-- status dot sits on top of pin center — "pin pierced a hole" -->
            <div class="card-status-hole" :class="statusDotClass(post.status)"></div>

            <!-- cover -->
            <div class="card-cover">
              <el-image v-if="post.coverImage" :src="imageUrl(post.coverImage)" fit="cover" />
              <div v-else class="cover-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b0a690" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
            </div>

            <!-- 3-layer info -->
            <div class="card-body">
              <h3 class="card-title">{{ post.title || '无标题' }}</h3>
              <div class="card-meta-line">
                <span class="meta-cat">{{ post.itemCategory }}</span>
                <span class="meta-sep">&middot;</span>
                <span class="meta-loc">{{ post.locationCampus }}</span>
                <span class="meta-sep">&middot;</span>
                <span class="meta-time">{{ post.lostTime?.replace('T', ' ') }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="total > pageSize" class="pagination">
          <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="page" @current-change="onPageChange" />
        </div>
      </section>

      <!-- right: sidebar filters -->
      <aside class="sidebar">
        <div class="filter-card">
          <el-input v-model="queryParams.keyword" placeholder="搜索关键词..." clearable :prefix-icon="Search" @keyup.enter="onSearch" @clear="onSearch" />
        </div>

        <div class="filter-card">
          <div class="section-title">类型</div>
          <div class="row-list">
            <div class="row-chip" :class="{ active: activeTab === null }" @click="onTabChange(null)">全部 <span v-if="activeTab === null" class="check">&check;</span></div>
            <div class="row-chip" :class="{ active: activeTab === 0 }" @click="onTabChange(0)">寻物 <span v-if="activeTab === 0" class="check">&check;</span></div>
            <div class="row-chip" :class="{ active: activeTab === 1 }" @click="onTabChange(1)">招领 <span v-if="activeTab === 1" class="check">&check;</span></div>
          </div>
        </div>

        <div class="filter-card">
          <div class="section-title">状态</div>
          <div class="row-list">
            <div class="row-chip" :class="{ active: queryParams.status === undefined }" @click="delete queryParams.status; page=1; fetchPosts()">全部 <span v-if="queryParams.status === undefined" class="check">&check;</span></div>
            <div class="row-chip" :class="{ active: queryParams.status === 0 }" @click="onFilterClick('status', 0)">进行中 <span v-if="queryParams.status === 0" class="check">&check;</span></div>
            <div class="row-chip" :class="{ active: queryParams.status === 1 }" @click="onFilterClick('status', 1)">已匹配 <span v-if="queryParams.status === 1" class="check">&check;</span></div>
            <div class="row-chip" :class="{ active: queryParams.status === 2 }" @click="onFilterClick('status', 2)">认领中 <span v-if="queryParams.status === 2" class="check">&check;</span></div>
            <div class="row-chip" :class="{ active: queryParams.status === 3 }" @click="onFilterClick('status', 3)">已完结 <span v-if="queryParams.status === 3" class="check">&check;</span></div>
          </div>
        </div>

        <div class="filter-card">
          <div class="section-title">分类</div>
          <div class="cat-list-wrap" :class="{ collapsed: !catExpanded && itemCategories.length > 5 }">
            <div class="row-list">
              <div v-for="c in (catExpanded ? itemCategories : itemCategories.slice(0, 5))" :key="c.id" class="row-chip" :class="{ active: queryParams.itemCategory === c.name }" @click="onFilterClick('itemCategory', c.name)">{{ c.name }} <span v-if="queryParams.itemCategory === c.name" class="check">&check;</span></div>
            </div>
            <div v-if="!catExpanded && itemCategories.length > 5" class="gradient-fade"></div>
          </div>
          <button v-if="itemCategories.length > 5" class="toggle-more-btn" @click="catExpanded = !catExpanded">
            {{ catExpanded ? '收起' : '更多' }}
          </button>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.post-square { max-width: 1280px; margin: 0 auto; padding: 24px 28px 40px; min-height: 100vh; }

/* === bulletin board header banner === */
.board-banner {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #d9cfb8;
}
.banner-left { display: flex; flex-direction: column; gap: 4px; }
.page-title { font-family: 'Noto Serif SC', Georgia, serif; font-size: 34px; font-weight: 700; color: #2d2a26; margin: 0; letter-spacing: 1px; }
.page-subtitle { font-size: 14px; color: #8a8170; margin: 0; }
.banner-right { display: flex; align-items: flex-end; }
.stat-block { display: flex; align-items: baseline; gap: 6px; }
.stat-num { font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 32px; font-weight: 700; color: #c8553d; }
.stat-label { font-size: 14px; color: #8a8170; }

/* === layout: cards left, sidebar right === */
.main-layout { display: flex; gap: 24px; align-items: flex-start; }
.content-area { flex: 1; min-width: 0; }

/* === sidebar: 260px === */
.sidebar {
  width: 260px; flex-shrink: 0; display: flex; flex-direction: column; gap: 16px;
}
.filter-card {
  background: #f3ecdb; border-radius: 6px; padding: 16px;
  border: 1px solid #d9cfb8;
  border-bottom: 3px solid #c4b896;
}
:deep(.filter-card .el-input__wrapper) {
  border-radius: 6px; background: #faf6ee;
  box-shadow: 0 0 0 1px #d9cfb8 inset;
}
:deep(.filter-card .el-input__wrapper:hover) { box-shadow: 0 0 0 1px #c4b896 inset; }
:deep(.filter-card .el-input.is-focus .el-input__wrapper) { box-shadow: 0 0 0 1px #c8553d inset; }

.section-title {
  font-family: 'Noto Serif SC', Georgia, serif; font-size: 18px; font-weight: 700; color: #2d2a26; margin-bottom: 10px;
}
.row-list { display: flex; flex-direction: column; gap: 3px; }
.row-chip {
  display: flex; justify-content: space-between; align-items: center;
  font-size: 14px; padding: 8px 12px; border-radius: 4px;
  cursor: pointer; background: #faf6ee; color: #5c5448;
  transition: all 0.15s; user-select: none;
}
.row-chip:hover { background: #f7ede9; color: #c8553d; }
.row-chip.active { background: #f7ede9; color: #c8553d; font-weight: 600; }
.row-chip:active { transform: scale(0.98); }
.row-chip .check { font-size: 14px; color: #c8553d; font-weight: 700; }

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

/* === card grid: 2 columns, larger cards === */
.card-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }

/* === sticky note card === */
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

/* left color stripe */
.card-stripe {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  border-radius: 6px 0 0 6px;
  z-index: 3;
}
.stripe-lost { background: #c8553d; }
.stripe-found { background: #6b8e4e; }

/* === pushpin with status hole === */
.card-pin {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #faf6ee;
  z-index: 3;
  border: 2px solid;
}
.pin-lost { background: #c8553d; border-color: #a8442f; }
.pin-found { background: #6b8e4e; border-color: #547039; }

/* status dot — sits on top of pin center, higher z-index = "pin pierced a hole" */
.card-status-hole {
  position: absolute;
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  z-index: 5;
  border: 2px solid #faf6ee;
}
.dot-active { background: #c8553d; }
.dot-claiming { background: #c9956b; }
.dot-done { background: #6b8e4e; }
.dot-archived { background: #b0a690; }

/* cover */
.card-cover { width: 100%; height: 200px; background: #e8dfc6; overflow: hidden; }
.card-cover :deep(.el-image) { width: 100%; height: 100%; }
.card-cover :deep(.el-image img) { object-fit: cover; width: 100%; height: 100%; }
.cover-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: #b0a690; }

/* 3-layer info */
.card-body { padding: 14px 18px 16px 22px; }
.card-title {
  font-size: 17px; font-weight: 600; color: #2d2a26; margin: 0 0 8px;
  line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-meta-line {
  font-size: 13px; color: #8a8170;
  display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical;
  overflow: hidden; white-space: nowrap;
}
.meta-cat { color: #c8553d; font-weight: 500; }
.meta-sep { color: #c4b896; margin: 0 4px; }
.meta-loc { color: #5c5448; }
.meta-time { font-family: 'JetBrains Mono', 'Courier New', monospace; color: #b0a690; }

/* === empty state === */
.empty-state { text-align: center; padding: 100px 0; }
.empty-text { font-size: 16px; color: #8a8170; margin: 0 0 6px; }
.empty-hint { font-size: 13px; color: #b0a690; margin: 0 0 20px; }
.empty-action-btn {
  background: #c8553d; color: #faf6ee; border: none; border-radius: 6px;
  padding: 10px 28px; font-size: 14px; font-weight: 600; cursor: pointer;
  transition: all 0.15s;
}
.empty-action-btn:hover { background: #a8442f; }
.empty-action-btn:active { transform: scale(0.97); }

/* === pagination === */
.pagination { display: flex; justify-content: center; margin-top: 28px; }
:deep(.pagination .el-pagination.is-background .btn-prev),
:deep(.pagination .el-pagination.is-background .btn-next),
:deep(.pagination .el-pagination.is-background .el-pager li) {
  background: #f3ecdb; border: 1px solid #d9cfb8; border-radius: 4px;
  color: #5c5448; font-weight: 500;
}
:deep(.pagination .el-pagination.is-background .btn-prev:hover),
:deep(.pagination .el-pagination.is-background .btn-next:hover),
:deep(.pagination .el-pagination.is-background .el-pager li:hover) {
  background: #f7ede9; color: #c8553d; border-color: #e2a294;
}
:deep(.pagination .el-pagination.is-background .el-pager li.is-active) {
  background: #c8553d; color: #faf6ee; border-color: #c8553d;
}
</style>
