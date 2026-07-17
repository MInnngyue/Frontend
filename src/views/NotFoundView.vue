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
  background: #faf6ee;
}
.nf-container {
  text-align: center;
  max-width: 460px;
  padding: 48px 40px 44px;
  background: #f3ecdb;
  transform: rotate(-1.5deg);
  /* 撕掉的告示纸：上下锯齿边缘 */
  clip-path: polygon(
    0% 3%, 4% 0%, 10% 2%, 16% 0%, 23% 3%, 30% 0%, 37% 2%, 44% 0%, 52% 3%, 59% 0%, 66% 2%, 73% 0%, 80% 3%, 87% 0%, 94% 2%, 100% 0%,
    100% 97%, 94% 100%, 87% 98%, 80% 100%, 73% 97%, 66% 100%, 59% 98%, 52% 100%, 44% 97%, 37% 100%, 30% 98%, 23% 100%, 16% 97%, 10% 100%, 4% 98%, 0% 100%
  );
}
.nf-illustration {
  margin-bottom: 18px;
}
.nf-illustration svg {
  width: 220px;
  height: auto;
}
/* 统一主色调：404 用褪色纸痕，点缀改朱砂 */
.nf-illustration svg :deep(text) {
  fill: #c4b896;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
}
.nf-illustration svg :deep(circle),
.nf-illustration svg :deep(rect) {
  fill: #c8553d;
}
.nf-title {
  font-size: 24px;
  font-weight: 700;
  color: #2d2a26;
  margin: 0 0 10px;
  font-family: 'Noto Serif SC', Georgia, serif;
  letter-spacing: -0.3px;
}
.nf-desc {
  font-size: 14px;
  color: #8a8170;
  margin: 0 0 28px;
  line-height: 1.6;
}
.nf-container :deep(.el-button--primary) { background: #c8553d; border-color: #c8553d; border-radius: 6px; }
.nf-container :deep(.el-button--primary:hover) { background: #a8442f; border-color: #a8442f; }
</style>
