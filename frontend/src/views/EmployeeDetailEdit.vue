<template>
  <el-card class="page-card">
    <template #header>
      <div class="page-card__header">
        <div>
          <p class="page-card__eyebrow">Edit</p>
          <h3>従業員編集</h3>
        </div>
        <el-tag type="success">UI準備済み</el-tag>
      </div>
    </template>

    <el-descriptions :column="2" border>
      <el-descriptions-item label="氏名">山田 太郎</el-descriptions-item>
      <el-descriptions-item label="メール">
        sample@example.com
      </el-descriptions-item>
      <el-descriptions-item label="電話番号">09012345678</el-descriptions-item>
      <el-descriptions-item label="配属日">2025-04-01</el-descriptions-item>
    </el-descriptions>

    <el-divider />

    <el-form label-position="top">
      <el-form-item label="都道府県">
        <el-input v-model="form.prefecture" placeholder="東京都" />
      </el-form-item>
      <el-form-item label="住所">
        <el-input v-model="form.streetAddress" placeholder="渋谷区1-2-3" />
      </el-form-item>
      <el-form-item label="建物名">
        <el-input v-model="form.buildingName" placeholder="サンプルマンション101" />
      </el-form-item>
      <el-button type="primary">保存する</el-button>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { reactive } from "vue";

const form = reactive({
  prefecture: "",
  streetAddress: "",
  buildingName: "",
});
</script>
