# 校园失物招领平台 — 前端设计规范 v3.0

> 日期：2026-07-17 | 状态：待确认 | 风格：方格本 · 书页卡片 · 衬线钢笔字

---

## 一、设计主题

**方格本（Grid Notebook）** — 校园场景天然关联笔记本。
方格本网格提供秩序感，书页卡片提供内容层次，衬线体提供书写感。
整体意象：「在方格本上用钢笔写字」，但执行是现代清爽的，不是复古粗糙的。

受众：高校师生。每页只做一件事：帮用户找到失物或归还失物。

---

## 二、设计令牌

### 2.1 配色

| 令牌 | 值 | 用途 |
|------|------|------|
| --grid-bg | #f8f9fa | 方格本底色 |
| --grid-line | #4a4a4a | 背景网格线（深灰，明显可见） |
| --page | #ffffff | 书页卡片底色（纯白不透明） |
| --page-grid | rgba(100,105,110,0.25) | 卡片网格纹理线 |
| --page-edge | #e2e8f0 | 书页边框 |
| --ink-900 | #1f2937 | 钢笔主文字 |
| --ink-700 | #4b5563 | 次文字 |
| --ink-500 | #6b7280 | 辅助文字 |
| --ink-300 | #9ca3af | 弱文字/占位 |
| --indigo | #4f46e5 | 主操作色（钢笔墨水） |
| --indigo-hover | #4338ca | hover |
| --indigo-active | #3730a3 | active |
| --indigo-light | #eef2ff | 靛蓝浅底 |
| --moss | #059669 | 招领/成功 |
| --moss-light | #ecfdf5 | 松绿浅底 |
| --amber | #d97706 | 认领中 |
| --amber-light | #fffbeb | 琥珀浅底 |
| --rose | #dc2626 | 寻物/删除 |
| --rose-light | #fef2f2 | 玫瑰浅底 |
| --ring-color | #000 | 装订环颜色（全黑） |

### 2.2 字体

| 角色 | 字体 | 用途 |
|------|------|------|
| pen | 'Noto Serif SC', Georgia, serif | 标题、品牌名、区块标题 |
| body | 'Noto Sans SC', -apple-system, sans-serif | 正文、按钮、导航、表单 |
| mono | 'JetBrains Mono', monospace | 时间戳、ID、统计数字 |

### 2.3 字号

| 令牌 | 值 | 用途 |
|------|------|------|
| --fs-display | 34px | 页面标题 |
| --fs-h2 | 22px | 区块标题 |
| --fs-h3 | 17px | 卡片标题 |
| --fs-body | 15px | 正文 |
| --fs-small | 13px | 辅助文字 |
| --fs-caption | 12px | 标签、时间戳 |

### 2.4 间距

| 令牌 | 值 |
|------|------|
| --sp-xs | 4px |
| --sp-sm | 8px |
| --sp-md | 16px |
| --sp-lg | 24px |
| --sp-xl | 40px |

### 2.5 圆角

| 令牌 | 值 | 用途 |
|------|------|------|
| --r-card | 8px | 书页卡片 |
| --r-btn | 6px | 按钮、输入框 |
| --r-tag | 4px | 标签 |

### 2.6 布局

| 令牌 | 值 | 用途 |
|------|------|------|
| --header-h | 60px | 导航栏高度 |
| --max-w | 1280px | 页面最大宽度 |
| --sidebar-w | 260px | 侧边栏宽度 |
| --page-pad | 24px 28px | 页面 padding |

---

## 三、全局背景

方格本网格线，固定在 body::before：

```css
body::before {
  position: fixed; inset: 0; pointer-events: none; z-index: 0;
  background-color: #f8f9fa;
  background-image:
    linear-gradient(#4a4a4a 3px, transparent 3px),
    linear-gradient(90deg, #4a4a4a 3px, transparent 3px);
  background-size: 96px 96px;
}
```

- 网格线颜色 #4a4a4a（深灰，明显可见）
- 线条粗度 3px
- 格子大小 96px × 96px
- 页面容器不设 background，让网格透出

