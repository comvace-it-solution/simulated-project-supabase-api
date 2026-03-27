<template>
  <div class="default-layout">
    <aside class="default-layout__sidebar">
      <div>
        <p class="default-layout__eyebrow">Employee Manager</p>
        <h1 class="default-layout__title">勤怠管理</h1>
      </div>

      <el-menu
        class="default-layout__menu"
        :default-active="activePath"
        router
      >
        <el-menu-item index="/dashboard">ダッシュボード</el-menu-item>
        <el-menu-item index="/employeelist">従業員一覧</el-menu-item>
        <el-menu-item index="/employeeregistration">従業員登録</el-menu-item>
        <el-menu-item index="/employeedetailedit">従業員編集</el-menu-item>
      </el-menu>

      <div class="default-layout__user-card">
        <p>{{ auth.session?.userName ?? "未ログイン" }}</p>
        <el-button type="danger" plain @click="handleLogout">ログアウト</el-button>
      </div>
    </aside>

    <div class="default-layout__main">
      <header class="default-layout__header">
        <div>
          <p class="default-layout__page-label">Operations</p>
          <h2>{{ pageTitle }}</h2>
        </div>
        <el-tag v-if="auth.profile" :type="statusTagType">
          {{ statusText }}
        </el-tag>
      </header>

      <section class="default-layout__content">
        <RouterView />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    Dashboard: "ダッシュボード",
    EmployeeList: "従業員一覧",
    EmployeeRegistration: "従業員登録",
    EmployeeDetailEdit: "従業員編集",
    AttendanceDetail: "勤怠詳細",
  };

  return titles[String(route.name)] ?? "勤怠管理";
});

const activePath = computed(() => route.path);

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

const handleLogout = (): void => {
  auth.logout();
  router.push({ name: "Login" });
};
</script>
