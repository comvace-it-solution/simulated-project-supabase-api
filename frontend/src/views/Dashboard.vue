<template>
  <div class="dashboard-grid">
    <el-card class="dashboard-card">
      <template #header>
        <div class="dashboard-card__header">
          <span>本日の状態</span>
          <el-tag :type="statusTagType">{{ statusText }}</el-tag>
        </div>
      </template>

      <div v-if="auth.profile" class="dashboard-card__body">
        <p><strong>氏名:</strong> {{ auth.profile.userName }}</p>
        <p><strong>メール:</strong> {{ auth.profile.email }}</p>
        <p><strong>配属日:</strong> {{ auth.profile.assignmentDate }}</p>
      </div>

      <div class="dashboard-card__actions">
        <el-button type="primary" @click="handleStart">勤務開始</el-button>
        <el-button type="warning" @click="handleBreakStart">休憩開始</el-button>
        <el-button type="success" @click="handleBreakEnd">休憩終了</el-button>
        <el-button type="danger" @click="handleEnd">勤務終了</el-button>
      </div>
    </el-card>

    <el-card class="dashboard-card">
      <template #header>
        <div class="dashboard-card__header">
          <span>当月の勤務</span>
          <el-button text @click="handleMoveDetail">詳細を見る</el-button>
        </div>
      </template>

      <el-table :data="records" empty-text="勤務データがありません。">
        <el-table-column prop="workDate" label="勤務日" min-width="120" />
        <el-table-column prop="workStartDt" label="開始" min-width="180" />
        <el-table-column prop="workEndDt" label="終了" min-width="180" />
        <el-table-column label="休憩回数" min-width="100">
          <template #default="{ row }">
            {{ row.breaks.length }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import {
  endAttendanceApi,
  endBreakApi,
  fetchAttendanceRecordsApi,
  startAttendanceApi,
  startBreakApi,
} from "@/api/attendanceApi";
import { getApiErrorMessage } from "@/api/httpClient";
import { useAuthStore } from "@/stores/authStore";
import type { AttendanceRecord } from "@/types/api";

const router = useRouter();
const auth = useAuthStore();
const records = ref<AttendanceRecord[]>([]);

const currentMonth = computed(() => new Date().toISOString().slice(0, 7));

const statusText = computed(() => {
  const state = auth.profile?.currentAttendanceState;

  if (state === 1) {
    return "勤務中";
  }

  if (state === 2) {
    return "休憩中";
  }

  return "非勤務中";
});

const statusTagType = computed(() => {
  const state = auth.profile?.currentAttendanceState;

  if (state === 1) {
    return "success";
  }

  if (state === 2) {
    return "warning";
  }

  return "info";
});

const refreshDashboard = async (): Promise<void> => {
  if (!auth.session) {
    return;
  }

  await auth.refreshProfile();
  const recordResponse = await fetchAttendanceRecordsApi(
    auth.session.userId,
    currentMonth.value,
  );
  records.value = recordResponse.attendanceRecords;
};

const executeAction = async (
  action: (userId: number) => Promise<unknown>,
  successMessage: string,
): Promise<void> => {
  if (!auth.session) {
    return;
  }

  try {
    await action(auth.session.userId);
    await refreshDashboard();
    ElMessage.success(successMessage);
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error));
  }
};

const handleStart = async (): Promise<void> => {
  await executeAction(startAttendanceApi, "勤務開始を登録しました。");
};

const handleBreakStart = async (): Promise<void> => {
  await executeAction(startBreakApi, "休憩開始を登録しました。");
};

const handleBreakEnd = async (): Promise<void> => {
  await executeAction(endBreakApi, "休憩終了を登録しました。");
};

const handleEnd = async (): Promise<void> => {
  await executeAction(endAttendanceApi, "勤務終了を登録しました。");
};

const handleMoveDetail = (): void => {
  if (!auth.session) {
    return;
  }

  router.push({
    name: "AttendanceDetail",
    params: { userId: auth.session.userId },
    query: { month: currentMonth.value },
  });
};

onMounted(async () => {
  try {
    await refreshDashboard();
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error));
  }
});
</script>
