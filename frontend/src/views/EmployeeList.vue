<template>
  <el-card class="page-card">
    <template #header>
      <div class="page-card__header">
        <div>
          <p class="page-card__eyebrow">Directory</p>
          <h3>従業員一覧</h3>
        </div>
        <el-tag type="success">API接続済み</el-tag>
      </div>
    </template>

    <el-alert
      v-if="errorMessage"
      :title="errorMessage"
      type="error"
      show-icon
      :closable="false"
    />

    <el-table class="u-mt-lg" :data="rows" v-loading="isLoading">
      <el-table-column prop="id" label="ID" min-width="80" />
      <el-table-column prop="userName" label="氏名" min-width="180" />
      <el-table-column prop="email" label="メール" min-width="240" />
      <el-table-column prop="status" label="状態" min-width="120" />
      <el-table-column label="操作" min-width="220">
        <template #default="{ row }">
          <el-button text @click="handleMoveDetail(row.id)">
            勤怠詳細へ
          </el-button>
          <el-button text type="primary" @click="handleMoveEdit(row.id)">
            編集へ
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { fetchUsersApi } from "@/api/usersApi";
import { getApiErrorMessage } from "@/api/httpClient";
import type { UserListItem } from "@/types/api";

type UserListRow = {
  id: number;
  userName: string;
  email: string;
  status: string;
};

const router = useRouter();
const isLoading = ref(false);
const errorMessage = ref("");
const users = ref<UserListItem[]>([]);

const rows = computed<UserListRow[]>(() =>
  users.value.map((user: UserListItem) => ({
    id: user.id,
    userName: user.userName,
    email: user.email,
    status: user.currentAttendanceState === 1
      ? "勤務中"
      : user.currentAttendanceState === 2
      ? "休憩中"
      : "非勤務中",
  }))
);

const handleMoveDetail = (userId: number): void => {
  router.push({
    name: "AttendanceDetail",
    params: { userId: String(userId) },
  });
};

const handleMoveEdit = (userId: number): void => {
  router.push({
    name: "EmployeeDetailEdit",
    params: { userId: String(userId) },
  });
};

onMounted(async () => {
  isLoading.value = true;
  errorMessage.value = "";

  try {
    users.value = await fetchUsersApi();
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
  } finally {
    isLoading.value = false;
  }
});
</script>
