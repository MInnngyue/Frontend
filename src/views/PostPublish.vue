<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { publishPost } from '@/api/post'
import { getCategories, getCategoryChildren } from '@/api/category'
import { uploadImage } from '@/api/upload'
import { ElMessage } from 'element-plus'
import { useAuroraGlow } from '@/composables/useAuroraGlow'

const router = useRouter()
const { glowX, glowY, glowActive, onMouseMove, onMouseLeave } = useAuroraGlow()

const formRef = ref(null)
const submitting = ref(false)

const form = ref({
  type: 0,
  itemCategory: '',
  color: '',
  locationCampus: '',
  locationArea: '',
  locationDetail: '',
  lostTime: '',
  title: '',
  description: '',
})

const rules = {
  type: [{ required: true, message: '请选择类型', trigger: 'change' }],
  itemCategory: [{ required: true, message: '请选择物品大类', trigger: 'change' }],
  color: [{ required: true, message: '请选择颜色', trigger: 'change' }],
  locationCampus: [{ required: true, message: '请选择校区', trigger: 'change' }],
  lostTime: [{ required: true, message: '请选择时间', trigger: 'change' }],
}

const itemCategories = ref([])
const colors = ref([])
const campuses = ref([])
const areas = ref([])
const details = ref([])
const selectedCampusId = ref(null)
const selectedAreaId = ref(null)
const imageFiles = ref([])
const uploading = ref(false)

let revealObserver = null

function initRevealObserver() {
  if (!('IntersectionObserver' in window)) return
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        revealObserver?.unobserve(entry.target)
      })
    },
    { threshold: 0.12 },
  )
}

onMounted(async () => {
  initRevealObserver()
  itemCategories.value = (await getCategories('item_category')).data
  colors.value = (await getCategories('color')).data
  campuses.value = (await getCategories('location')).data
  await nextTick()
  document.querySelectorAll('.publish-page [data-reveal]').forEach((el) => {
    revealObserver?.observe(el)
  })
})

onBeforeUnmount(() => {
  revealObserver?.disconnect()
})

async function onCampusChange(name) {
  form.value.locationArea = ''
  form.value.locationDetail = ''
  areas.value = []
  details.value = []
  const campus = campuses.value.find(c => c.name === name)
  if (campus) {
    selectedCampusId.value = campus.id
    const res = await getCategoryChildren('location', campus.id)
    areas.value = res.data
  }
}

async function onAreaChange(name) {
  form.value.locationDetail = ''
  details.value = []
  const area = areas.value.find(c => c.name === name)
  if (area) {
    selectedAreaId.value = area.id
    const res = await getCategoryChildren('location', area.id)
    details.value = res.data
  }
}

function handleFileChange(file) {
  imageFiles.value.push(file.raw)
}

function removeFile(index) {
  imageFiles.value.splice(index, 1)
}

async function onSubmit() {
    const valid = await formRef.value.validate().catch(() => false)
    if (!valid) return

    submitting.value = true
    try {
      const imageUrls = []
      for (const file of imageFiles.value) {
        uploading.value = true
        const res = await uploadImage(file)
        imageUrls.push(res.data.data.url)
        uploading.value = false
      }

      const payload = { ...form.value, images: imageUrls }
      await publishPost(payload)
      ElMessage.success('发布成功')
      router.push('/')
    } catch (e) {
    } finally {
      submitting.value = false
  }
}
</script>

