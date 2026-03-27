<template>
  <el-card class="page-card">
    <template #header>
      <div class="page-card__header">
        <div>
          <p class="page-card__eyebrow">Create</p>
          <h3>従業員登録</h3>
        </div>
        <el-tag type="success">接続済み</el-tag>
      </div>
    </template>

    <el-form label-position="top" @submit.prevent="handleSubmit">
      <el-row :gutter="20">
        <el-col :md="12">
          <el-form-item label="ユーザー名">
            <el-input v-model="form.userName" placeholder="山田 太郎" />
          </el-form-item>
        </el-col>
        <el-col :md="12">
          <el-form-item label="パスワード">
            <el-input
              v-model="form.password"
              type="password"
              show-password
              placeholder="半角英数字6文字"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
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
          <el-form-item label="郵便番号">
            <div class="employee-registration__postal">
              <el-input v-model="form.postalCode" placeholder="1500001" />
              <el-button plain @click="handleSearchPostalCode">住所検索</el-button>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :md="12">
          <el-form-item label="都道府県">
            <el-input v-model="form.prefecture" placeholder="東京都" />
          </el-form-item>
        </el-col>
        <el-col :md="12">
          <el-form-item label="住所">
            <el-input v-model="form.streetAddress" placeholder="渋谷区1-2-3" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :md="12">
          <el-form-item label="建物名">
            <el-input v-model="form.buildingName" placeholder="サンプルマンション101" />
          </el-form-item>
        </el-col>
        <el-col :md="12">
          <el-form-item label="生年月日">
            <el-date-picker
              v-model="form.birthDate"
              class="full-width"
              type="date"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
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
import { createUserApi } from "@/api/usersApi";
import { getApiErrorMessage } from "@/api/httpClient";
import { useLoadingStore } from "@/stores/loadingStore";

type ZipcloudResponse = {
  message: string | null;
  results: Array<{
    zipcode: string;
    address1: string;
    address2: string;
    address3: string;
  }> | null;
  status: number;
};

const loading = useLoadingStore();

const form = reactive({
  userName: "",
  password: "",
  email: "",
  phoneNumber: "",
  postalCode: "",
  prefecture: "",
  streetAddress: "",
  buildingName: "",
  birthDate: "",
  assignmentDate: "",
});

const resetForm = (): void => {
  form.userName = "";
  form.password = "";
  form.email = "";
  form.phoneNumber = "";
  form.postalCode = "";
  form.prefecture = "";
  form.streetAddress = "";
  form.buildingName = "";
  form.birthDate = "";
  form.assignmentDate = "";
};

const normalizePostalCode = (postalCode: string): string =>
  postalCode.replace(/-/g, "").trim();

const handleSearchPostalCode = async (): Promise<void> => {
  const postalCode = normalizePostalCode(form.postalCode);

  if (!/^\d{7}$/.test(postalCode)) {
    ElMessage.warning("郵便番号は7桁の数字で入力してください。");
    return;
  }

  loading.startLoading("postal-code-search");

  try {
    const response = await fetch(
      `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`,
    );

    if (!response.ok) {
      throw new Error("住所検索に失敗しました。");
    }

    const data = await response.json() as ZipcloudResponse;

    if (data.status !== 200 || !data.results || data.results.length === 0) {
      ElMessage.warning(data.message ?? "該当する住所が見つかりませんでした。");
      return;
    }

    const address = data.results[0];
    form.postalCode = address.zipcode;
    form.prefecture = address.address1;
    form.streetAddress = `${address.address2}${address.address3}`;

    ElMessage.success("郵便番号から住所を反映しました。");
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "住所検索に失敗しました。";
    ElMessage.error(message);
  } finally {
    loading.stopLoading("postal-code-search");
  }
};

const handleSubmit = async (): Promise<void> => {
  if (!form.userName.trim()) {
    ElMessage.warning("ユーザー名を入力してください。");
    return;
  }

  if (!form.password.trim()) {
    ElMessage.warning("パスワードを入力してください。");
    return;
  }

  if (!/^[A-Za-z0-9]{6}$/.test(form.password.trim())) {
    ElMessage.warning("パスワードは半角英数字6文字で入力してください。");
    return;
  }

  if (!form.email.trim()) {
    ElMessage.warning("メールアドレスを入力してください。");
    return;
  }

  if (!form.phoneNumber.trim()) {
    ElMessage.warning("電話番号を入力してください。");
    return;
  }

  if (!form.postalCode.trim()) {
    ElMessage.warning("郵便番号を入力してください。");
    return;
  }

  if (!form.prefecture.trim()) {
    ElMessage.warning("都道府県を入力してください。");
    return;
  }

  if (!form.streetAddress.trim()) {
    ElMessage.warning("住所を入力してください。");
    return;
  }

  if (!form.birthDate) {
    ElMessage.warning("生年月日を入力してください。");
    return;
  }

  if (!form.assignmentDate) {
    ElMessage.warning("配属日を入力してください。");
    return;
  }

  try {
    await createUserApi({
      userName: form.userName.trim(),
      password: form.password.trim(),
      email: form.email.trim(),
      phoneNumber: form.phoneNumber.trim(),
      postalCode: normalizePostalCode(form.postalCode),
      prefecture: form.prefecture.trim(),
      streetAddress: form.streetAddress.trim(),
      buildingName: form.buildingName.trim(),
      birthDate: form.birthDate,
      assignmentDate: form.assignmentDate,
    });

    resetForm();
    ElMessage.success("従業員登録に成功しました。");
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error));
  }
};
</script>

<style scoped lang="scss">
.employee-registration__postal {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
}
</style>
