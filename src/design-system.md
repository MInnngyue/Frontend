# 校园失物招领平台 — 前端设计规范

> 版本：2.0 | 日期：2026-07-17
> 状态：待确认
> 原则：完全推翻旧设计，所有页面统一规格

---

## 一、设计主题

**公告板（Bulletin Board）** — 校园失物招领的本质是贴告示找东西。
整个产品是一面公告板：帖子是便签纸，筛选栏是索引卡，导航是板顶横幅。

受众：高校师生。场景：丢了东西或捡到东西，快速发布、快速找到。
每页只做一件事：帮用户找到失物或归还失物。

---

## 二、设计令牌（Design Tokens）

### 2.1 配色

| 令牌 | 值 | 用途 |
|------|------|------|
| --paper-base | #e8dfc8 | 牛皮纸底色（全局背景） |
| --paper-card | #f3ecdb | 便签纸/卡片底色 |
| --paper-light | #faf6ee | 浅纸色（输入框/选中态底色） |
| --ink-900 | #2d2a26 | 主文字/标题 |
| --ink-700 | #5c5448 | 次文字/正文 |
| --ink-500 | #8a8170 | 辅助文字/说明 |
| --ink-300 | #b0a690 | 弱文字/占位符 |
| --vermilion | #c8553d | 主操作色（按钮/链接/active） |
| --vermilion-hover | #a8442f | hover 态 |
| --vermilion-active | #8e3826 | active 态 |
| --vermilion-light | #f7ede9 | 朱砂浅底（选中/标签底） |
| --moss | #6b8e4e | 招领类型/成功状态 |
| --moss-light | #e8efd9 | 苔绿浅底 |
| --amber | #c9956b | 认领中状态 |
| --amber-light | #f5ebd6 | 琥珀浅底 |
| --warn | #b54a3a | 删除/寻物类型 |
| --warn-light | #f7ede9 | 警示浅底 |
| --border | #d9cfb8 | 默认边框 |
| --border-strong | #c4b896 | 深边框/卡片底边 |

### 2.2 字体

| 角色 | 字体族 | 用途 |
|------|--------|------|
| display | 'Noto Serif SC', Georgia, serif | 页面标题、品牌名、区块标题 |
| body | 'Noto Sans SC', -apple-system, sans-serif | 正文、按钮、导航、表单 |
| mono | 'JetBrains Mono', 'Courier New', monospace | 时间戳、数字、ID、统计数 |

### 2.3 字号阶梯

| 令牌 | 值 | 用途 |
|------|------|------|
| --fs-display | 34px | 页面主标题（h1） |
| --fs-h2 | 22px | 区块标题（h2） |
| --fs-h3 | 17px | 卡片标题（h3） |
| --fs-body | 15px | 正文 |
| --fs-small | 13px | 辅助文字、meta |
| --fs-caption | 12px | 标签、时间戳 |

### 2.4 间距

| 令牌 | 值 | 用途 |
|------|------|------|
| --sp-xs | 4px | 标签内间距 |
| --sp-sm | 8px | 元素间小间距 |
| --sp-md | 16px | 卡片内间距、元素间标准间距 |
| --sp-lg | 24px | 区块间距 |
| --sp-xl | 40px | 页面区块大间距 |

### 2.5 圆角

| 令牌 | 值 | 用途 |
|------|------|------|
| --r-card | 6px | 卡片 |
| --r-btn | 6px | 按钮、输入框 |
| --r-tag | 4px | 标签、胶囊 |
| --r-pin | 50% | 图钉（圆形） |

### 2.6 布局

| 令牌 | 值 | 用途 |
|------|------|------|
| --header-h | 60px | 导航栏高度 |
| --max-w | 1280px | 页面最大宽度 |
| --sidebar-w | 260px | 侧边栏宽度 |
| --page-pad | 24px 28px | 页面 padding |

---

## 三、全局背景

