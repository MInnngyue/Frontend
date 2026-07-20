import { computed, reactive, ref } from 'vue'
import { login, register } from '@/api/user'
import { saveAuthSession } from '@/utils/authSession'
import { getErrorMessage } from '@/utils/error'

const MODES = {
  LOGIN: 'login',
  REGISTER: 'register',
}

const INITIAL_FORM = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
}

function validateUsername(value) {
  const username = value.trim()
  if (!username) return '请输入用户名'
  if (username.length < 3 || username.length > 20) return '用户名长度为 3-20 个字符'
  return ''
}

function validateEmail(value) {
  if (!value.trim()) return '请输入邮箱'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return '请输入正确的邮箱格式'
  return ''
}

function validatePassword(value) {
  if (!value) return '请输入密码'
  if (value.length < 6 || value.length > 30) return '密码长度为 6-30 个字符'
  return ''
}

export function useAuthForm() {
  const mode = ref(MODES.LOGIN)
  const form = reactive({ ...INITIAL_FORM })
  const errors = reactive({})
  const loading = ref(false)
  const alert = ref(null)
  const isRegister = computed(() => mode.value === MODES.REGISTER)

  function clearErrors() {
    Object.keys(errors).forEach((field) => delete errors[field])
  }

  function clearFieldError(field) {
    delete errors[field]
    if (alert.value?.type === 'error') alert.value = null
  }

  function updateField(field, value) {
    if (!(field in form)) return
    form[field] = value
    clearFieldError(field)

    if (field === 'password' && errors.confirmPassword) {
      delete errors.confirmPassword
    }
  }

  function validateForm() {
    clearErrors()

    errors.username = validateUsername(form.username)
    errors.password = validatePassword(form.password)

    if (isRegister.value) {
      errors.email = validateEmail(form.email)
      errors.confirmPassword = !form.confirmPassword
        ? '请再次输入密码'
        : form.confirmPassword !== form.password
          ? '两次输入的密码不一致'
          : ''
    }

    Object.keys(errors).forEach((field) => {
      if (!errors[field]) delete errors[field]
    })

    if (Object.keys(errors).length) {
      alert.value = { type: 'error', message: '请检查表单中的错误项' }
      return false
    }

    return true
  }

  function resetForm() {
    Object.assign(form, INITIAL_FORM)
    clearErrors()
    alert.value = null
  }

  function switchMode() {
    mode.value = isRegister.value ? MODES.LOGIN : MODES.REGISTER
    resetForm()
  }

  async function submit() {
    if (loading.value || !validateForm()) return null

    loading.value = true
    alert.value = null

    try {
      if (isRegister.value) {
        await register({
          username: form.username.trim(),
          email: form.email.trim(),
          password: form.password,
        })

        mode.value = MODES.LOGIN
        form.password = ''
        form.confirmPassword = ''
        form.email = ''
        alert.value = { type: 'success', message: '注册成功，请使用新账号登录' }
        return { type: 'registered' }
      }

      const response = await login({
        username: form.username.trim(),
        password: form.password,
      })
      saveAuthSession(response.data)
      return { type: 'authenticated' }
    } catch (error) {
      alert.value = { type: 'error', message: getErrorMessage(error, '登录失败，请稍后重试') }
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    alert,
    errors,
    form,
    isRegister,
    loading,
    mode,
    clearFieldError,
    submit,
    switchMode,
    updateField,
  }
}
