<script setup>
import { ref, onMounted, nextTick, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getChatWith, sendMessage } from '@/api/pm'

const route = useRoute()
const router = useRouter()
const otherId = ref(parseInt(route.query.userId))
if (!otherId.value || isNaN(otherId.value)) {
  router.push('/messages')
}
const messages = ref([])
const text = ref('')
const sending = ref(false)
const chatBox = ref(null)

onMounted(async () => {
  const res = await getChatWith(otherId.value); messages.value = res.data
  nextTick(() => { chatBox.value?.scrollTo({ top: chatBox.value.scrollHeight }) })
})

async function send() {
  if (!text.value.trim()) return
  sending.value = true
  try {
    await sendMessage({ toUserId: otherId.value, content: text.value })
    text.value = ''
    const res = await getChatWith(otherId.value); messages.value = res.data
    nextTick(() => { chatBox.value?.scrollTo({ top: chatBox.value.scrollHeight }) })
  } catch { } finally { sending.value = false }
}

function isMe(msg) { const info = localStorage.getItem('userInfo'); if (!info) return false; const me = JSON.parse(info); return msg.fromUserId === (me.userId || me.id) }

function formatDateLabel(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr.replace(' ', 'T'))
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today - 86400000)
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  if (msgDay.getTime() === today.getTime()) return '今天'
  if (msgDay.getTime() === yesterday.getTime()) return '昨天'
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}

const displayMessages = computed(() => {
  const result = []
  let lastTime = null
  for (const m of messages.value) {
    const mTime = m.createTime ? new Date(m.createTime.replace(' ', 'T')).getTime() : null
    if (lastTime === null || (mTime && mTime - lastTime > 3 * 60 * 1000)) {
      result.push({ type: 'date', date: formatDateLabel(m.createTime), createTime: m.createTime })
    }
    result.push({ type: 'msg', ...m })
    lastTime = mTime
  }
  return result
})
</script>

<template>
  <div class="chat-page">
    <div class="chat-header">
      <button class="btn-icon" @click="router.push('/messages')">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
      </button>
      <span class="chat-title">私信</span>
    </div>
    <div class="chat-box" ref="chatBox">
      <template v-for="item in displayMessages" :key="item.type === 'date' ? 'd-' + item.createTime : 'm-' + item.id">
        <div v-if="item.type === 'date'" class="chat-date-sep">
          <span>{{ item.date }}</span>
        </div>
        <div v-else class="chat-msg" :class="{ mine: isMe(item) }">
          <div class="chat-bubble">{{ item.content }}</div>
          <div class="chat-time">{{ item.createTime?.substring(11, 16) }}</div>
        </div>
      </template>
      <div v-if="messages.length === 0" class="chat-empty">还没有消息，和对方打个招呼吧</div>
    </div>
    <div class="chat-input">
      <el-input v-model="text" placeholder="输入消息..." maxlength="500" @keyup.enter="send" />
      <button class="btn-primary" :disabled="sending" @click="send">{{ sending ? '发送中...' : '发送' }}</button>
    </div>
  </div>
</template>

<style scoped>
.chat-page { max-width: 700px; margin: 0 auto; height: calc(100vh - 84px); display: flex; flex-direction: column; }

.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: var(--page);
  border: 1px solid var(--page-edge);
  border-bottom: none;
  border-radius: var(--r-card) var(--r-card) 0 0;
}
.chat-title { font-family: var(--pen-font); font-size: 17px; font-weight: 600; color: var(--ink-900); }

.chat-box {
  flex: 1; overflow-y: auto; padding: 20px;
  background: var(--page);
  display: flex; flex-direction: column; gap: 14px;
  border-left: 1px solid var(--page-edge); border-right: 1px solid var(--page-edge);
}
.chat-empty { text-align: center; color: var(--ink-300); padding: 60px 0; font-size: 14px; }
.chat-date-sep { text-align: center; padding: 8px 0; }
.chat-date-sep span {
  font-size: 12px; color: var(--ink-300); background: #f3f4f6;
  padding: 3px 12px; border-radius: var(--r-btn);
}

.chat-msg { display: flex; flex-direction: column; max-width: 70%; }
.chat-msg.mine { align-self: flex-end; }
.chat-msg:not(.mine) { width: fit-content; }
.chat-msg.mine .chat-bubble { background: var(--indigo); color: #fff; border-radius: 16px 16px 4px 16px; border: none; }
.chat-bubble {
  background: var(--page); color: var(--ink-900); padding: 10px 16px; border-radius: 16px 16px 16px 4px;
  font-size: 14px; line-height: 1.5; word-break: break-word; border: 1px solid var(--page-edge);
}
.chat-time { font-family: var(--mono-font); font-size: 11px; color: var(--ink-300); margin-top: 4px; padding: 0 4px; }
.chat-msg.mine .chat-time { text-align: right; }

.chat-input {
  display: flex; gap: 10px; padding: 14px 20px;
  background: var(--page);
  border: 1px solid var(--page-edge); border-top: none;
  border-radius: 0 0 var(--r-card) var(--r-card);
}
</style>