牛皮纸粗糙纹理，固定在 body::before，所有页面透出同一纹理。

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background-color: #e8dfc8;
  background-image:
    /* 8层大纤维 + 4层中纤维 + 细颗粒 + 横纵纹理线 */;
}
```

所有页面容器不设 background，让全局纹理透出。

---

## 四、共享组件规范

### 4.1 导航栏（App.vue）

- 固定顶部，高 60px，深墨底 #2d2a26，底部 3px 朱砂红线
- flex 布局：品牌名（左）+ 导航链接（中）+ 操作按钮（右）
- 品牌名 26px display 字体，图钉 SVG 朱砂色
- 导航链接 15px，active 用 3px 底部下划线
- 发布按钮朱砂实色，退出按钮 ghost 文字样式

### 4.2 页面标题区（所有内容页通用）

```
┌──────────────────────────────────────────┐
│  页面标题                    统计数字     │
│  副标题说明                              │
├──────────────────────────────────────────┘
  2px solid --border 分隔线
```

- 标题 34px display 字体，左对齐
- 副标题 14px --ink-500
- 右侧统计（如有）用 mono 字体，朱砂色数字
- 底部 2px 分隔线

### 4.3 卡片（便签纸）

所有卡片统一：
- 底色 --paper-card
- 边框 1px --border + 底部 3px --border-strong（纸厚度）
- 圆角 --r-card
- hover：translateY(-3px) + 底边变深
- 左侧 4px 色条（如有类型区分）：寻物=--vermilion / 招领=--moss
- 图钉（如有）：顶部居中，30px 圆，SVG 16px

### 4.4 筛选卡片（索引卡）

- 底色 --paper-card
- 标题 18px display 字体
- 选项行：8px 12px padding，4px 圆角
- active：--vermilion-light 底 + --vermilion 文字

### 4.5 按钮

| 类型 | 样式 |
|------|------|
| 主按钮 | --vermilion 底 + --paper-light 文字，6px 圆角 |
| 次按钮 | --paper-card 底 + --border 边框 + --ink-700 文字 |
| 危险按钮 | --warn 底 + 白文字 |
| Ghost | 无底无边框，--ink-500 文字，hover 变 --ink-300 |

### 4.6 表单

- 输入框：--paper-light 底，--border 边框，6px 圆角
- focus：--vermilion 边框
- label：--ink-700，500 字重

### 4.7 标签

| 类型 | 底色 | 文字色 |
|------|------|--------|
| 寻物 | --vermilion-light | --vermilion |
| 招领 | --moss-light | --moss |
| 进行中 | --vermilion-light | --vermilion-hover |
| 认领中 | --amber-light | --amber |
| 已完结 | --moss-light | --moss |
| 已归档/下架 | --paper-card | --ink-500 |

### 4.8 空状态

- 居中，--ink-500 主文字 + --ink-300 副文字
- 引导按钮（如有）

### 4.9 分页器

- 纸色系按钮：--paper-card 底 + --border 边框
- hover：--vermilion-light 底 + --vermilion 文字
- active：--vermilion 底 + 白文字

---

## 五、页面布局规则

### 5.1 列表页（失物广场、我的帖子）

```
┌──────────────────────────────────────────────┐
│  页面标题                        N条帖子     │
│  副标题                                      │
├──────────────────────────────────┬───────────┤
│  ┌──────┐ ┌──────┐               │ 筛选卡片  │
│  │ 卡片  │ │ 卡片  │               │ 搜索     │
│  └──────┘ └──────┘               │ 类型     │
│  ┌──────┐ ┌──────┐               │ 状态     │
│  │ 卡片  │ │ 卡片  │               │ 分类     │
│  └──────┘ └──────┘               │           │
│           分页器                  │           │
└──────────────────────────────────┴───────────┘
  卡片区 flex:1                     侧边栏 260px
  卡片 2列，gap 20px
```

### 5.2 详情页（帖子详情）

```
┌──────────────────────────────────────────┐
│  ← 返回                                   │
├──────────────────────────────────────────┤
│  便签纸卡片：类型标签 + 标题              │
│  分类 · 地点 · 时间                       │
├──────────────────────────────────────────┤
│  便签纸卡片：描述文字                     │
├──────────────────────────────────────────┤
│  便签纸卡片：图片网格                     │
├──────────────────────────────────────────┤
│  便签纸卡片：发布者信息 + 操作按钮        │
├──────────────────────────────────────────┤
│  便签纸卡片：评论区                       │
└──────────────────────────────────────────┘
  max-width 800px 居中