<template>
  <div class="page publish-page" @mousemove="onMouseMove" @mouseleave="onMouseLeave">
    <div
      class="aurora-glow"
      :class="{ active: glowActive }"
      :style="{ transform: `translate3d(${glowX - 150}px, ${glowY - 100}px, 0)` }"
      aria-hidden="true"
    />
    <div
      class="aurora-glow aurora-glow--teal"
      :class="{ active: glowActive }"
      :style="{ transform: `translate3d(${glowX - 130}px, ${glowY - 160}px, 0)` }"
      aria-hidden="true"
    />
    <header class="page-header" data-reveal>
      <h1 class="page-title">发布帖子</h1>
      <p class="page-subtitle">填写物品信息，帮助找回或归还</p>
    </header>

    <el-form ref="formRef" :model="form" :rules="rules" class="publish-form" @submit.prevent="onSubmit">
      <section class="form-section" data-reveal style="--reveal-delay: 60ms">
        <h2 class="section-title">
          <span class="section-num">01</span>
          物品信息
        </h2>
        <div class="section-body">
          <div class="field-group">
            <label class="field-label">类型 <span class="required">*</span></label>
            <el-form-item prop="type">
              <div class="type-toggle">
                <button type="button" class="type-btn" :class="{ active: form.type === 0 }" @click="form.type = 0">
                  寻物启事
                </button>
                <button type="button" class="type-btn" :class="{ active: form.type === 1 }" @click="form.type = 1">
                  失物招领
                </button>
              </div>
            </el-form-item>
          </div>

          <div class="field-row">
            <div class="field-group">
              <label class="field-label">物品大类 <span class="required">*</span></label>
              <el-form-item prop="itemCategory">
                <el-select v-model="form.itemCategory" placeholder="选择类别" size="large" style="width: 100%">
                  <el-option v-for="c in itemCategories" :key="c.id" :label="c.name" :value="c.name" />
                </el-select>
              </el-form-item>
            </div>
            <div class="field-group">
              <label class="field-label">颜色 <span class="required">*</span></label>
              <el-form-item prop="color">
                <el-select v-model="form.color" placeholder="选择颜色" size="large" style="width: 100%">
                  <el-option v-for="c in colors" :key="c.id" :label="c.name" :value="c.name" />
                </el-select>
              </el-form-item>
            </div>
          </div>
        </div>
      </section>

      <section class="form-section" data-reveal style="--reveal-delay: 120ms">
        <h2 class="section-title">
          <span class="section-num">02</span>
          时间地点
        </h2>
        <div class="section-body">
          <div class="field-group">
            <label class="field-label">地点 <span class="required">*</span></label>
            <div class="location-row">
              <el-form-item prop="locationCampus">
                <el-select
                  v-model="form.locationCampus"
                  placeholder="校区"
                  size="large"
                  style="width: 100%"
                  @change="onCampusChange"
                >
                  <el-option v-for="c in campuses" :key="c.id" :label="c.name" :value="c.name" />
                </el-select>
              </el-form-item>
              <el-select
                v-model="form.locationArea"
                placeholder="区域"
                size="large"
                style="width: 100%"
                :disabled="!form.locationCampus"
                @change="onAreaChange"
              >
                <el-option v-for="c in areas" :key="c.id" :label="c.name" :value="c.name" />
              </el-select>
              <template v-if="details.length > 0">
                <el-select v-model="form.locationDetail" placeholder="具体地点" size="large" style="width: 100%">
                  <el-option v-for="c in details" :key="c.id" :label="c.name" :value="c.name" />
                </el-select>
              </template>
              <template v-else>
                <el-input
                  v-model="form.locationDetail"
                  placeholder="输入具体地点"
                  size="large"
                  :disabled="!form.locationArea"
                />
              </template>
            </div>
          </div>

          <div class="field-group">
            <label class="field-label">时间 <span class="required">*</span></label>
            <el-form-item prop="lostTime">
              <el-date-picker
                v-model="form.lostTime"
                type="date"
                placeholder="选择遗失/捡到日期"
                value-format="YYYY-MM-DD"
                size="large"
                style="width: 100%"
              />
            </el-form-item>
          </div>
        </div>
      </section>

      <section class="form-section" data-reveal style="--reveal-delay: 180ms">
        <h2 class="section-title">
          <span class="section-num">03</span>
          补充描述
        </h2>
        <div class="section-body">
          <div class="field-group">
            <label class="field-label">标题</label>
            <el-input
              v-model="form.title"
              placeholder="如「图书馆二楼捡到黑色双肩包」"
              maxlength="128"
              show-word-limit
              size="large"
            />
          </div>

          <div class="field-group">
            <label class="field-label">描述</label>
            <el-input
              v-model="form.description"
              type="textarea"
              :rows="4"
              placeholder="补充物品特征、品牌、特殊标记等"
              maxlength="500"
              show-word-limit
            />
          </div>

          <div class="field-group">
            <label class="field-label">图片</label>
            <el-upload :auto-upload="false" :file-list="[]" accept="image/*" :on-change="handleFileChange">
              <button type="button" class="upload-btn">📷 选择图片</button>
            </el-upload>
            <span class="upload-hint">最多9张，单张≤5MB</span>
            <div v-if="imageFiles.length > 0" class="preview-list">
              <div v-for="(file, index) in imageFiles" :key="index" class="preview-item">
                <span>{{ file.name }}</span>
                <button type="button" class="remove-btn" @click="removeFile(index)">✕</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="submit-area" data-reveal style="--reveal-delay: 240ms">
        <button type="submit" class="btn-primary" :disabled="submitting">
          {{ submitting ? '发布中...' : '发布帖子' }}
        </button>
        <button type="button" class="btn-secondary" @click="router.push('/')">取消</button>
      </div>
    </el-form>
  </div>
</template>

<style scoped>
.publish-page {
  max-width: 720px;
  margin: 0 auto;
  padding: 31px 20px 48px;
  min-height: calc(100vh - 60px);
  position: relative;
  isolation: isolate;
}

/* 极光 Aurora 双光团 */
.aurora-glow {
  position: fixed;
  width: 300px;
  height: 300px;
  left: 0;
  top: 0;
  border-radius: 50%;
  pointer-events: none;
  z-index: 0;
  will-change: transform;
  opacity: 0;
  transition: opacity 0.5s ease;
  filter: blur(30px);
  background: radial-gradient(circle, rgba(139, 92, 246, 0.5) 0%, rgba(139, 92, 246, 0.18) 40%, transparent 70%);
  mix-blend-mode: normal;
}

.aurora-glow--teal {
  width: 260px;
  height: 260px;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.45) 0%, rgba(6, 182, 212, 0.15) 40%, transparent 70%);
  mix-blend-mode: screen;
}

