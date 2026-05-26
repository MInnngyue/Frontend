<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { publishPost } from '@/api/post'
import { getCategories, getCategoryChildren } from '@/api/category'
import { uploadImage } from '@/api/upload'
import { ElMessage } from 'element-plus'

const router = useRouter()

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

onMounted(async () => {
  itemCategories.value = (await getCategories('item_category')).data
  colors.value = (await getCategories('color')).data
  campuses.value = (await getCategories('location')).data
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
    // 先上传图片
    const imageUrls = []
    for (const file of imageFiles.value) {
      uploading.value = true
      const res = await uploadImage(file)
      imageUrls.push(res.data.data.url)
      uploading.value = false
    }

    // 发布帖子
    const payload = { ...form.value, images: imageUrls }
    await publishPost(payload)
    ElMessage.success('发布成功')
    router.push('/')
  } catch (e) {
    // error handled by interceptor
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="publish-page">
    <h1 class="page-title">发布帖子</h1>

    <el-card class="form-card" shadow="never">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" size="large">
        <!-- 类型切换 -->
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio :value="0">寻物启事</el-radio>
            <el-radio :value="1">失物招领</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 结构化字段 -->
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="物品大类" prop="itemCategory">
              <el-select v-model="form.itemCategory" placeholder="请选择" style="width: 100%">
                <el-option v-for="c in itemCategories" :key="c.id" :label="c.name" :value="c.name" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="颜色" prop="color">
              <el-select v-model="form.color" placeholder="请选择" style="width: 100%">
                <el-option v-for="c in colors" :key="c.id" :label="c.name" :value="c.name" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 地点三级联动 -->
        <el-form-item label="地点" required>
          <el-row :gutter="12" style="width: 100%">
            <el-col :span="8">
              <el-form-item prop="locationCampus" label-width="0">
                <el-select
                  v-model="form.locationCampus"
                  placeholder="校区"
                  style="width: 100%"
                  @change="onCampusChange"
                >
                  <el-option v-for="c in campuses" :key="c.id" :label="c.name" :value="c.name" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label-width="0">
                <el-select
                  v-model="form.locationArea"
                  placeholder="区域"
                  style="width: 100%"
                  :disabled="!form.locationCampus"
                  @change="onAreaChange"
                >
                  <el-option v-for="c in areas" :key="c.id" :label="c.name" :value="c.name" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label-width="0">
                <el-select
                  v-if="details.length > 0"
                  v-model="form.locationDetail"
                  placeholder="具体地点"
                  style="width: 100%"
                >
                  <el-option v-for="c in details" :key="c.id" :label="c.name" :value="c.name" />
                </el-select>
                <el-input
                  v-else
                  v-model="form.locationDetail"
                  placeholder="输入具体地点"
                  style="width: 100%"
                  :disabled="!form.locationArea"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form-item>

        <!-- 时间 -->
        <el-form-item label="时间" prop="lostTime">
          <el-date-picker
            v-model="form.lostTime"
            type="date"
            placeholder="遗失/捡到日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <!-- 标题 -->
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="可选：如「图书馆二楼捡到黑色双肩包」" maxlength="128" show-word-limit />
        </el-form-item>

        <!-- 描述 -->
        <el-form-item label="详细描述">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="可选：补充描述物品特征、品牌、特殊标记等"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <!-- 图片上传 -->
        <el-form-item label="图片上传">
          <el-upload
            :auto-upload="false"
            :file-list="[]"
            accept="image/*"
            :on-change="handleFileChange"
          >
            <el-button type="primary" plain>选择图片</el-button>
            <template #tip>
              <span class="upload-tip">最多9张，单张≤5MB</span>
            </template>
          </el-upload>
          <div v-if="imageFiles.length > 0" class="preview-list">
            <div v-for="(file, index) in imageFiles" :key="index" class="preview-item">
              <span>{{ file.name }}</span>
              <el-button type="danger" size="small" circle @click="removeFile(index)">✕</el-button>
            </div>
          </div>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="onSubmit">发布</el-button>
          <el-button @click="router.push('/')">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
/* ── Page ── */
.publish-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 28px 20px 40px;
  background: #f8fafc;
  min-height: 100vh;
}

/* ── Title ── */
.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 28px;
  text-align: center;
}

/* ── Card ── */
.form-card {
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06);
}

/* ── Form label overrides ── */
:deep(.el-form-item__label) {
  color: #475569 !important;
  font-weight: 500;
}

/* ── Input / Select / DatePicker shared styles ── */
:deep(.el-input__wrapper),
:deep(.el-select .el-input__wrapper) {
  border-radius: 8px;
  border-color: #e2e8f0;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
}
:deep(.el-input__wrapper:hover),
:deep(.el-select .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #cbd5e1 inset;
}
:deep(.el-input.is-focus .el-input__wrapper),
:deep(.el-select.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 1px #4f46e5 inset;
}
:deep(.el-input__inner) {
  color: #1e293b;
}
:deep(.el-input__inner::placeholder),
:deep(.el-select .el-input__inner::placeholder) {
  color: #94a3b8;
}
:deep(.el-textarea__inner) {
  border-radius: 8px;
  border-color: #e2e8f0;
  box-shadow: 0 0 0 1px #e2e8f0 inset;
  color: #1e293b;
}
:deep(.el-textarea__inner:hover) {
  box-shadow: 0 0 0 1px #cbd5e1 inset;
}
:deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px #4f46e5 inset;
}
:deep(.el-textarea__inner::placeholder) {
  color: #94a3b8;
}

/* ── Radio group ── */
:deep(.el-radio__label) {
  color: #475569;
}
:deep(.el-radio__input.is-checked + .el-radio__label) {
  color: #4f46e5;
}
:deep(.el-radio__input.is-checked .el-radio__inner) {
  background-color: #4f46e5;
  border-color: #4f46e5;
}

/* ── DatePicker ── */
:deep(.el-date-editor) {
  --el-date-editor-width: 100%;
}

/* ── Buttons ── */
:deep(.el-button--primary) {
  --el-button-bg-color: #4f46e5;
  --el-button-border-color: #4f46e5;
  --el-button-hover-bg-color: #4338ca;
  --el-button-hover-border-color: #4338ca;
  --el-button-active-bg-color: #3730a3;
  --el-button-active-border-color: #3730a3;
  border-radius: 8px;
  font-weight: 500;
}

/* Submit (publish) button — green mask */
.form-card :deep(.el-form-item:last-child .el-button--primary) {
  background: #dcfce7;
  border-color: #bbf7d0;
  color: #15803d;
  font-weight: 600;
}
.form-card :deep(.el-form-item:last-child .el-button--primary:hover) {
  background: #bbf7d0;
  border-color: #86efac;
  color: #15803d;
}
.form-card :deep(.el-form-item:last-child .el-button--primary:active) {
  background: #86efac;
  border-color: #4ade80;
  color: #15803d;
}

/* Cancel button — slate style */
.form-card :deep(.el-button--default) {
  --el-button-bg-color: #f8fafc;
  --el-button-border-color: #e2e8f0;
  --el-button-text-color: #475569;
  --el-button-hover-bg-color: #f1f5f9;
  --el-button-hover-border-color: #cbd5e1;
  --el-button-hover-text-color: #1e293b;
  border-radius: 8px;
}

/* ── Upload ── */
:deep(.el-upload) {
  display: inline-flex;
}
.upload-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #94a3b8;
}

/* ── Preview list ── */
.preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.preview-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f1f5f9;
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 13px;
  color: #334155;
  border: 1px solid #e2e8f0;
}
</style>
