<template>
  <el-card class="page-card">
    <template #header>
      <div class="page-card__header">
        <div>
          <p class="page-card__eyebrow">Create</p>
          <h3>従業員登録</h3>
        </div>
        <el-tag type="warning">未接続</el-tag>
      </div>
    </template>

    <el-form label-position="top" @submit.prevent="handleSubmit">
      <el-row :gutter="20">
        <el-col :md="12">
          <el-form-item label="氏名">
            <el-input v-model="form.userName" placeholder="山田 太郎" />
          </el-form-item>
        </el-col>
        <el-col :md="12">
          <el-form-item label="メールアドレス">
            <el-input
              v-model="form.email"
              placeholder="sample@example.com"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :md="12">
          <el-form-item label="電話番号">
            <el-input v-model="form.phoneNumber" placeholder="09012345678" />
          </el-form-item>
        </el-col>
        <el-col :md="12">
          <el-form-item label="配属日">
            <el-date-picker
              v-model="form.assignmentDate"
              class="full-width"
              type="date"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-button type="primary" @click="handleSubmit">登録する</el-button>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { ElMessage } from "element-plus";

const form = reactive({
  userName: "",
  email: "",
  phoneNumber: "",
  assignmentDate: "",
});

const handleSubmit = (): void => {
  if (!form.userName.trim()) {
    ElMessage.warning("氏名を入力してください。");
    return;
  }

  if (!form.email.trim()) {
    ElMessage.warning("メールアドレスを入力してください。");
    return;
  }

  if (!form.assignmentDate) {
    ElMessage.warning("配属日を入力してください。");
    return;
  }

  ElMessage.info("従業員登録APIは未実装です。入力内容は保持されています。");
};
</script>
