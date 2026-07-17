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
</script>

<template>
  <div class="page post-square">
    <div class="page-header">
      <div>
        <h1>失物广场</h1>
        <p class="subtitle">在这里找到你丢失的，或拾到他人遗失的</p>
      </div>
      <div class="stat-block">
        <span class="stat-num">{{ total }}</span>
        <span class="stat-label">条帖子</span>
      </div>
    </div>

    <div class="main-layout">
      <section class="content-area" v-loading="loading">
        <div v-if="posts.length === 0 && !loading" class="empty-state">
          <p class="empty-text">广场暂时空空如也</p>
          <p class="empty-hint">发一条寻物或招领，帮自己也帮别人</p>
          <button class="btn-primary" @click="goPublish">去发布帖子</button>
        </div>

        <div v-else class="card-grid">
          <div
            v-for="post in posts"
            :key="post.id"
            class="card-wrap post-card-wrap"
            @click="goDetail(post.id)"
          >
            <div class="bind-rings">
              <span></span><span></span><span></span>
            </div>
            <div class="note-card post-card" :class="{ 'has-stripe': true }">
              <div class="card-stripe" :class="post.type === 0 ? 'stripe-lost' : 'stripe-found'"></div>

              <div class="card-cover">
                <el-image v-if="post.coverImage" :src="imageUrl(post.coverImage)" fit="cover" class="cover-img" />
                <div v-else class="cover-placeholder">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </div>
              </div>

              <div class="card-body">
                <h3 class="card-title">{{ post.title || '无标题' }}</h3>
                <div class="card-meta-line">
                  <span class="meta-cat">{{ post.itemCategory }}</span>
                  <span class="meta-sep">·</span>
                  <span class="meta-loc">{{ post.locationCampus }}</span>
                  <span class="meta-sep">·</span>
                  <span class="meta-time">{{ post.lostTime?.replace('T', ' ') }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-if="total > pageSize" class="pagination">
          <el-pagination background layout="prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="page" @current-change="onPageChange" />
        </div>
      </section>

      <aside class="sidebar">
        <div class="card-wrap">
          <div class="bind-rings"><span></span><span></span><span></span></div>
          <div class="note-card filter-card">
            <el-input v-model="queryParams.keyword" placeholder="搜索关键词..." clearable :prefix-icon="Search" @keyup.enter="onSearch" @clear="onSearch" />
          </div>
        </div>

        <div class="card-wrap">
          <div class="bind-rings"><span></span><span></span><span></span></div>
          <div class="note-card filter-card">
            <div class="section-title">类型</div>
            <div class="pill-list">
              <button class="tab-pill" :class="{ active: activeTab === null }" @click="onTabChange(null)">全部</button>
              <button class="tab-pill" :class="{ active: activeTab === 0 }" @click="onTabChange(0)">寻物</button>
              <button class="tab-pill" :class="{ active: activeTab === 1 }" @click="onTabChange(1)">招领</button>
            </div>
          </div>
        </div>

        <div class="card-wrap">
          <div class="bind-rings"><span></span><span></span><span></span></div>
          <div class="note-card filter-card">
            <div class="section-title">状态</div>
            <div class="pill-list">
              <button class="tab-pill" :class="{ active: queryParams.status === undefined }" @click="delete queryParams.status; page=1; fetchPosts()">全部</button>
              <button class="tab-pill" :class="{ active: queryParams.status === 0 }" @click="onFilterClick('status', 0)">进行中</button>
              <button class="tab-pill" :class="{ active: queryParams.status === 1 }" @click="onFilterClick('status', 1)">已匹配</button>
              <button class="tab-pill" :class="{ active: queryParams.status === 2 }" @click="onFilterClick('status', 2)">认领中</button>
              <button class="tab-pill" :class="{ active: queryParams.status === 3 }" @click="onFilterClick('status', 3)">已完结</button>
            </div>
          </div>
        </div>

        <div class="card-wrap">
          <div class="bind-rings"><span></span><span></span><span></span></div>
          <div class="note-card filter-card">
            <div class="section-title">分类</div>
            <div class="cat-list-wrap" :class="{ collapsed: !catExpanded && itemCategories.length > 5 }">
              <div class="pill-list">
                <button
                  v-for="c in (catExpanded ? itemCategories : itemCategories.slice(0, 5))"
                  :key="c.id"
                  class="tab-pill"
                  :class="{ active: queryParams.itemCategory === c.name }"
                  @click="onFilterClick('itemCategory', c.name)"
                >{{ c.name }}</button>
              </div>
              <div v-if="!catExpanded && itemCategories.length > 5" class="gradient-fade"></div>
            </div>
            <button v-if="itemCategories.length > 5" class="toggle-more-btn" @click="catExpanded = !catExpanded">
              {{ catExpanded ? '收起' : '更多' }}
            </button>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.post-square { padding-bottom: 40px; }

.stat-block { display: flex; align-items: baseline; gap: 6px; }

.main-layout { display: flex; gap: 24px; align-items: flex-start; }
.content-area { flex: 1; min-width: 0; }

.sidebar {
  width: var(--sidebar-w); flex-shrink: 0;
  display: flex; flex-direction: column; gap: 16px;
}

.filter-card { padding: 16px; }

.section-title {
  font-family: var(--pen-font);
  font-size: var(--fs-h3);
  font-weight: 700;
  color: var(--ink-900);
  margin-bottom: 10px;
}

.pill-list { display: flex; flex-wrap: wrap; gap: 6px; }

.cat-list-wrap { position: relative; overflow: hidden; }
.cat-list-wrap.collapsed { max-height: 200px; }
.gradient-fade {
  position: absolute; bottom: 0; left: 0; right: 0; height: 40px;
  background: linear-gradient(to bottom, transparent, var(--page));
  pointer-events: none;
}
.toggle-more-btn {
  display: block; width: 100%; margin-top: 8px; padding: 6px 0;
  border: none; background: transparent; color: var(--indigo);
  font-size: var(--fs-small); font-weight: 600; cursor: pointer;
  transition: var(--transition);
}
.toggle-more-btn:hover { color: var(--indigo-hover); }

.card-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }

.post-card-wrap { cursor: pointer; }
.post-card { overflow: hidden; }

.card-stripe {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 4px;
  z-index: 3;
}

.card-cover {
  width: 100%; height: 200px;
  background: #f3f4f6;
  overflow: hidden;
}
.cover-img { width: 100%; height: 100%; }
.cover-img :deep(img) { object-fit: cover; width: 100%; height: 100%; }
.cover-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: var(--ink-300);
}

.card-body { padding: 14px 18px 16px 22px; }
.card-title {
  font-size: 17px; font-weight: 600; color: var(--ink-900); margin: 0 0 8px;
  line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}
.card-meta-line {
  font-size: var(--fs-small); color: var(--ink-500);
  display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical;
  overflow: hidden; white-space: nowrap;
}
.meta-cat { color: var(--indigo); font-weight: 500; }
.meta-sep { color: var(--ink-300); margin: 0 4px; }
.meta-loc { color: var(--ink-700); }
.meta-time { font-family: var(--mono-font); color: var(--ink-300); }

.empty-state { text-align: center; padding: 100px 0; }

.pagination { display: flex; justify-content: center; margin-top: 28px; }
</style>