---

## 四、书页卡片（核心组件）

### 4.1 结构

每张书页卡片由三层结构组成：

```html
<div class="card-wrap">
  <div class="bind-rings"><span></span>...</div>  <!-- 装订环 -->
  <div class="note-card">                          <!-- 卡片本体 -->
    内容...
  </div>
</div>
```

### 4.2 卡片本体（.note-card）

- 纯白底 #ffffff（完全不透明）
- 1px 边框 #e2e8f0
- 圆角 8px
- 极淡阴影 0 1px 3px rgba(0,0,0,0.04)
- hover：阴影 0 4px 12px rgba(0,0,0,0.08) + translateY(-2px)
- 左侧 4px 色条（如有类型区分）：寻物 #dc2626 / 招领 #059669

卡片自带纹理（和背景网格完全不同，避免重合）：

```css
.note-card {
  background-color: #ffffff;
  background-image:
    /* 细网格——24px，颜色淡，和背景96px完全不同尺寸 */
    linear-gradient(rgba(100,105,110,0.25) 1px, transparent 1px),
    linear-gradient(90deg, rgba(100,105,110,0.25) 1px, transparent 1px),
    /* 纸纤维粗糙感 */
    radial-gradient(circle at 20% 30%, rgba(120,110,90,0.04) 0.5px, transparent 0.6px),
    radial-gradient(circle at 65% 55%, rgba(120,110,90,0.03) 0.4px, transparent 0.5px),
    radial-gradient(circle at 40% 80%, rgba(120,110,90,0.035) 0.3px, transparent 0.4px),
    radial-gradient(circle at 85% 15%, rgba(120,110,90,0.03) 0.4px, transparent 0.5px);
  background-size: 24px 24px, 24px 24px, 18px 18px, 24px 24px, 20px 20px, 16px 16px;
}
```

### 4.3 装订环（.bind-rings）

卡片顶部等距黑色圆环，模拟活页本装订：

- 位置：卡片顶部 top: -12px，左右内缩 24px
- 每个圆环：20px × 20px，border 4px solid #000，background transparent（中间镂空）
- transform: rotateZ(20deg)（倾斜，看到环的侧面）
- box-shadow: 0 3px 5px rgba(0,0,0,0.3)（立体阴影）
- z-index: 5（高于卡片）
- 数量：根据卡片宽度等距排列，通常 6 个

卡片顶部对应位置有装订孔（.bind-holes）：
- 4px × 4px 黑色圆点，模拟装订针穿透痕迹
- z-index: 3

### 4.4 卷角效果

卡片右下角卷起，模拟书页翻折：

```css
.note-card {
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 28px), calc(100% - 28px) 100%, 0 100%);
}
.note-card::after {
  /* 卷角背面——实色三角 */
  content: '';
  position: absolute; bottom: 0; right: 0;
  width: 28px; height: 28px;
  background: linear-gradient(135deg, #f1f5f9 30%, #e2e8f0 70%, #cbd5e1 100%);
  clip-path: polygon(100% 0, 0 100%, 100% 100%);
  box-shadow: -2px -2px 4px rgba(0,0,0,0.08);
}
.note-card::before {
  /* 卷角对角阴影线——卷起的厚度 */
  content: '';
  position: absolute; bottom: 0; right: 0;
  width: 28px; height: 28px;
  background: linear-gradient(135deg, transparent 47%, rgba(0,0,0,0.1) 50%, transparent 53%);
  clip-path: polygon(100% 0, 0 100%, 100% 100%);
  z-index: 3; pointer-events: none;
}
```

---

## 五、其他共享组件

### 5.1 导航栏

- 白底 #ffffff + 底部 1px #e2e8f0 边框，高 60px，固定顶部
- flex：品牌名（左）+ 导航（中）+ 操作（右）
- 品牌名 24px pen 字体，--ink-900
- 导航链接 15px --ink-500，active 用 --indigo + 2px 底部下划线
- 发布按钮 --indigo 实色白字，退出 ghost

