<script setup>
import { ref, computed, onMounted, inject } from 'vue'
import { useRouter } from 'vue-router'
import { getMessages, markRead } from '@/api/message'
import { getConversations } from '@/api/pm'

const router = useRouter()
const systemMsgs = ref([])
const conversations = ref([])
const sysExpanded = ref(false)

const systemUnread = computed(() => systemMsgs.value.filter(m => m.isRead === 0).length)
const refreshUnread = inject('refreshUnread', () => {})

onMounted(async () => {
  const res = await getMessages(); systemMsgs.value = res.data
  const cres = await getConversations(); conversations.value = cres.data
})

function goPost(id) { router.push(`/post/${id}#comments`) }
function goChat(otherId) { router.push({ path: '/chat', query: { userId: otherId } }) }

async function handleMsgClick(m) {
  if (m.isRead === 0) { await markRead(m.id); m.isRead = 1; refreshUnread() }
  if (m.relatedPostId) goPost(m.relatedPostId)
}
</script>

<template>
  <div class="page msg-page">
    <div class="page-header">
      <div>
        <h1>消息中心</h1>
        <p class="subtitle">系统通知与私信</p>
      </div>
      <div class="stat-block" v-if="systemUnread > 0">
        <span class="stat-num">{{ systemUnread }}</span>
        <span class="stat-label">条未读</span>
      </div>
    </div>

    <!-- system notifications -->
    <div class="card-wrap">
      <div class="bind-rings"><span></span><span></span><span></span></div>
      <div class="note-card">
        <div class="section-header">
          <span>系统通知 <span v-if="systemUnread > 0" class="badge-count">{{ systemUnread }}</span></span>
          <button class="btn-ghost" @click="sysExpanded = !sysExpanded">{{ sysExpanded ? '收起' : '展开' }}</button>
        </div>
        <div v-if="systemMsgs.length === 0" class="empty-state">
          <p class="empty-text">暂时没有通知</p>
        </div>
        <div v-if="sysExpanded" class="msg-list">
          <div v-for="m in systemMsgs" :key="m.id" class="msg-item" :class="{ unread: m.isRead === 0 }" @click="handleMsgClick(m)">
            <div class="msg-title">{{ m.title }} <span v-if="m.isRead === 0" class="unread-dot"></span></div>
            <div class="msg-content">{{ m.content }}</div>
            <div class="msg-time">{{ m.createTime?.substring(0, 16).replace('T', ' ') }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- private messages -->
    <div class="card-wrap">
      <div class="bind-rings"><span></span><span></span><span></span></div>
      <div class="note-card">
        <div class="section-header">
          <span>私信</span>
        </div>
        <div v-if="conversations.length === 0" class="empty-state">
          <p class="empty-text">还没有私信记录</p>
        </div>
        <div v-else class="conv-list">
          <div v-for="c in conversations" :key="c.userId" class="conv-item" @click="goChat(c.userId)">
            <div class="avatar avatar-md">{{ c.nickname?.charAt(0) || 'U' }}</div>
            <div class="conv-info">
              <div class="conv-name">{{ c.nickname }} <span v-if="c.unread" class="badge-count">{{ c.unread }}</span></div>
              <div class="conv-last">{{ c.lastMsg?.substring(0, 50) }}</div>
            </div>
            <span class="conv-time">{{ c.lastTime?.substring(0, 16).replace('T', ' ') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.msg-page { max-width: 700px; }

/* section header */
.section-header { display: flex; justify-content: space-between; align-items: center; font-size: 16px; font-weight: 600; color: var(--ink-900); margin-bottom: 16px; }

/* message items */
.msg-list { display: flex; flex-direction: column; }
.msg-item {
  padding: 14px 0;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: var(--transition);
}
.msg-item:last-child { border-bottom: none; }
.msg-item:hover { background: #f9fafb; margin: 0 -16px; padding: 14px 16px; }
.msg-item.unread { background: var(--indigo-light); margin: 0 -16px; padding: 14px 16px; border-radius: var(--r-btn); }
.msg-item.unread:hover { background: #dbeafe; }
.msg-title { font-size: 14px; font-weight: 600; color: var(--ink-900); margin-bottom: 4px; display: flex; align-items: center; gap: 6px; }
.unread-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--indigo); display: inline-block; }
.msg-content { font-size: 13px; color: var(--ink-500); white-space: pre-line; line-height: 1.5; }
.msg-time { font-family: var(--mono-font); font-size: 12px; color: var(--ink-300); margin-top: 6px; }

/* conversation items */
.conv-list { display: flex; flex-direction: column; }
.conv-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: var(--transition);
}
.conv-item:last-child { border-bottom: none; }
.conv-item:hover { background: #f9fafb; margin: 0 -16px; padding: 14px 16px; }
.conv-info { flex: 1; min-width: 0; }
.conv-name { font-size: 14px; font-weight: 600; color: var(--ink-900); display: flex; align-items: center; gap: 6px; }
.conv-last { font-size: 13px; color: var(--ink-500); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 3px; }
.conv-time { font-family: var(--mono-font); font-size: 12px; color: var(--ink-300); flex-shrink: 0; }
</style>
