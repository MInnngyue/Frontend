<template>
  <div class="login-page">
    <div class="login-card">
      <div class="card-pin">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1 2.89-2.64l3.05 2.05a2 2 0 0 1-.14 3.5l-2.5 1.8a2 2 0 0 1-2.3-.1l-1.5-1.2a2 2 0 0 1-.5-2.6z"/><circle cx="12" cy="6" r="2.5"/></svg>
      </div>
      <h2 class="title">失物招领系统</h2>
      <p class="subtitle">{{ isRegister ? '创建新账号' : '欢迎登录' }}</p>

      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model.trim="form.username"
            placeholder="请输入用户名"
            size="large"
            prefix-icon="User"
            clearable
            @input="clearFieldError('username')"
          />
        </el-form-item>

        <el-form-item v-show="isRegister" label="邮箱" prop="email">
          <el-input
            v-model.trim="form.email"
            placeholder="请输入邮箱"
            size="large"
            prefix-icon="Message"
            clearable
            @input="clearFieldError('email')"
          />
        </el-form-item>

        <el-form-item label="密码" prop="password">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            size="large"
            prefix-icon="Lock"
            show-password
            @input="clearFieldError('password')"
          />
        </el-form-item>

        <el-form-item v-show="isRegister" label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            size="large"
            prefix-icon="Lock"
            show-password
            @input="clearFieldError('confirmPassword')"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="submit-btn"
            :loading="loading"
            @click="handleSubmit"
          >
            {{ isRegister ? '注 册' : '登 录' }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="switch-box">
        <span>{{ isRegister ? '已有账号？' : '还没有账号？' }}</span>
        <el-button type="primary" link @click="switchMode">
          {{ isRegister ? '去登录' : '去注册' }}
        </el-button>
      </div>
    </div>

    <p class="login-slogan">校园失物招领 · 让每件物品找到回家的路</p>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login, register } from '../api/user'

const router = useRouter()
const formRef = ref()
const loading = ref(false)
const isRegister = ref(false)
const submitted = ref(false)

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const validateConfirmPassword = (rule, value, callback) => {
  if (!value) {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = computed(() => {
  if (!submitted.value) return {}
  return {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 3, max: 20, message: '用户名长度为 3-20 个字符', trigger: 'blur' },
    ],
    email: isRegister.value
      ? [
          { required: true, message: '请输入邮箱', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
        ]
      : [],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, max: 30, message: '密码长度为 6-30 个字符', trigger: 'blur' },
    ],
    confirmPassword: isRegister.value
      ? [{ validator: validateConfirmPassword, trigger: 'blur' }]
      : [],
  }
})

const switchMode = () => {
  isRegister.value = !isRegister.value
  submitted.value = false
  form.username = ''
  form.email = ''
  form.password = ''
  form.confirmPassword = ''
  formRef.value?.clearValidate()
}

const clearFieldError = (field) => {
  formRef.value?.clearValidate(field)
}

const handleSubmit = () => {
  submitted.value = true
  formRef.value.validate(async (valid) => {
    if (!valid) return

    loading.value = true
    try {
      if (isRegister.value) {
        await register({
          username: form.username,
          email: form.email,
          password: form.password,
        })

        ElMessage.success('注册成功，请登录')
        isRegister.value = false
        submitted.value = false
        form.password = ''
        form.confirmPassword = ''
        formRef.value?.clearValidate()
        return
      }

      const res = await login({
        username: form.username,
        password: form.password,
      })

      localStorage.setItem('token', res.data.token)
      const { token, ...userInfo } = res.data
      localStorage.setItem('userInfo', JSON.stringify(userInfo))

      ElMessage.success('登录成功')
      router.push('/')
    } catch (error) {
      console.error(error)
    } finally {
      loading.value = false
    }
  })
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #faf6ee;
  /* paper fiber texture */
  background-image:
    radial-gradient(circle at 20% 30%, rgba(45,42,38,0.02) 0.6px, transparent 0.6px),
    radial-gradient(circle at 70% 60%, rgba(45,42,38,0.015) 0.5px, transparent 0.5px),
    radial-gradient(circle at 40% 80%, rgba(45,42,38,0.01) 0.4px, transparent 0.4px);
  background-size: 24px 24px, 32px 32px, 40px 40px;
}

.login-card {
  width: 430px;
  padding: 36px 28px 22px;
  border-radius: 8px;
  background: #f3ecdb;
  border: 1px solid #d9cfb8;
  /* paper corner curl — border simulates lifted edge, no shadow */
  border-bottom: 3px solid #c4b896;
  transition: transform 0.2s;
  margin-top: -32px;
  position: relative;
}
.login-card:hover { transform: translateY(-2px); }

/* pushpin at top center of card */
.card-pin {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 32px;
  height: 32px;
  background: #c8553d;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #faf6ee;
  border: 2px solid #a8442f;
}

.title {
  text-align: center;
  margin: 0 0 4px;
  font-family: 'Noto Serif SC', Georgia, serif;
  font-size: 24px;
  font-weight: 700;
  color: #2d2a26;
}

.subtitle {
  text-align: center;
  margin: 0 0 22px;
  font-size: 14px;
  color: #8a8170;
}

:deep(.el-form-item__label) {
  color: #5c5448 !important;
  font-weight: 500;
}

:deep(.el-input__wrapper) {
  border-radius: 6px;
  border-color: #d9cfb8;
  box-shadow: 0 0 0 1px #d9cfb8 inset;
  background: #faf6ee;
}
:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c4b896 inset;
}
:deep(.el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 1px #c8553d inset;
}
:deep(.el-input__inner) {
  color: #2d2a26;
}
:deep(.el-input__inner::placeholder) {
  color: #b0a690;
}

.submit-btn {
  width: 100%;
  margin-top: 4px;
  border-radius: 6px;
  transition: transform 0.15s;
}
.submit-btn:active { transform: scale(0.98); }
.submit-btn:deep(.el-button) {
  background: #c8553d;
  border-color: #c8553d;
}
.submit-btn:deep(.el-button:hover) {
  background: #a8442f;
  border-color: #a8442f;
}

:deep(.el-button--primary) {
  --el-button-bg-color: #c8553d;
  --el-button-border-color: #c8553d;
  --el-button-hover-bg-color: #a8442f;
  --el-button-hover-border-color: #a8442f;
  --el-button-active-bg-color: #8e3826;
  --el-button-active-border-color: #8e3826;
  border-radius: 6px;
}

.switch-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 18px;
  color: #8a8170;
  font-size: 13px;
}
.switch-box :deep(.el-button) {
  color: #c8553d;
}
.switch-box :deep(.el-button:hover) {
  color: #a8442f;
}

.login-slogan {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 13px;
  color: #b0a690;
  letter-spacing: 1px;
  white-space: nowrap;
}
</style>
