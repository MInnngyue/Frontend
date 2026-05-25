<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { publishPost } from '@/api/post'
import { getCategories, getCategoryChildren } from '@/api/category'
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

async function onSubmit() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    await publishPost(form.value)
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
    <div class="page-header">
      <h2>发布帖子</h2>
      <el-button @click="router.push('/')">返回广场</el-button>
    </div>

    <el-card class="form-card">
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
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.form-card {
  padding: 20px;
}
</style>
