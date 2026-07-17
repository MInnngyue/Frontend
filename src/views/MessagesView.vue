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
  <div class="msg-page">
    <h1 class="page-title">消息</h1>

    <div class="section-card">
      <div class="section-header">
        <span>系统通知 <span v-if="systemUnread > 0" class="sys-badge">{{ systemUnread }}</span></span>
        <el-button size="small" class="expand-btn" @click="sysExpanded = !sysExpanded">{{ sysExpanded ? '收起 ▲' : '展开 ▼' }}</el-button>
      </div>
      <div v-if="systemMsgs.length === 0" class="empty-hint">暂时没有通知</div>
      <div v-if="sysExpanded" v-for="m in systemMsgs" :key="m.id" class="msg-item" :class="{ unread: m.isRead === 0 }" @click="handleMsgClick(m)">
        <div class="msg-title">
          {{ m.title }}
          <span v-if="m.isRead === 0" class="item-badge">●</span>
        </div>
        <div class="msg-content">{{ m.content }}</div>
        <div class="msg-time">{{ m.createTime?.substring(0, 16).replace('T', ' ') }}</div>
      </div>
    </div>

    <div class="section-card">
      <div class="section-header">私信</div>
      <div v-if="conversations.length === 0" class="empty-hint">还没有私信记录</div>
      <div v-for="c in conversations" :key="c.userId" class="msg-item" @click="goChat(c.userId)">
        <div class="conv-row">
          <span class="conv-avatar">{{ c.nickname?.charAt(0) || 'U' }}</span>
          <div class="conv-info">
            <div class="conv-name">{{ c.nickname }} <el-badge v-if="c.unread" :value="c.unread" style="margin-left:6px" /></div>
            <div class="conv-last">{{ c.lastMsg?.substring(0, 50) }}</div>
          </div>
          <span class="conv-time">{{ c.lastTime?.substring(0, 16).replace('T', ' ') }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.msg-page { max-width: 700px; margin: 0 auto; padding: 22px 24px 36px; background: var(--page); min-height: 100vh; }
.page-title { font-family: 'Noto Serif SC', Georgia, serif; font-size: 32px; font-weight: 700; color: var(--ink-900); margin: 0 0 22px; text-align: center; }
.section-card { background: var(--page); border: 1px solid var(--page-edge); border-radius: 6px; padding: 20px; margin-bottom: 16px; border-bottom: 3px solid #cbd5e1; }
.section-header { display: flex; justify-content: space-between; align-items: center; font-size: 16px; font-weight: 600; color: var(--ink-900); margin-bottom: 14px; }
.empty-hint { text-align: center; color: var(--ink-300); padding: 36px 0; font-size: 14px; }
.msg-item { padding: 12px 14px; border-radius: 6px; cursor: pointer; border-bottom: 1px solid #f3f4f6; transition: background 0.15s; }
.msg-item:last-child { border-bottom: none; }
.msg-item:hover { background: #f3f4f6; }
.msg-item.unread { background: var(--indigo-light); }
.msg-item.unread:hover { background: #eedfd9; }
.msg-title { font-size: 14px; font-weight: 600; color: var(--ink-900); margin-bottom: 4px; }
.msg-content { font-size: 13px; color: var(--ink-500); white-space: pre-line; line-height: 1.5; }
.msg-time { font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 12px; color: var(--ink-300); margin-top: 6px; }
.conv-row { display: flex; align-items: center; gap: 12px; }
.conv-avatar { width: 42px; height: 42px; border-radius: 50%; background: var(--indigo); color: #fff; font-size: 16px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.conv-info { flex: 1; min-width: 0; }
.conv-name { font-size: 14px; font-weight: 600; color: var(--ink-900); display: flex; align-items: center; }
.conv-last { font-size: 13px; color: var(--ink-500); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-top: 3px; }
.conv-time { font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 12px; color: var(--ink-300); flex-shrink: 0; }
.expand-btn { background: var(--indigo-light); border: 1px solid #eedfd9; color: var(--indigo-hover); border-radius: 6px; font-size: 13px; padding: 6px 14px; height: auto; }
.expand-btn:hover { background: #eedfd9; color: var(--indigo-active); border-color: var(--indigo); }

/* Badges */
.sys-badge {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 18px; height: 18px; padding: 0 5px; border-radius: 6px;
  background: var(--rose); color: #fff; font-size: 11px; font-weight: 700;
  margin-left: 6px; vertical-align: middle;
}
.item-badge { color: var(--rose); font-size: 10px; margin-left: 6px; }
</style>
