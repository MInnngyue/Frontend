import { createApp } from 'vue'
import { createPinia } from 'pinia'

// 引入 Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
// 引入中文语言包
import zhCn from 'element-plus/es/locale/lang/zh-cn'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
// 注册 Element Plus（使用中文）
app.use(ElementPlus, { locale: zhCn })

// 全局覆盖 Element Plus 主色为朱砂红（公告板主题）
const style = document.createElement('style')
style.textContent = `:root {
  --el-color-primary: #c8553d;
  --el-color-primary-light-3: #d97a66;
  --el-color-primary-light-5: #e2a294;
  --el-color-primary-light-7: #ecd1c9;
  --el-color-primary-light-9: #f7ede9;
  --el-color-primary-dark-2: #a8442f;
  --el-color-success: #6b8e4e;
  --el-color-success-light-9: #e8efd9;
  --el-color-warning: #c9956b;
  --el-color-warning-light-9: #f5ebd6;
  --el-color-danger: #b54a3a;
  --el-color-info: #8a8170;
}`
document.head.appendChild(style)

app.mount('#app')
