<template>
  <div class="login-page">
    <el-card class="login-card">
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
    </el-card>

    <p class="login-slogan">校园失物招领 · 让每件物品找到回家的路</p>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { login, register } from '../api/user'

const router = useRouter()
const formRef = ref()
const loading = ref(false)
const isRegister = ref(false)

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const validateConfirmPassword = (rule, value, callback) => {
  if (!isRegister.value) {
    callback()
    return
  }

  if (!value) {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const rules = computed(() => ({
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
}))

const switchMode = () => {
  isRegister.value = !isRegister.value
  form.username = ''
  form.email = ''
  form.password = ''
  form.confirmPassword = ''
  // 双层 nextTick：等 v-if 渲染 + Element 内部校验都跑完后再清除
  nextTick(() => nextTick(() => formRef.value?.clearValidate()))
}

// 用户开始输入时清除该字段的校验提示
const clearFieldError = (field) => {
  formRef.value?.clearValidate(field)
}

// 页面加载后清除可能出现的初始校验状态
onMounted(() => { nextTick(() => formRef.value?.clearValidate()) })

const handleSubmit = () => {
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
  background: #f8fafc;
  /* subtle dot pattern — breaks AI "flat background" cliché */
  background-image: radial-gradient(circle, #cbd5e1 1.2px, transparent 1.2px);
  background-size: 20px 20px;
}

.login-card {
  width: 430px;
  padding: 28px 28px 22px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: box-shadow 0.2s, transform 0.2s;
  /* shift card slightly up — visual center ≠ geometric center */
  margin-top: -32px;
}
.login-card:hover { box-shadow: 0 4px 12px rgba(79,70,229,0.06); transform: translateY(-1px); }

/* .login-card { margin-top: calc(-1 * var(--card-offset, 32px)); } — dynamic offset, not used yet */

.title {
  text-align: center;
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
}

.subtitle {
  text-align: center;
  margin: 0 0 22px;
  font-size: 14px;
  color: #64748b;
}

:deep(.el-form-item__label) {
  color: #475569 !important;
  font-weight: 500;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
  border-color: #e2e8f0;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
}
:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #cbd5e1 inset;
}
:deep(.el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 1px #4f46e5 inset;
}
:deep(.el-input__inner) {
  color: #1e293b;
}
:deep(.el-input__inner::placeholder) {
  color: #94a3b8;
}

.submit-btn {
  width: 100%;
  margin-top: 4px;
  border-radius: 8px;
  transition: transform 0.15s;
}
.submit-btn:active { transform: scale(0.98); }
.submit-btn:deep(.el-button) {
  background: #4f46e5;
  border-color: #4f46e5;
}
.submit-btn:deep(.el-button:hover) {
  background: #4338ca;
  border-color: #4338ca;
}

:deep(.el-button--primary) {
  --el-button-bg-color: #4f46e5;
  --el-button-border-color: #4f46e5;
  --el-button-hover-bg-color: #4338ca;
  --el-button-hover-border-color: #4338ca;
  --el-button-active-bg-color: #3730a3;
  --el-button-active-border-color: #3730a3;
  border-radius: 8px;
}

.switch-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 18px;
  color: #64748b;
  font-size: 13px;
}
.switch-box :deep(.el-button) {
  color: #4f46e5;
}
.switch-box :deep(.el-button:hover) {
  color: #4338ca;
}

.login-slogan {
  position: absolute;
  bottom: 32px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 13px;
  color: #94a3b8;
  letter-spacing: 1px;
  white-space: nowrap;
}
</style>