.aurora-glow.active {
  opacity: 1;
}

.page-header,
.publish-form {
  position: relative;
  z-index: 1;
}

.page-header {
  margin-bottom: 28px;
}

.page-title {
  margin: 0;
  color: #1e293b;
  font-family: 'Noto Serif SC', serif;
  font-size: 36px;
  font-weight: 700;
  line-height: 1.35;
}

.page-subtitle {
  margin: 4px 0 0;
  color: #64748b;
  font-family: 'HarmonyOS Sans', 'PingFang SC', sans-serif;
  font-size: 16px;
}

.publish-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

/* 毛玻璃卡片 — 与广场小卡片完全一致 */
.form-section {
  background: rgba(255, 255, 255, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  box-shadow:
    0 8px 32px rgba(31, 38, 135, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  padding: 24px 28px;
  overflow: hidden;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 18px;
  color: #1e293b;
  font-family: 'Noto Serif SC', serif;
  font-size: 17.6px;
  font-weight: 600;
}

.section-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  font-family: 'JetBrains Mono', monospace;
  font-size: 13px;
  font-weight: 700;
}

.section-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  color: #334155;
  font-family: 'HarmonyOS Sans', 'PingFang SC', sans-serif;
  font-size: 14.3px;
  font-weight: 600;
}

.required {
  color: #ef4444;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.location-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
}

/* 类型切换胶囊按钮组 */
.type-toggle {
  display: flex;
  gap: 8px;
}

.type-btn {
  padding: 10px 24px;
  border-radius: 999px;
  font-family: 'HarmonyOS Sans', 'PingFang SC', sans-serif;
  font-size: 15.4px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.6);
  border: 1.5px solid rgba(15, 23, 42, 0.12);
  color: #64748b;
}

.type-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.type-btn.active {
  background: rgba(15, 23, 42, 0.92);
  border-color: rgba(15, 23, 42, 0.92);
  color: #ffffff;
}

/* 上传按钮 */
.upload-btn {
  padding: 10px 20px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.6);
  border: 1.5px solid rgba(15, 23, 42, 0.12);
  color: #334155;
  font-family: 'HarmonyOS Sans', 'PingFang SC', sans-serif;
  font-size: 14.3px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.upload-hint {
  color: #94a3b8;
  font-size: 13.2px;
  font-family: 'HarmonyOS Sans', 'PingFang SC', sans-serif;
}

.preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.6);
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 13.2px;
  color: #334155;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.remove-btn {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  line-height: 1;
}

.remove-btn:hover {
  color: #ef4444;
}

/* 提交区 */
.submit-area {
  display: flex;
  gap: 12px;
  padding: 0 4px;
}

.btn-primary {
  flex: 1;
  padding: 14px 28px;
  background: rgba(15, 23, 42, 0.92);
  color: #ffffff;
  border: none;
  border-radius: 999px;
  font-family: 'HarmonyOS Sans', 'PingFang SC', sans-serif;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #000000;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.24);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 14px 28px;
  background: transparent;
  border: 1.5px solid rgba(15, 23, 42, 0.2);
  border-radius: 999px;
  color: #334155;
  font-family: 'HarmonyOS Sans', 'PingFang SC', sans-serif;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  border-color: rgba(15, 23, 42, 0.4);
  background: rgba(15, 23, 42, 0.04);
}

/* data-reveal 渐入动画 — 与广场一致 */
[data-reveal] {
  opacity: 0;
  transform: translate3d(0, 30px, 0) scale(0.985);
  transition:
    opacity 760ms cubic-bezier(0.16, 1, 0.3, 1),
    transform 760ms cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: var(--reveal-delay, 0ms);
}

[data-reveal].is-visible {
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
}

/* el-input / el-select 样式覆盖 */
:deep(.el-input__wrapper),
:deep(.el-select__wrapper) {
  background: rgba(255, 255, 255, 0.6) !important;
  border: 1px solid rgba(15, 23, 42, 0.1) !important;
  border-radius: 12px !important;
  box-shadow: none !important;
}

:deep(.el-input__wrapper:hover),
:deep(.el-select__wrapper:hover) {
  border-color: #3b82f6 !important;
}

:deep(.el-input__wrapper.is-focus),
:deep(.el-select__wrapper.is-focus) {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}

:deep(.el-textarea__inner) {
  background: rgba(255, 255, 255, 0.6) !important;
  border: 1px solid rgba(15, 23, 42, 0.1) !important;
  border-radius: 12px !important;
  box-shadow: none !important;
}

:deep(.el-textarea__inner:focus) {
  border-color: #3b82f6 !important;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
}

/* 响应式 */
@media (max-width: 768px) {
  .publish-page {
    padding: 24px 16px 36px;
  }
  .page-title {
    font-size: 29px;
  }
  .field-row {
    grid-template-columns: 1fr;
  }
  .location-row {
    grid-template-columns: 1fr;
  }
  .form-section {
    padding: 18px 20px;
  }
}
</style>
