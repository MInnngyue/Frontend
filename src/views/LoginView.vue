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
          />
        </el-form-item>

        <el-form-item v-if="isRegister" label="邮箱" prop="email">
          <el-input
            v-model.trim="form.email"
            placeholder="请输入邮箱"
            size="large"
            prefix-icon="Message"
            clearable
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
          />
        </el-form-item>

        <el-form-item v-if="isRegister" label="确认密码" prop="confirmPassword">
          <el-input
            v-model="form.confirmPassword"
            type="password"
            placeholder="请再次输入密码"
            size="large"
            prefix-icon="Lock"
            show-password
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
        { type: 'email', message: '请输入正确的邮箱格式', trigger: ['blur', 'change'] },
      ]
    : [],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 30, message: '密码长度为 6-30 个字符', trigger: 'blur' },
  ],
  confirmPassword: isRegister.value
    ? [{ validator: validateConfirmPassword, trigger: ['blur', 'change'] }]
    : [],
}))

const resetForm = () => {
  form.username = ''
  form.email = ''
  form.password = ''
  form.confirmPassword = ''
  formRef.value?.clearValidate()
}

const switchMode = () => {
  isRegister.value = !isRegister.value
  resetForm()
}

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
      localStorage.setItem('userInfo', JSON.stringify(res.data))

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
  background: linear-gradient(135deg, #e0f2fe 0%, #f8fafc 45%, #eef2ff 100%);
}

.login-card {
  width: 430px;
  padding: 18px 20px 10px;
  border-radius: 14px;
}

.title {
  text-align: center;
  margin: 8px 0 6px;
  color: #1f2937;
}

.subtitle {
  text-align: center;
  margin: 0 0 24px;
  color: #6b7280;
}

.submit-btn {
  width: 100%;
  margin-top: 6px;
}

.switch-box {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
}
</style>