### 5.2 页面标题区（.page-header）

- 标题 34px pen 字体，左对齐
- 副标题 14px --ink-500
- 统计 mono 字体 --indigo 色
- 底部 2px --page-edge 分隔线

### 5.3 筛选卡片

- 书页卡片样式（装订环 + 卷角 + 纸纹理）
- 标题 18px pen 字体
- 选项行：8px 12px，--r-tag 圆角
- active：--indigo-light 底 + --indigo 文字

### 5.4 按钮

| 类型 | 样式 |
|------|------|
| 主按钮 | --indigo 底 + 白文字 + --r-btn |
| 次按钮 | --page 底 + --page-edge 边框 + --ink-700 文字 |
| 危险按钮 | --rose 底 + 白文字 |
| Ghost | 无底无边框 + --ink-500 文字 |

### 5.5 表单

- 输入框：--page 底 + --page-edge 边框 + --r-btn 圆角
- focus：--indigo 边框
- label：--ink-700 + 500 字重

### 5.6 标签

| 类型 | 底色 | 文字色 |
|------|------|--------|
| 寻物 | --rose-light | --rose |
| 招领 | --moss-light | --moss |
| 进行中 | --indigo-light | --indigo-hover |
| 认领中 | --amber-light | --amber |
| 已完结 | --moss-light | --moss |
| 已归档/下架 | #f3f4f6 | --ink-500 |

### 5.7 空状态

居中，--ink-500 主文字 + --ink-300 副文字 + 引导按钮（如有）

### 5.8 分页器

白底按钮 + --page-edge 边框，hover --indigo-light 底，active --indigo 底白文字

---

## 六、页面布局

### 列表页（失物广场、我的帖子）

左卡片 2列 gap 20px + 右侧筛选 260px

### 详情页

max-width 800px 居中，书页卡片纵向堆叠

### 表单页

max-width 800px 居中，书页卡片包裹表单

### 登录页

全屏居中，一张书页卡片 + 底部 slogan

### 管理后台

侧边 200px 导航 + 内容区表格/图表

### 消息/私信

消息列表 300px + 聊天区 flex:1

---

## 七、实现

### CSS 变量集中管理

App.vue 定义所有变量，页面用 var(--xxx) 引用。

### 统一 class

- .page — 页面根容器
- .page-header — 标题区
- .card-wrap — 卡片外层（含装订环）
- .note-card — 书页卡片本体
- .bind-rings — 装订环
- .bind-holes — 装订孔
- .filter-card — 筛选卡片

### 重写顺序

| 阶段 | 文件 |
|------|------|
| 0 | App.vue（变量+导航+背景） |
| 1 | main.js（Element Plus 覆盖） |
| 2 | LoginView.vue |
| 3 | PostSquare.vue |
| 4 | PostDetail.vue |
| 5 | PostPublish.vue |
| 6 | HomeView.vue |
| 7 | ClaimProgress.vue |
| 8 | MessagesView + ChatView |
| 9 | MyPostsView.vue |
| 10 | AdminDashboard.vue |
| 11 | NotFoundView.vue |

每阶段 commit + push。

---

## 八、约束

- 卡片允许极淡层次阴影（0 1px 3px rgba(0,0,0,0.04)）
- 装订环允许立体阴影（0 3px 5px rgba(0,0,0,0.3)）
- 卷角允许阴影（-2px -2px 4px rgba(0,0,0,0.08)）
- 其他位置禁止 box-shadow 装饰
- 禁止全局渐变
- 禁止 emoji（用 SVG）
- 时间显示 .replace('T', ' ')
- 删除操作二级确认
- Element Plus 主色通过 main.js 覆盖
- 所有颜色用 var(--xxx)，不硬编码 hex
- 衬线体只用于标题级文字，正文/按钮/导航用无衬线
- 卡片纹理必须和背景网格尺寸不同（卡片24px / 背景96px），避免重合导致视觉透明
