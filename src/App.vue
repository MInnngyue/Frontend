<script setup>
import { ref, computed, onMounted, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getUnreadCount } from '@/api/message'
import { getConversations } from '@/api/pm'

const route = useRoute()
const router = useRouter()

const showNav = computed(() => {
  if (route.path === '/login') return false
  if (route.path.startsWith('/admin')) return false
  return true
})
const isPublishPage = computed(() => route.path === '/publish')
const unreadCount = ref(0)
const pmUnread = ref(0)

function isActive(path) {
  return route.path === path
}

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  router.push('/login')
}

async function loadUnreadCount() {
  try {
    const res = await getUnreadCount()
    unreadCount.value = res.data
    const cres = await getConversations()
    pmUnread.value = cres.data.reduce((s, c) => s + (c.unread || 0), 0)
  } catch { }
}

provide('refreshUnread', loadUnreadCount)

onMounted(() => {
  loadUnreadCount()
  setInterval(loadUnreadCount, 30000)
})
</script>

<template>
  <div class="app-shell">
    <!-- user navigation -->
    <header v-if="showNav" class="app-header">
      <div class="header-inner">
        <div class="brand" @click="router.push('/')">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          <span class="brand-text">校园失物招领</span>
        </div>

        <nav class="nav-links">
          <router-link to="/" :class="{ active: isActive('/') }">失物广场</router-link>
          <router-link to="/publish" :class="{ active: isActive('/publish') }">发布帖子</router-link>
          <router-link to="/messages" :class="{ active: isActive('/messages') }" class="nav-msg-link">
            消息
            <span v-if="unreadCount + pmUnread > 0" class="badge-count">{{ unreadCount + pmUnread }}</span>
          </router-link>
          <router-link to="/claims" :class="{ active: isActive('/claims') }">认领进度</router-link>
          <router-link to="/profile" :class="{ active: isActive('/profile') }">个人中心</router-link>
        </nav>

        <div class="header-right">
          <button v-if="isPublishPage" class="btn-secondary" @click="router.push('/')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            返回广场
          </button>
          <button v-else class="btn-primary" @click="router.push('/publish')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            发布帖子
          </button>
          <button class="btn-ghost" @click="logout">退出</button>
        </div>
      </div>
    </header>

    <main :class="{ 'has-header': showNav }">
      <router-view />
    </main>
  </div>
</template>

<style>
/* ===== design tokens ===== */
:root {
  --grid-bg: #f8f9fa;
  --grid-line: #4a4a4a;
  --page: #ffffff;
  --page-grid: rgba(100,105,110,0.25);
  --page-edge: #e2e8f0;
  --ink-900: #1f2937;
  --ink-700: #4b5563;
  --ink-500: #6b7280;
  --ink-300: #9ca3af;
  --indigo: #4f46e5;
  --indigo-hover: #4338ca;
  --indigo-active: #3730a3;
  --indigo-light: #eef2ff;
  --moss: #059669;
  --moss-light: #ecfdf5;
  --amber: #d97706;
  --amber-light: #fffbeb;
  --rose: #dc2626;
  --rose-light: #fef2f2;
  --ring-color: #000;
  --shadow-card: 0 1px 3px rgba(0,0,0,0.04);
  --shadow-hover: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-ring: 0 3px 5px rgba(0,0,0,0.3);
  --shadow-corner: -2px -2px 4px rgba(0,0,0,0.08);
  --fs-display: 34px;
  --fs-h2: 22px;
  --fs-h3: 17px;
  --fs-body: 15px;
  --fs-small: 13px;
  --fs-caption: 12px;
  --sp-xs: 4px;
  --sp-sm: 8px;
  --sp-md: 16px;
  --sp-lg: 24px;
  --sp-xl: 40px;
  --r-card: 8px;
  --r-btn: 6px;
  --r-tag: 4px;
  --r-pill: 9999px;
  --header-h: 60px;
  --max-w: 1280px;
  --sidebar-w: 260px;
  --page-pad: 24px 28px;
  --admin-sidebar: 200px;
  --transition: all 0.15s ease;
  --transition-slow: all 0.2s ease;
  --pen-font: 'Noto Serif SC', Georgia, serif;
  --body-font: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --mono-font: 'JetBrains Mono', 'Courier New', monospace;
}

