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
    <!-- 顶部操作栏 -->
    <div class="top-bar">
      <el-radio-group v-model="activeTab" size="large" @change="onTabChange">
        <el-radio-button :value="null">全部</el-radio-button>
        <el-radio-button :value="0">寻物启事</el-radio-button>
        <el-radio-button :value="1">失物招领</el-radio-button>
      </el-radio-group>

      <el-button type="primary" size="large" @click="goPublish">
        + 发布帖子
      </el-button>
    </div>

    <!-- 筛选区 -->
    <div class="filter-bar">
      <el-select
        v-model="queryParams.itemCategory"
        placeholder="物品大类"
        clearable
        style="width: 160px"
        @change="onCategoryChange"
      >
        <el-option v-for="c in itemCategories" :key="c.id" :label="c.name" :value="c.name" />
      </el-select>

      <el-input
        v-model="queryParams.keyword"
        placeholder="搜索标题或描述..."
        clearable
        style="width: 260px"
        :prefix-icon="Search"
        @keyup.enter="onSearch"
      />

      <el-button @click="onSearch">搜索</el-button>
    </div>

    <!-- 帖子列表 -->
    <div v-loading="loading" class="post-list">
      <div v-if="posts.length === 0 && !loading" class="empty-state">
        <el-empty description="暂无帖子" />
      </div>

      <div
        v-for="post in posts"
        :key="post.id"
        class="post-card"
        @click="goDetail(post.id)"
      >
        <div class="post-card-body">
          <div v-if="post.coverImage" class="post-cover">
            <el-image :src="imageUrl(post.coverImage)" fit="cover" style="width:120px;height:90px" />
          </div>
          <div class="post-info">
            <div class="post-title">
              <el-tag :type="post.type === 0 ? 'danger' : 'success'" size="small">
                {{ typeLabel(post.type) }}
              </el-tag>
              <span class="title-text">{{ post.title || '无标题' }}</span>
              <el-tag size="small" type="info">{{ statusLabel(post.status) }}</el-tag>
            </div>
            <div class="post-meta">
              <el-tag size="small" effect="plain">{{ post.itemCategory }}</el-tag>
              <el-tag size="small" effect="plain">{{ post.color }}</el-tag>
              <span v-if="post.locationCampus">{{ post.locationCampus }}</span>
              <span v-if="post.locationArea">- {{ post.locationArea }}</span>
              <span v-if="post.locationDetail">- {{ post.locationDetail }}</span>
              <span>| {{ post.lostTime }}</span>
            </div>
            <div class="post-footer">
              <span class="publisher">{{ post.nickname }}</span>
              <span class="time">{{ post.createTime?.substring(0, 10) }}</span>
              <span class="views">{{ post.viewCount }} 次浏览</span>
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
  max-width: 900px;
  margin: 0 auto;
  padding: 20px;
}

.top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  align-items: center;
}

.post-list {
  min-height: 300px;
}

.empty-state {
  padding: 80px 0;
}

.post-card {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.post-card:hover {
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.post-card-body {
  display: flex;
  gap: 16px;
}

.post-cover {
  flex-shrink: 0;
}

.post-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.post-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.title-text {
  font-size: 16px;
  font-weight: 500;
  flex: 1;
}

.post-meta {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: wrap;
  color: #909399;
  font-size: 13px;
}

.post-footer {
  display: flex;
  gap: 16px;
  color: #c0c4cc;
  font-size: 12px;
}

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}
</style>
