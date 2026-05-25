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
const queryParams = ref({ type: null, itemCategory: '', keyword: '', status: 0 })

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
  } finally {
    loading.value = false
  }
}

function onTabChange(type) {
  queryParams.value.type = type
  page.value = 1
  fetchPosts()
}

function onSearch() {
  page.value = 1
  fetchPosts()
}

function onCategoryChange() {
  page.value = 1
  fetchPosts()
}

function goDetail(id) {
  router.push(`/post/${id}`)
}

function goPublish() {
  router.push('/publish')
}

function onPageChange(p) {
  page.value = p
  fetchPosts()
}

function typeLabel(type) {
  return type === 0 ? '寻物启事' : '失物招领'
}

function statusLabel(status) {
  const map = { 0: '进行中', 1: '已匹配', 2: '认领中', 3: '已完结', 4: '已过期', 5: '已下架' }
  return map[status] || '未知'
}
</script>

<template>
  <div class="post-square">
    <!-- 顶部 Banner 区 -->
    <div class="hero-section">
      <div class="hero-left">
        <h1 class="hero-title">失物广场</h1>
        <p class="hero-sub">找到你遗失的物品，或帮助他人找回失物</p>
      </div>
      <el-button type="primary" size="large" round @click="goPublish">
        <span style="font-size:18px;margin-right:4px">+</span> 发布帖子
      </el-button>
    </div>

    <!-- 筛选区 -->
    <div class="filter-section">
      <el-radio-group v-model="activeTab" size="default" @change="onTabChange">
        <el-radio-button :value="null">全部</el-radio-button>
        <el-radio-button :value="0">寻物启事</el-radio-button>
        <el-radio-button :value="1">失物招领</el-radio-button>
      </el-radio-group>

      <div class="filter-right">
        <el-select
          v-model="queryParams.itemCategory"
          placeholder="物品大类"
          clearable
          style="width:140px"
          @change="onCategoryChange"
        >
          <el-option v-for="c in itemCategories" :key="c.id" :label="c.name" :value="c.name" />
        </el-select>

        <el-input
          v-model="queryParams.keyword"
          placeholder="搜索..."
          clearable
          style="width:200px"
          :prefix-icon="Search"
          @keyup.enter="onSearch"
        />
      </div>
    </div>

    <!-- 帖子列表 -->
    <div v-loading="loading" class="post-list">
      <div v-if="posts.length === 0 && !loading" class="empty-state">
        <div class="empty-icon">📋</div>
        <p class="empty-text">还没有帖子</p>
        <p class="empty-hint">成为第一个发布寻物或招领信息的人吧</p>
      </div>

      <div
        v-for="post in posts"
        :key="post.id"
        class="post-card"
        @click="goDetail(post.id)"
      >
        <div class="card-cover" v-if="post.coverImage">
          <el-image :src="imageUrl(post.coverImage)" fit="cover" />
        </div>
        <div class="card-body">
          <div class="card-header">
            <el-tag :type="post.type === 0 ? 'danger' : 'success'" size="small" effect="dark" round>
              {{ typeLabel(post.type) }}
            </el-tag>
            <span class="card-title">{{ post.title || '无标题' }}</span>
          </div>
          <div class="card-tags">
            <span class="tag-dot">{{ post.itemCategory }}</span>
            <span class="tag-sep">·</span>
            <span class="tag-dot">{{ post.color }}</span>
            <span class="tag-sep">·</span>
            <span>{{ post.locationCampus }}
              <template v-if="post.locationArea"> {{ post.locationArea }}</template>
              <template v-if="post.locationDetail"> {{ post.locationDetail }}</template>
            </span>
            <span class="tag-sep">·</span>
            <span class="tag-time">{{ post.lostTime }}</span>
          </div>
          <div class="card-footer">
            <div class="card-user">
              <span class="user-avatar">{{ post.nickname?.charAt(0) || 'U' }}</span>
              <span class="user-name">{{ post.nickname }}</span>
            </div>
            <div class="card-meta">
              <span>{{ post.createTime?.substring(0, 10) }}</span>
              <span class="tag-sep">·</span>
              <span>{{ post.viewCount }} 次浏览</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > pageSize" class="pagination">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        v-model:current-page="page"
        @current-change="onPageChange"
      />
    </div>
  </div>
</template>

<style scoped>
.post-square {
  max-width: 860px;
  margin: 0 auto;
  padding: 32px 20px;
}

/* Hero */
.hero-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28px 32px;
  margin-bottom: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: #fff;
}

.hero-title {
  font-size: 26px;
  font-weight: 700;
  margin: 0 0 6px;
  letter-spacing: 0.5px;
}

.hero-sub {
  margin: 0;
  opacity: 0.85;
  font-size: 14px;
}

/* Filter */
.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.filter-right {
  display: flex;
  gap: 10px;
  align-items: center;
}

/* Post list */
.post-list {
  min-height: 300px;
}

.empty-state {
  padding: 100px 0;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 16px;
  color: #606266;
  margin: 0 0 4px;
}

.empty-hint {
  font-size: 13px;
  color: #c0c4cc;
  margin: 0;
}

/* Card */
.post-card {
  display: flex;
  background: #fff;
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: transform 0.2s, box-shadow 0.2s;
}

.post-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
}

.card-cover {
  width: 140px;
  min-height: 110px;
  flex-shrink: 0;
  background: #f0f2f5;
}

.card-cover .el-image {
  width: 140px;
  height: 100%;
}

.card-body {
  flex: 1;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 10px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #909399;
  flex-wrap: wrap;
}

.tag-dot {
  color: #606266;
  font-weight: 500;
}

.tag-sep {
  color: #dcdfe6;
}

.tag-time {
  color: #409eff;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-user {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: linear-gradient(135deg, #409eff, #66b1ff);
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.user-name {
  font-size: 13px;
  color: #606266;
  font-weight: 500;
}

.card-meta {
  font-size: 12px;
  color: #c0c4cc;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}
</style>
