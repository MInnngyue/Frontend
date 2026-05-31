<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
function goHome() { router.push('/') }
</script>

<template>
  <div class="notfound-page">
    <div class="nf-container">
      <div class="nf-illustration">
        <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
          <text x="100" y="90" text-anchor="middle" font-size="90" font-weight="800" fill="#e5e7eb">404</text>
          <circle cx="100" cy="30" r="20" fill="#fbbf24" opacity="0.9" />
          <rect x="85" y="52" rx="3" width="30" height="4" fill="#fbbf24" opacity="0.4" />
          <rect x="88" y="58" rx="2" width="24" height="3" fill="#fbbf24" opacity="0.2" />
        </svg>
      </div>
      <h2 class="nf-title">找不到这个页面</h2>
      <p class="nf-desc">地址可能输错了，或者页面已经被移走了。</p>
      <el-button type="primary" size="large" round @click="goHome">返回首页</el-button>
    </div>
  </div>
</template>

<style scoped>
.notfound-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 80px);
  padding: 40px 20px;
}
.nf-container {
  text-align: center;
  max-width: 420px;
}
.nf-illustration {
  margin-bottom: 24px;
}
.nf-illustration svg {
  width: 220px;
  height: auto;
}
.nf-title {
  font-size: 22px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 10px;
}
.nf-desc {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 28px;
  line-height: 1.6;
}
.nf-container :deep(.el-button--primary) { background: #4f46e5; border-color: #4f46e5; border-radius: 8px; }
.nf-container :deep(.el-button--primary:hover) { background: #4338ca; border-color: #4338ca; }
</style>