* { margin: 0; padding: 0; box-sizing: border-box; }
html { overflow-y: scroll; }

body {
  font-family: var(--body-font);
  color: var(--ink-900);
}

/* ===== grid notebook background ===== */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-color: var(--grid-bg);
  background-image:
    linear-gradient(var(--grid-line) 3px, transparent 3px),
    linear-gradient(90deg, var(--grid-line) 3px, transparent 3px);
  background-size: 96px 96px;
}

.app-shell { position: relative; z-index: 1; }

/* ===== user navigation ===== */
.app-header {
  position: fixed; top: 0; left: 0; right: 0;
  height: var(--header-h);
  background: var(--page);
  border-bottom: 1px solid var(--page-edge);
  z-index: 100;
}

.header-inner {
  max-width: var(--max-w);
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  gap: 24px;
}

.brand {
  font-family: var(--pen-font);
  font-size: 24px;
  font-weight: 700;
  color: var(--ink-900);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
  flex-shrink: 0;
}
.brand svg { color: var(--indigo); flex-shrink: 0; }

.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  justify-content: center;
}

.nav-links a {
  text-decoration: none;
  color: var(--ink-500);
  padding: 6px 16px;
  font-size: 15px;
  font-weight: 500;
  transition: var(--transition);
  position: relative;
}
.nav-links a:hover { color: var(--ink-900); }
.nav-links a.active { color: var(--indigo); font-weight: 600; }
.nav-links a.active::after {
  content: '';
  position: absolute;
  bottom: -4px; left: 16px; right: 16px;
  height: 2px;
  border-radius: 1px;
  background: var(--indigo);
}

.nav-msg-link { position: relative; }
.badge-count {
  position: absolute; top: -2px; right: -4px;
  background: var(--indigo); color: #fff;
  font-size: 11px; font-weight: 600;
  min-width: 18px; height: 18px;
  border-radius: var(--r-pill);
  display: flex; align-items: center; justify-content: center;
  padding: 0 5px;
}

.header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

/* ===== buttons ===== */
.btn-primary {
  background: var(--indigo); color: #fff; border: none;
  border-radius: var(--r-btn); padding: 8px 18px;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: var(--transition);
  display: inline-flex; align-items: center; gap: 6px;
  white-space: nowrap;
}
.btn-primary:hover { background: var(--indigo-hover); }
.btn-primary:active { background: var(--indigo-active); transform: scale(0.97); }

