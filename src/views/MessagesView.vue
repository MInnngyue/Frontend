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
      <div class="section-header">
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
.msg-page { max-width: 700px; margin: 0 auto; padding: 24px 20px 32px; background: #f8fafc; min-height: 100vh; }
.page-title { font-size: 32px; font-weight: 700; color: #1e293b; margin: 0 0 28px; }
.section-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
.section-header { display: flex; justify-content: space-between; align-items: center; font-size: 16px; font-weight: 600; color: #1e293b; margin-bottom: 14px; }
.empty-hint { text-align: center; color: #94a3b8; padding: 36px 0; font-size: 14px; }
.msg-item { padding: 12px 14px; border-radius: 10px; cursor: pointer; border-bottom: 1px solid #f1f5f9; transition: background 0.15s; }
.msg-item:last-child { border-bottom: none; }
.msg-item:hover { background: #f1f5f9; }
.msg-item.unread { background: #eef2ff; }
.msg-item.unread:hover { background: #e0e7ff; }
.msg-title { font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 4px; }
.msg-content { font-size: 13px; color: #64748b; white-space: pre-line; line-height: 1.5; }
.msg-time { font-size: 12px; color: #94a3b8; margin-top: 6px; }
.conv-row { display: flex; align-items: center; gap: 12px; }
.conv-avatar { width: 42px; height: 42px; border-radius: 50%; background: #4f46e5; color: #fff; font-size: 16px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.conv-info { flex: 1; min-width: 0; }
.conv-name { font-size: 14px; font-weight: 600; color: #1e293b; display: flex; align-items: center; }
.conv-last { font-size: 13px; color: #64748b; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 3px; }
.conv-time { font-size: 12px; color: #94a3b8; flex-shrink: 0; }
.expand-btn { background: #eef2ff; border: 1px solid #e0e7ff; color: #4338ca; border-radius: 7px; font-size: 13px; padding: 6px 14px; height: auto; }
.expand-btn:hover { background: #e0e7ff; color: #3730a3; border-color: #c7d2fe; }
</style>
