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
      <div v-if="messages.length === 0" style="text-align:center;color:#c0c4cc;padding:60px 0">暂无消息，发送第一条私信吧</div>
    </div>
    <div class="chat-input">
      <el-input v-model="text" placeholder="输入消息..." maxlength="500" @keyup.enter="send" />
      <el-button type="primary" :loading="sending" @click="send">发送</el-button>
    </div>
  </div>
</template>

<style scoped>
.chat-page { max-width: 700px; margin: 0 auto; height: calc(100vh - 84px); display: flex; flex-direction: column; }
.chat-header { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: #fff; border-bottom: 1px solid #f0f0f0; }
.chat-title { font-size: 16px; font-weight: 600; color: #303133; }
.chat-box { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
.chat-msg { display: flex; flex-direction: column; max-width: 70%; }
.chat-msg.mine { align-self: flex-end; }
.chat-msg.mine .chat-bubble { background: #3b82f6; color: #fff; }
.chat-bubble { background: #f3f4f6; color: #303133; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.5; word-break: break-word; }
.chat-time { font-size: 11px; color: #c0c4cc; margin-top: 4px; }
.chat-msg.mine .chat-time { text-align: right; }
.chat-input { display: flex; gap: 10px; padding: 12px 16px; background: #fff; border-top: 1px solid #f0f0f0; }
</style>
