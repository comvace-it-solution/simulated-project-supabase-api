<template>
  <div class="auth-card">
    <div>
      <p class="auth-card__eyebrow">Shift Control</p>
      <h2 class="auth-card__title">従業員ログイン</h2>
      <p class="auth-card__description">
        Supabase Edge Functions へ接続する管理フロントです。
      </p>
    </div>

    <el-form label-position="top" @submit.prevent="handleSubmit">
      <el-form-item label="メールアドレス">
        <el-input
          v-model="form.email"
          placeholder="sample@example.com"
          size="large"
        />
      </el-form-item>

      <el-form-item label="パスワード">
        <el-input
          v-model="form.password"
          type="password"
          show-password
          placeholder="abc123"
          size="large"
        />
      </el-form-item>

      <el-button
        class="auth-card__button"
        type="primary"
        size="large"
        :loading="auth.isSubmitting"
        @click="handleSubmit"
      >
        ログイン
      </el-button>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { reactive } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useAuthStore } from "@/stores/authStore";
import { getApiErrorMessage } from "@/api/httpClient";

const router = useRouter();
const auth = useAuthStore();

const form = reactive({
  email: "",
  password: "",
});

const handleSubmit = async (): Promise<void> => {
  try {
    await auth.login(form.email, form.password);
    ElMessage.success("ログインに成功しました。");
    router.push({ name: "Dashboard" });
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error));
  }
};
</script>