```

### 5.3 表单页（发布帖子）

```
┌──────────────────────────────────────────┐
│  页面标题                                 │
├──────────────────────────────────────────┤
│  便签纸卡片：表单                         │
│  类型选择 / 标题 / 描述 / 图片上传 / ...  │
│  提交按钮                                 │
└──────────────────────────────────────────┘
  max-width 800px 居中
```

### 5.4 登录页

```
┌──────────────────────────────────────────┐
│              ┌──────────┐                │
│              │  图钉     │                │
│              │ 便签纸卡片 │                │
│              │ 标题      │                │
│              │ 表单      │                │
│              │ 按钮      │                │
│              └──────────┘                │
│           底部 slogan                      │
└──────────────────────────────────────────┘
  全屏居中，纸纹背景
```

### 5.5 管理后台

```
┌──────────────────────────────────────────┐
│  页面标题                  统计面板       │
├────────────┬─────────────────────────────┤
│  侧边导航   │  数据表格 / 图表            │
│  帖子管理   │  便签纸卡片包裹             │
│  用户管理   │                             │
│  分类管理   │                             │
└────────────┴─────────────────────────────┤
  侧边 200px + 内容 flex:1
```

### 5.6 消息/私信

```
┌──────────────────────────────────────────┐
│  页面标题                                 │
├────────────────┬─────────────────────────┤
│  消息列表       │  聊天区域 / 消息详情     │
│  便签纸卡片行   │  对话气泡                │
│                │  输入框                  │
└────────────────┴─────────────────────────┤
  列表 300px + 聊天 flex:1
```

---

## 六、实现方式

### 6.1 CSS 变量集中管理

在 App.vue `<style>` 块定义所有 --paper-* / --ink-* / --vermilion-* 变量，
所有页面通过 `var(--xxx)` 引用，改一处全局生效。

### 6.2 页面容器统一

所有页面根容器用同一 class `.page`：
```css
.page {
  max-width: var(--max-w);
  margin: 0 auto;
  padding: var(--page-pad);
  min-height: calc(100vh - var(--header-h));
  position: relative;
  z-index: 1;
}
```

### 6.3 标题区统一

所有页面标题区用同一 class `.page-header`：
```css
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: var(--sp-lg);
  padding-bottom: var(--sp-md);
  border-bottom: 2px solid var(--border);
}
```

### 6.4 卡片统一

所有卡片用同一 class `.note-card`：
```css
.note-card {
  background: var(--paper-card);
  border: 1px solid var(--border);
  border-bottom: 3px solid var(--border-strong);
  border-radius: var(--r-card);
}
```

### 6.5 重写顺序

| 阶段 | 页面 | 依赖 |
|------|------|------|
| 0 | App.vue（全局变量+导航+背景） | 无 |
| 1 | LoginView.vue | App.vue |
| 2 | PostSquare.vue | App.vue |
| 3 | PostDetail.vue | App.vue |
| 4 | PostPublish.vue | App.vue |
| 5 | HomeView.vue | App.vue |
| 6 | ClaimProgress.vue | App.vue |
| 7 | MessagesView.vue + ChatView.vue | App.vue |
| 8 | MyPostsView.vue | App.vue |
| 9 | AdminDashboard.vue | App.vue |
| 10 | NotFoundView.vue | App.vue |

每阶段完成后：git commit + push。

---

## 七、约束

- 禁止蓝色系（#409eff, #3b82f6 等）
- 禁止 box-shadow 装饰（用 border 替代）
- 禁止全局渐变（纸纹 radial-gradient 是材质表达，不算装饰渐变）
- 禁止 emoji（用内联 SVG）
- 时间显示必须 `.replace('T', ' ')`
- 删除操作必须二级确认
- Element Plus 主色通过 main.js CSS 变量覆盖
- 所有颜色用 var(--xxx) 引用，不硬编码 hex
