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

// 格式化日期显示
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

// 带日期分隔的消息列表
const displayMessages = computed(() => {
  const result = []
  let lastTime = null
  for (const m of messages.value) {
    const mTime = m.createTime ? new Date(m.createTime.replace(' ', 'T')).getTime() : null
    // 如果距上一条消息超过3分钟，插入日期分隔
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
      <el-button text @click="router.push('/messages')">&larr; 返回消息</el-button>
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
      <el-button type="primary" :loading="sending" @click="send">发送</el-button>
    </div>
  </div>
</template>

<style scoped>
.chat-page { max-width: 700px; margin: 0 auto; height: calc(100vh - 84px); display: flex; flex-direction: column; background: #faf6ee; }
.chat-header {
  display: flex; align-items: center; gap: 12px; padding: 14px 20px;
  background: #f3ecdb; border: 1px solid #d9cfb8; border-bottom: none; border-radius: 6px 6px 0 0;
}
.chat-header :deep(.el-button) { color: #a8442f; }
.chat-header :deep(.el-button:hover) { color: #8e3826; background: #f7ede9; }
.chat-title { font-family: 'Noto Serif SC', Georgia, serif; font-size: 17px; font-weight: 600; color: #2d2a26; }
.chat-box {
  flex: 1; overflow-y: auto; padding: 20px; background: #faf6ee;
  display: flex; flex-direction: column; gap: 14px;
  border-left: 1px solid #d9cfb8; border-right: 1px solid #d9cfb8;
}
.chat-empty { text-align: center; color: #b0a690; padding: 60px 0; font-size: 14px; }
.chat-date-sep { text-align: center; padding: 8px 0; }
.chat-date-sep span {
  font-size: 12px; color: #b0a690; background: #e8dfc6;
  padding: 3px 12px; border-radius: 6px;
}
.chat-msg { display: flex; flex-direction: column; max-width: 70%; }
.chat-msg.mine { align-self: flex-end; }
.chat-msg:not(.mine) { width: fit-content; }
.chat-msg.mine .chat-bubble { background: #c8553d; color: #fff; border-radius: 16px 16px 4px 16px; border: none; }
.chat-bubble {
  background: #f3ecdb; color: #2d2a26; padding: 10px 16px; border-radius: 16px 16px 16px 4px;
  font-size: 14px; line-height: 1.5; word-break: break-word; border: 1px solid #d9cfb8;
}
.chat-time { font-family: 'JetBrains Mono', 'Courier New', monospace; font-size: 11px; color: #b0a690; margin-top: 4px; padding: 0 4px; }
.chat-msg.mine .chat-time { text-align: right; }
.chat-input {
  display: flex; gap: 10px; padding: 14px 20px; background: #f3ecdb;
  border: 1px solid #d9cfb8; border-top: none; border-radius: 0 0 6px 6px;
}
.chat-input :deep(.el-button--primary) { background: #c8553d; border-color: #c8553d; border-radius: 6px; }
.chat-input :deep(.el-button--primary:hover) { background: #a8442f; border-color: #a8442f; }
</style>
