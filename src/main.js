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

// 全局覆盖 Element Plus 主色为 indigo 紫色
const style = document.createElement('style')
style.textContent = ':root { --el-color-primary: #4f46e5; --el-color-primary-light-3: #818cf8; --el-color-primary-light-5: #a5b4fc; --el-color-primary-light-7: #c7d2fe; --el-color-primary-light-9: #eef2ff; --el-color-primary-dark-2: #4338ca; }'
document.head.appendChild(style)

app.mount('#app')
