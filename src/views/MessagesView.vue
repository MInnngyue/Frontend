<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMessages, markRead } from '@/api/message'
import { getConversations } from '@/api/pm'

const router = useRouter()
const systemMsgs = ref([])
const conversations = ref([])
const sysExpanded = ref(false)

onMounted(async () => {
  const res = await getMessages(); systemMsgs.value = res.data
  const cres = await getConversations(); conversations.value = cres.data
})

function goPost(id) { router.push(`/post/${id}#comments`) }
function goChat(otherId) { router.push({ path: '/chat', query: { userId: otherId } }) }
</script>

<template>
  <div class="msg-page">
    <h1 class="page-title">消息</h1>

    <!-- 系统通知 -->
    <div class="section-card">
      <div class="section-header" style="display:flex;justify-content:space-between;align-items:center">
        <span>系统通知</span>
        <el-button size="small" class="expand-btn" @click="sysExpanded = !sysExpanded">{{ sysExpanded ? '收起 ▲' : '展开 ▼' }}</el-button>
      </div>
      <div v-if="systemMsgs.length === 0" class="empty-hint">暂无系统通知</div>
      <div v-if="sysExpanded" v-for="m in systemMsgs" :key="m.id" class="msg-item" :class="{ unread: m.isRead === 0 }" @click="markRead(m.id); if(m.relatedPostId) goPost(m.relatedPostId)">
        <div class="msg-title">{{ m.title }}</div>
        <div class="msg-content">{{ m.content }}</div>
        <div class="msg-time">{{ m.createTime?.substring(0, 16) }}</div>
      </div>
    </div>

    <!-- 私信会话 -->
    <div class="section-card">
      <div class="section-header">私信</div>
      <div v-if="conversations.length === 0" class="empty-hint">暂无私信</div>
      <div v-for="c in conversations" :key="c.userId" class="msg-item" @click="goChat(c.userId)">
        <div class="conv-row">
          <span class="conv-avatar">{{ c.nickname?.charAt(0) || 'U' }}</span>
          <div class="conv-info">
            <div class="conv-name">{{ c.nickname }} <el-badge v-if="c.unread" :value="c.unread" style="margin-left:6px" /></div>
            <div class="conv-last">{{ c.lastMsg?.substring(0, 50) }}</div>
          </div>
          <span class="conv-time">{{ c.lastTime?.substring(0, 16) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.msg-page { max-width: 700px; margin: 0 auto; padding: 24px 20px 32px; }
.page-title { font-size: 56px; font-weight: 800; color: #111827; margin: 0 0 24px; text-align: center; }
.section-card { background: #fff; border-radius: 10px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.section-header { font-size: 16px; font-weight: 700; color: #303133; margin-bottom: 12px; }
.empty-hint { text-align: center; color: #c0c4cc; padding: 30px 0; font-size: 13px; }
.msg-item { padding: 10px 12px; border-radius: 8px; cursor: pointer; border-bottom: 1px solid #f5f6f8; }
.msg-item:last-child { border-bottom: none; }
.msg-item:hover { background: #f9fafb; }
.msg-item.unread { background: #ecf5ff; }
.msg-title { font-size: 14px; font-weight: 600; color: #303133; margin-bottom: 4px; }
.msg-content { font-size: 13px; color: #909399; white-space: pre-line; }
.msg-time { font-size: 11px; color: #c0c4cc; margin-top: 4px; }
.conv-row { display: flex; align-items: center; gap: 10px; }
.conv-avatar { width: 40px; height: 40px; border-radius: 50%; background: #409eff; color: #fff; font-size: 16px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.conv-info { flex: 1; min-width: 0; }
.conv-name { font-size: 14px; font-weight: 600; color: #303133; display: flex; align-items: center; }
.conv-last { font-size: 12px; color: #909399; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.conv-time { font-size: 11px; color: #c0c4cc; flex-shrink: 0; }
.expand-btn { background: #3b82f6; border: none; color: #fff; border-radius: 6px; font-size: 14px; padding: 7px 18px; }
.expand-btn:hover { background: #2563eb; color: #fff; }
</style>