.btn-secondary {
  background: var(--page); color: var(--ink-700);
  border: 1px solid var(--page-edge);
  border-radius: var(--r-btn); padding: 8px 18px;
  font-size: 14px; font-weight: 500; cursor: pointer;
  transition: var(--transition);
  display: inline-flex; align-items: center; gap: 6px;
  white-space: nowrap;
}
.btn-secondary:hover { border-color: #cbd5e1; color: var(--ink-900); }
.btn-secondary:active { transform: scale(0.97); }

.btn-danger {
  background: var(--rose); color: #fff; border: none;
  border-radius: var(--r-btn); padding: 8px 18px;
  font-size: 14px; font-weight: 600; cursor: pointer;
  transition: var(--transition);
}
.btn-danger:hover { background: #b91c1c; }
.btn-danger:active { transform: scale(0.97); }

.btn-ghost {
  background: none; border: none; color: var(--ink-500);
  font-size: 14px; padding: 6px 10px; cursor: pointer;
  transition: var(--transition); font-weight: 500;
}
.btn-ghost:hover { color: var(--ink-900); background: rgba(0,0,0,0.04); }
.btn-ghost:active { transform: scale(0.97); }

/* icon button */
.btn-icon {
  background: none; border: none;
  width: 32px; height: 32px;
  border-radius: var(--r-btn);
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; color: var(--ink-500);
  transition: var(--transition);
}
.btn-icon:hover { background: rgba(0,0,0,0.04); color: var(--ink-900); }

main.has-header {
  padding-top: var(--header-h);
  min-height: 100vh;
}

/* ===== shared layout classes ===== */
.page {
  max-width: var(--max-w);
  margin: 0 auto;
  padding: var(--page-pad);
  min-height: calc(100vh - var(--header-h));
  position: relative;
  z-index: 1;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: var(--sp-lg);
  padding-bottom: var(--sp-md);
  border-bottom: 2px solid var(--page-edge);
}
.page-header h1 {
  font-family: var(--pen-font);
  font-size: var(--fs-display);
  font-weight: 700;
  color: var(--ink-900);
  margin: 0;
}
.page-header .subtitle {
  font-size: 14px;
  color: var(--ink-500);
  margin-top: 4px;
}
.page-header .stat-num {
  font-family: var(--mono-font);
  font-size: 32px;
  font-weight: 700;
  color: var(--indigo);
}
.page-header .stat-label {
  font-size: 14px;
  color: var(--ink-500);
  margin-left: 6px;
}

/* ===== note card (book page) ===== */
.card-wrap {
  position: relative;
}

.bind-rings {
  position: absolute;
  top: -12px;
  left: 24px;
  right: 24px;
  height: 24px;
  display: flex;
  justify-content: space-between;
  z-index: 5;
  pointer-events: none;
}
.bind-rings span {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 4px solid var(--ring-color);
  background: transparent;
  display: block;
  transform: rotateZ(20deg);
  box-shadow: var(--shadow-ring);
}

.note-card {
  position: relative;
  background-color: var(--page);
  background-image:
    linear-gradient(var(--page-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--page-grid) 1px, transparent 1px),
    radial-gradient(circle at 20% 30%, rgba(120,110,90,0.04) 0.5px, transparent 0.6px),
    radial-gradient(circle at 65% 55%, rgba(120,110,90,0.03) 0.4px, transparent 0.5px),
    radial-gradient(circle at 40% 80%, rgba(120,110,90,0.035) 0.3px, transparent 0.4px),
    radial-gradient(circle at 85% 15%, rgba(120,110,90,0.03) 0.4px, transparent 0.5px);
  background-size: 24px 24px, 24px 24px, 18px 18px, 24px 24px, 20px 20px, 16px 16px;
  border: 1px solid var(--page-edge);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-card);
  z-index: 1;
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 28px), calc(100% - 28px) 100%, 0 100%);
  transition: var(--transition-slow);
}
.note-card:hover {
  box-shadow: var(--shadow-hover);
  transform: translateY(-2px);
}
.note-card::after {
  content: '';
  position: absolute;
  bottom: 0; right: 0;
  width: 28px; height: 28px;
  background: linear-gradient(135deg, #f1f5f9 30%, #e2e8f0 70%, #cbd5e1 100%);
  clip-path: polygon(100% 0, 0 100%, 100% 100%);
  box-shadow: var(--shadow-corner);
}
.note-card::before {
  content: '';
  position: absolute;
  bottom: 0; right: 0;
  width: 28px; height: 28px;
  background: linear-gradient(135deg, transparent 47%, rgba(0,0,0,0.1) 50%, transparent 53%);
  clip-path: polygon(100% 0, 0 100%, 100% 100%);
  z-index: 3;
  pointer-events: none;
}

/* card with stripe */
.note-card.has-stripe { padding-left: 4px; }
.stripe-lost { background: var(--rose); }
.stripe-found { background: var(--moss); }

/* ===== tags ===== */
.tag-type, .tag-status {
  display: inline-block;
  font-size: var(--fs-caption);
  padding: 2px 8px;
  border-radius: var(--r-tag);
  font-weight: 600;
}
.tag-type.lost { background: var(--rose-light); color: var(--rose); border: 1px solid #fecaca; }
.tag-type.found { background: var(--moss-light); color: var(--moss); border: 1px solid #bbf7d0; }
.tag-status.s-0 { background: var(--indigo-light); color: var(--indigo-hover); }
.tag-status.s-1, .tag-status.s-2 { background: var(--amber-light); color: var(--amber); }
.tag-status.s-3 { background: var(--moss-light); color: var(--moss); }
.tag-status.s-4, .tag-status.s-5 { background: #f3f4f6; color: var(--ink-500); }

/* tab pill */
.tab-pill {
  background: transparent;
  color: var(--ink-700);
  border: 1px solid var(--page-edge);
  border-radius: var(--r-pill);
  padding: 6px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: var(--transition);
}
.tab-pill:hover { background: var(--indigo-light); color: var(--indigo); }
.tab-pill.active { background: var(--indigo); color: #fff; border-color: var(--indigo); font-weight: 600; }

/* ===== avatar ===== */
.avatar {
  border-radius: 50%;
  background: var(--indigo);
  color: #fff;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.avatar-lg { width: 44px; height: 44px; font-size: 18px; }
.avatar-md { width: 36px; height: 36px; font-size: 14px; }
.avatar-sm { width: 28px; height: 28px; font-size: 12px; }

/* ===== empty state ===== */
.empty-state { text-align: center; padding: 80px 0; }
.empty-state .empty-text { font-size: 16px; color: var(--ink-500); margin: 0 0 6px; }
.empty-state .empty-hint { font-size: 13px; color: var(--ink-300); margin: 0 0 20px; }

/* ===== el-plus global overrides ===== */
.el-dialog { border-radius: var(--r-card) !important; border: 1px solid var(--page-edge); box-shadow: var(--shadow-hover) !important; background: var(--page) !important; }
.el-dialog__header { padding: 18px 24px 0 !important; }
.el-dialog__title { font-family: var(--pen-font) !important; font-size: 17px !important; font-weight: 700 !important; color: var(--ink-900) !important; }
.el-dialog__body { padding: 22px 24px !important; color: var(--ink-700); }
.el-dialog__footer { padding: 10px 24px 18px !important; }
.el-dialog .el-button--primary { background: var(--indigo) !important; border-color: var(--indigo) !important; border-radius: var(--r-btn) !important; font-weight: 600 !important; }
.el-dialog .el-button--primary:hover { background: var(--indigo-hover) !important; }
.el-dialog .el-button { border-radius: var(--r-btn) !important; }

.el-message-box { border-radius: var(--r-card) !important; border: 1px solid var(--page-edge); box-shadow: var(--shadow-hover) !important; background: var(--page) !important; }
.el-message-box__header { padding: 18px 24px 6px !important; }
.el-message-box__title { font-family: var(--pen-font) !important; font-size: 17px !important; font-weight: 700 !important; color: var(--ink-900) !important; }
.el-message-box__body { padding: 6px 24px 22px !important; }
.el-message-box__message { color: var(--ink-500) !important; font-size: 14px !important; }
.el-message-box__btns .el-button--primary { background: var(--indigo) !important; border-color: var(--indigo) !important; border-radius: var(--r-btn) !important; font-weight: 600 !important; }
.el-message-box__btns .el-button--primary:hover { background: var(--indigo-hover) !important; }
.el-message-box__btns .el-button { border-radius: var(--r-btn) !important; }
.el-message-box__status.el-icon-warning { color: var(--amber) !important; }

/* el-message toast */
.el-message { border-radius: var(--r-btn) !important; background: var(--page) !important; border: 1px solid var(--page-edge) !important; box-shadow: var(--shadow-hover) !important; }
.el-message--success { border-left: 3px solid var(--moss) !important; }
.el-message--error { border-left: 3px solid var(--rose) !important; }
.el-message--warning { border-left: 3px solid var(--amber) !important; }
.el-message--info { border-left: 3px solid var(--indigo) !important; }
.el-message__content { color: var(--ink-900) !important; }

/* el-input */
.el-input__wrapper {
  border-radius: var(--r-btn) !important;
  background: var(--page) !important;
  box-shadow: 0 0 0 1px #d1d5db inset !important;
  transition: var(--transition) !important;
}
.el-input__wrapper:hover { box-shadow: 0 0 0 1px #b0b8c1 inset !important; }
.el-input.is-focus .el-input__wrapper,
.el-input__wrapper.is-focus {
  box-shadow: 0 0 0 1px var(--indigo) inset, 0 0 0 3px rgba(79,70,229,0.1) !important;
}
.el-input__inner { color: var(--ink-900) !important; }
.el-input__inner::placeholder { color: var(--ink-300) !important; }

/* el-textarea */
.el-textarea__inner {
  border-radius: var(--r-btn) !important;
  border: 1px solid #d1d5db !important;
  background: var(--page) !important;
  color: var(--ink-900) !important;
  transition: var(--transition) !important;
}
.el-textarea__inner:hover { border-color: #b0b8c1 !important; }
.el-textarea__inner:focus { border-color: var(--indigo) !important; box-shadow: 0 0 0 3px rgba(79,70,229,0.1) !important; }
.el-textarea__inner::placeholder { color: var(--ink-300) !important; }

/* el-select */
.el-select .el-select__wrapper {
  border-radius: var(--r-btn) !important;
  background: var(--page) !important;
  box-shadow: 0 0 0 1px #d1d5db inset !important;
}
.el-select .el-select__wrapper:hover { box-shadow: 0 0 0 1px #b0b8c1 inset !important; }
.el-select.is-focused .el-select__wrapper { box-shadow: 0 0 0 1px var(--indigo) inset, 0 0 0 3px rgba(79,70,229,0.1) !important; }
.el-select-dropdown { border-radius: var(--r-card) !important; border: 1px solid var(--page-edge) !important; box-shadow: var(--shadow-hover) !important; }
.el-select-dropdown__item.hover, .el-select-dropdown__item:hover { background: var(--indigo-light) !important; }
.el-select-dropdown__item.selected { color: var(--indigo) !important; font-weight: 600; }

/* el-radio */
.el-radio__input.is-checked .el-radio__inner { background-color: var(--indigo) !important; border-color: var(--indigo) !important; }
.el-radio__input.is-checked + .el-radio__label { color: var(--indigo) !important; }
.el-radio__inner { border-color: #d1d5db !important; }
.el-radio__label { color: var(--ink-700) !important; }

/* el-date-picker */
.el-date-editor.el-input__wrapper {
  border-radius: var(--r-btn) !important;
  box-shadow: 0 0 0 1px #d1d5db inset !important;
}

/* el-upload */
.el-upload-dragger {
  border: 1px dashed #d1d5db !important;
  border-radius: var(--r-card) !important;
  background: var(--page) !important;
  transition: var(--transition) !important;
}
.el-upload-dragger:hover { border-color: var(--indigo) !important; background: var(--indigo-light) !important; }

/* el-button global */
.el-button--primary {
  --el-button-bg-color: var(--indigo);
  --el-button-border-color: var(--indigo);
  --el-button-hover-bg-color: var(--indigo-hover);
  --el-button-hover-border-color: var(--indigo-hover);
  --el-button-active-bg-color: var(--indigo-active);
  --el-button-active-border-color: var(--indigo-active);
  border-radius: var(--r-btn) !important;
}
.el-button { border-radius: var(--r-btn) !important; }

/* el-pagination */
.el-pagination.is-background .btn-prev,
.el-pagination.is-background .btn-next,
.el-pagination.is-background .el-pager li {
  background: var(--page) !important;
  border: 1px solid var(--page-edge) !important;
  border-radius: var(--r-btn) !important;
  color: var(--ink-700) !important;
  font-weight: 500;
}
.el-pagination.is-background .el-pager li:hover { background: var(--indigo-light) !important; color: var(--indigo) !important; }
.el-pagination.is-background .el-pager li.is-active { background: var(--indigo) !important; color: #fff !important; border-color: var(--indigo) !important; }

/* el-loading */
.el-loading-mask { background: rgba(255,255,255,0.7) !important; }
.el-loading-spinner .path { stroke: var(--indigo) !important; }
.el-loading-text { color: var(--ink-500) !important; }

/* el-image */
.el-image { border: 1px solid var(--page-edge); border-radius: var(--r-card); overflow: hidden; }

/* el-table */
.el-table { border: 1px solid var(--page-edge); border-radius: var(--r-card); overflow: hidden; }
.el-table th.el-table__cell { background: #f9fafb !important; color: var(--ink-700) !important; font-weight: 600; }
.el-table tr:hover > td { background: #f9fafb !important; }
.el-table td.el-table__cell { border-bottom: 1px solid #f3f4f6; }

/* el-form labels */
.el-form-item__label { color: var(--ink-700) !important; font-weight: 500; }

/* el-link */
.el-link.el-link--primary { --el-link-text-color: var(--indigo); --el-link-hover-text-color: var(--indigo-hover); }
</style>
