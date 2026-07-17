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
  <div class="publish-page">
    <h1 class="page-title">发布帖子</h1>

    <el-card class="form-card" shadow="never">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" size="large">
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio :value="0">寻物启事</el-radio>
            <el-radio :value="1">失物招领</el-radio>
          </el-radio-group>
        </el-form-item>

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

        <el-form-item label="时间" prop="lostTime">
          <el-date-picker
            v-model="form.lostTime"
            type="date"
            placeholder="遗失/捡到日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="可选：如「图书馆二楼捡到黑色双肩包」" maxlength="128" show-word-limit />
        </el-form-item>

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
.publish-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 22px 24px 36px;
  background: #faf6ee;
  min-height: 100vh;
}

.page-title {
  font-family: 'Noto Serif SC', Georgia, serif;
  font-size: 32px;
  font-weight: 700;
  color: #2d2a26;
  margin: 0 0 22px;
  text-align: center;
}

.form-card {
  border-radius: 6px;
  border: 1px solid #d9cfb8;
  /* box-shadow reserved for future card elevation system */
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.06);
}

:deep(.el-form-item__label) {
  color: #5c5448 !important;
  font-weight: 500;
}

/* shared input/select styles */
:deep(.el-input__wrapper),
:deep(.el-select .el-input__wrapper) {
  border-radius: 6px;
  border-color: #d9cfb8;
  box-shadow: 0 0 0 1px #d9cfb8 inset;
}
:deep(.el-input__wrapper:hover),
:deep(.el-select .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c4b896 inset;
}
:deep(.el-input.is-focus .el-input__wrapper),
:deep(.el-select.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 1px #c8553d inset;
}
:deep(.el-input__inner) {
  color: #2d2a26;
}
:deep(.el-input__inner::placeholder),
:deep(.el-select .el-input__inner::placeholder) {
  color: #b0a690;
}
:deep(.el-textarea__inner) {
  border-radius: 6px;
  border-color: #d9cfb8;
  box-shadow: 0 0 0 1px #d9cfb8 inset;
  color: #2d2a26;
}
:deep(.el-textarea__inner:hover) {
  box-shadow: 0 0 0 1px #c4b896 inset;
}
:deep(.el-textarea__inner:focus) {
  box-shadow: 0 0 0 1px #c8553d inset;
}
:deep(.el-textarea__inner::placeholder) {
  color: #b0a690;
}

:deep(.el-radio__label) {
  color: #5c5448;
}
:deep(.el-radio__input.is-checked + .el-radio__label) {
  color: #c8553d;
}
:deep(.el-radio__input.is-checked .el-radio__inner) {
  background-color: #c8553d;
  border-color: #c8553d;
}

:deep(.el-date-editor) {
  --el-date-editor-width: 100%;
}

:deep(.el-button--primary) {
  --el-button-bg-color: #c8553d;
  --el-button-border-color: #c8553d;
  --el-button-hover-bg-color: #a8442f;
  --el-button-hover-border-color: #a8442f;
  --el-button-active-bg-color: #8e3826;
  --el-button-active-border-color: #8e3826;
  border-radius: 6px;
  font-weight: 500;
}

/* publish button */
.form-card :deep(.el-form-item:last-child .el-button--primary) {
  background: #c8553d;
  border-color: #c8553d;
  color: #fff;
  font-weight: 600;
}
.form-card :deep(.el-form-item:last-child .el-button--primary:hover) {
  background: #a8442f;
  border-color: #a8442f;
  color: #fff;
}
.form-card :deep(.el-form-item:last-child .el-button--primary:active) {
  background: #8e3826;
  border-color: #8e3826;
  color: #fff;
}

/* cancel btn — slate */
.form-card :deep(.el-button--default) {
  --el-button-bg-color: #faf6ee;
  --el-button-border-color: #d9cfb8;
  --el-button-text-color: #5c5448;
  --el-button-hover-bg-color: #e8dfc6;
  --el-button-hover-border-color: #c4b896;
  --el-button-hover-text-color: #2d2a26;
  border-radius: 6px;
}

:deep(.el-upload) {
  display: inline-flex;
}
:deep(.el-button--primary.is-plain) {
  --el-button-bg-color: #f7ede9;
  --el-button-border-color: #e2a294;
  --el-button-text-color: #c8553d;
  --el-button-hover-bg-color: #c8553d;
  --el-button-hover-border-color: #c8553d;
  --el-button-hover-text-color: #fff;
}
.upload-tip {
  margin-left: 12px;
  font-size: 12px;
  color: #b0a690;
}

/* preview */
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
  background: #e8dfc6;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 13px;
  color: #5c5448;
  border: 1px solid #d9cfb8;
}
</style>