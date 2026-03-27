<template>
  <div class="attendance-detail">
    <el-card class="page-card">
      <template #header>
        <div class="page-card__header">
          <div>
            <p class="page-card__eyebrow">Monthly Insight</p>
            <h3>勤怠詳細</h3>
          </div>
          <el-button text @click="router.back()">戻る</el-button>
        </div>
      </template>

      <div class="attendance-detail__toolbar">
        <div>
          <p class="attendance-detail__user-name">
            {{ userProfile?.userName ?? "対象ユーザー" }}
          </p>
          <p class="attendance-detail__user-meta">
            {{ userProfile?.email ?? "-" }}
          </p>
        </div>

        <el-date-picker
          v-model="targetMonth"
          type="month"
          value-format="YYYY-MM"
          placeholder="対象月を選択"
          @change="handleMonthChange"
        />
      </div>
    </el-card>

    <div class="attendance-detail__stats">
      <el-card class="dashboard-card">
        <p class="attendance-detail__stat-label">月間勤務日数</p>
        <p class="attendance-detail__stat-value">{{ monthlyWorkedDays }}日</p>
      </el-card>

      <el-card class="dashboard-card">
        <p class="attendance-detail__stat-label">月間勤務時間</p>
        <p class="attendance-detail__stat-value">{{ totalWorkedHoursText }}</p>
      </el-card>

      <el-card class="dashboard-card">
        <p class="attendance-detail__stat-label">月間休憩時間</p>
        <p class="attendance-detail__stat-value">{{ totalBreakHoursText }}</p>
      </el-card>
    </div>

    <el-card class="page-card">
      <template #header>
        <div class="page-card__header">
          <div>
            <p class="page-card__eyebrow">Weekly Summary</p>
            <h3>週ごとの勤務日数</h3>
          </div>
        </div>
      </template>

      <el-table :data="weeklyRows" v-loading="isLoading" empty-text="データがありません。">
        <el-table-column prop="label" label="週" min-width="220" />
        <el-table-column prop="workedDays" label="勤務日数" min-width="120" />
      </el-table>
    </el-card>

    <el-card class="page-card">
      <template #header>
        <div class="page-card__header">
          <div>
            <p class="page-card__eyebrow">Daily Records</p>
            <h3>日別勤務一覧</h3>
          </div>
        </div>
      </template>

      <el-table :data="records" v-loading="isLoading" empty-text="勤務データがありません。">
        <el-table-column prop="workDate" label="勤務日" min-width="120" />
        <el-table-column label="勤務時間" min-width="140">
          <template #default="{ row }">
            {{ formatHours(sumWorkedMinutes(row) / 60) }}
          </template>
        </el-table-column>
        <el-table-column label="休憩時間" min-width="140">
          <template #default="{ row }">
            {{ formatHours(sumBreakMinutes(row) / 60) }}
          </template>
        </el-table-column>
        <el-table-column label="開始" min-width="180">
          <template #default="{ row }">
            {{ row.workStartDt }}
          </template>
        </el-table-column>
        <el-table-column label="終了" min-width="180">
          <template #default="{ row }">
            {{ row.workEndDt ?? "進行中" }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { fetchAttendanceRecordsApi } from "@/api/attendanceApi";
import { getApiErrorMessage } from "@/api/httpClient";
import { fetchUserProfileApi } from "@/api/usersApi";
import type { AttendanceRecord, UserProfile } from "@/types/api";

type WeeklySummaryRow = {
  label: string;
  workedDays: number;
};

const route = useRoute();
const router = useRouter();
const isLoading = ref(false);
const records = ref<AttendanceRecord[]>([]);
const userProfile = ref<UserProfile | null>(null);
const targetMonth = ref<string>(
  typeof route.query.month === "string"
    ? route.query.month
    : new Date().toISOString().slice(0, 7),
);

const userId = computed(() => Number(route.params.userId));

const toDate = (value: string | null): Date | null => {
  if (!value) {
    return null;
  }

  return new Date(value);
};

const diffMinutes = (startText: string | null, endText: string | null): number => {
  const start = toDate(startText);
  const end = toDate(endText);

  if (!start || !end) {
    return 0;
  }

  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 60000));
};

const sumBreakMinutes = (record: AttendanceRecord): number =>
  record.breaks.reduce((total: number, item) => {
    return total + diffMinutes(item.breakStartDt, item.breakEndDt);
  }, 0);

const sumWorkedMinutes = (record: AttendanceRecord): number => {
  const totalMinutes = diffMinutes(record.workStartDt, record.workEndDt);
  return Math.max(0, totalMinutes - sumBreakMinutes(record));
};

const formatHours = (value: number): string => {
  return `${value.toFixed(1)}時間`;
};

const monthlyWorkedDays = computed(() => records.value.length);

const totalWorkedMinutes = computed(() =>
  records.value.reduce((total: number, record: AttendanceRecord) => {
    return total + sumWorkedMinutes(record);
  }, 0)
);

const totalBreakMinutes = computed(() =>
  records.value.reduce((total: number, record: AttendanceRecord) => {
    return total + sumBreakMinutes(record);
  }, 0)
);

const totalWorkedHoursText = computed(() =>
  formatHours(totalWorkedMinutes.value / 60)
);

const totalBreakHoursText = computed(() =>
  formatHours(totalBreakMinutes.value / 60)
);

const getWeekStart = (dateText: string): Date => {
  const date = new Date(`${dateText}T00:00:00`);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
};

const formatDayLabel = (date: Date): string => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day}`;
};

const weeklyRows = computed<WeeklySummaryRow[]>(() => {
  const map = new Map<string, Set<string>>();

  for (const record of records.value) {
    const weekStart = getWeekStart(record.workDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const key = `${weekStart.toISOString()}__${weekEnd.toISOString()}`;
    const dates = map.get(key) ?? new Set<string>();
    dates.add(record.workDate);
    map.set(key, dates);
  }

  return Array.from(map.entries())
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, dates]) => {
      const [startText, endText] = key.split("__");
      const start = new Date(startText);
      const end = new Date(endText);

      return {
        label: `${formatDayLabel(start)} - ${formatDayLabel(end)}`,
        workedDays: dates.size,
      };
    });
});

const loadPage = async (): Promise<void> => {
  if (!Number.isInteger(userId.value) || userId.value <= 0) {
    ElMessage.error("userId が不正です。");
    return;
  }

  isLoading.value = true;

  try {
    const [profile, attendanceRecords] = await Promise.all([
      fetchUserProfileApi(userId.value),
      fetchAttendanceRecordsApi(userId.value, targetMonth.value),
    ]);

    userProfile.value = profile;
    records.value = attendanceRecords.attendanceRecords;
  } catch (error) {
    ElMessage.error(getApiErrorMessage(error));
  } finally {
    isLoading.value = false;
  }
};

const handleMonthChange = async (): Promise<void> => {
  await loadPage();
};

onMounted(async () => {
  await loadPage();
});
</script>
