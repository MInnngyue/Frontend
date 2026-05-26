<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getChatWith, sendMessage } from '@/api/pm'

const route = useRoute()
const router = useRouter()
const otherId = ref(parseInt(route.query.userId))
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
</script>

<template>
  <div class="chat-page">
    <div class="chat-header">
      <el-button text @click="router.push('/messages')">&larr; 返回消息</el-button>
      <span class="chat-title">私信</span>
    </div>
    <div class="chat-box" ref="chatBox">
      <div v-for="m in messages" :key="m.id" class="chat-msg" :class="{ mine: isMe(m) }">
        <div class="chat-bubble">{{ m.content }}</div>
        <div class="chat-time">{{ m.createTime?.substring(11, 16) }}</div>
      </div>
      <div v-if="messages.length === 0" class="chat-empty">暂无消息，发送第一条私信吧</div>
    </div>
    <div class="chat-input">
      <el-input v-model="text" placeholder="输入消息..." maxlength="500" @keyup.enter="send" />
      <el-button type="primary" :loading="sending" @click="send">发送</el-button>
    </div>
  </div>
</template>

<style scoped>
.chat-page { max-width: 700px; margin: 0 auto; height: calc(100vh - 84px); display: flex; flex-direction: column; background: #f8fafc; }
.chat-header {
  display: flex; align-items: center; gap: 12px; padding: 14px 20px;
  background: #fff; border: 1px solid #e2e8f0; border-bottom: none; border-radius: 12px 12px 0 0;
}
.chat-header :deep(.el-button) { color: #4338ca; }
.chat-header :deep(.el-button:hover) { color: #3730a3; background: #eef2ff; }
.chat-title { font-size: 17px; font-weight: 600; color: #1e293b; }
.chat-box {
  flex: 1; overflow-y: auto; padding: 20px; background: #f8fafc;
  display: flex; flex-direction: column; gap: 14px;
  border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0;
}
.chat-empty { text-align: center; color: #94a3b8; padding: 60px 0; font-size: 14px; }
.chat-msg { display: flex; flex-direction: column; max-width: 70%; }
.chat-msg.mine { align-self: flex-end; }
.chat-msg.mine .chat-bubble { background: #4f46e5; color: #fff; border-radius: 16px 16px 4px 16px; border: none; }
.chat-bubble {
  background: #fff; color: #1e293b; padding: 10px 16px; border-radius: 16px 16px 16px 4px;
  font-size: 14px; line-height: 1.5; word-break: break-word; border: 1px solid #e2e8f0;
}
.chat-time { font-size: 11px; color: #94a3b8; margin-top: 4px; padding: 0 4px; }
.chat-msg.mine .chat-time { text-align: right; }
.chat-input {
  display: flex; gap: 10px; padding: 14px 20px; background: #fff;
  border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;
}
.chat-input :deep(.el-button--primary) { background: #4f46e5; border-color: #4f46e5; border-radius: 8px; }
.chat-input :deep(.el-button--primary:hover) { background: #4338ca; border-color: #4338ca; }
</style>
