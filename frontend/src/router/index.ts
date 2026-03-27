import { createRouter, createWebHistory } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AuthLayout from "@/layouts/AuthLayout.vue";
import { useLoadingStore } from "@/stores/loadingStore";
import { useAuthStore } from "@/stores/authStore";
import Login from "@/views/Login.vue";
import Dashboard from "@/views/Dashboard.vue";
import EmployeeList from "@/views/EmployeeList.vue";
import EmployeeRegistration from "@/views/EmployeeRegistration.vue";
import EmployeeDetailEdit from "@/views/EmployeeDetailEdit.vue";
import AttendanceDetail from "@/views/AttendanceDetail.vue";

const routes = [
  {
    path: "/login",
    component: AuthLayout,
    children: [
      {
        path: "",
        name: "Login",
        component: Login,
      },
    ],
  },
  {
    path: "/",
    component: DefaultLayout,
    meta: { requiresAuth: true },
    redirect: { name: "Dashboard" },
    children: [
      {
        path: "dashboard",
        name: "Dashboard",
        component: Dashboard,
      },
      {
        path: "employeelist",
        name: "EmployeeList",
        component: EmployeeList,
      },
      {
        path: "employeeregistration",
        name: "EmployeeRegistration",
        component: EmployeeRegistration,
      },
      {
        path: "employeedetailedit",
        name: "EmployeeDetailEdit",
        component: EmployeeDetailEdit,
      },
      {
        path: "attendancedetail/:userId",
        name: "AttendanceDetail",
        component: AttendanceDetail,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  auth.hydrate();

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (requiresAuth && !auth.isAuthenticated) {
    return { name: "Login" };
  }

  if (to.name === "Login" && auth.isAuthenticated) {
    return { name: "Dashboard" };
  }

  return true;
});

router.beforeEach(() => {
  const loading = useLoadingStore();
  loading.startLoading("router");
  return true;
});

router.afterEach(() => {
  const loading = useLoadingStore();
  loading.stopLoading("router");
});

router.onError(() => {
  const loading = useLoadingStore();
  loading.stopLoading("router");
});

export default router;
