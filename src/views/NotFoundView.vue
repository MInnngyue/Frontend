<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()
function goHome() { router.push('/') }
</script>

<template>
  <div class="notfound-page">
    <div class="nf-content">
      <div class="nf-code">404</div>
      <h2 class="nf-title">页面不存在</h2>
      <p class="nf-desc">地址可能输错了，或者页面已经被移走了。</p>
      <button class="btn-primary nf-btn" @click="goHome">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
        返回广场
      </button>
    </div>
  </div>
</template>

<style scoped>
.notfound-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40px 20px;
  position: relative;
  z-index: 1;
}

.nf-content {
  text-align: center;
  max-width: 480px;
  padding: 56px 48px;
  background: var(--page);
  border: 1px solid var(--page-edge);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-card);
}

.nf-code {
  font-family: var(--mono-font);
  font-size: 120px;
  font-weight: 700;
  color: var(--ink-300);
  line-height: 1;
  letter-spacing: -4px;
  margin-bottom: 16px;
}

.nf-title {
  font-family: var(--pen-font);
  font-size: 24px;
  font-weight: 700;
  color: var(--ink-900);
  margin: 0 0 10px;
  letter-spacing: -0.3px;
}

.nf-desc {
  font-size: 15px;
  color: var(--ink-500);
  margin: 0 0 32px;
  line-height: 1.6;
}

.nf-btn {
  margin: 0 auto;
}
</style>
