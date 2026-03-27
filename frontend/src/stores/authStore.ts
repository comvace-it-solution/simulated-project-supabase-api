import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { loginApi } from "@/api/authApi";
import { fetchUserProfileApi } from "@/api/usersApi";
import type { UserProfile } from "@/types/api";

type AuthSession = {
  userId: number;
  userName: string;
};

const AUTH_STORAGE_KEY = "employee-manager-auth";

export const useAuthStore = defineStore("auth", () => {
  const session = ref<AuthSession | null>(null);
  const profile = ref<UserProfile | null>(null);
  const isSubmitting = ref(false);
  const isAuthenticated = computed(() => session.value !== null);

  const hydrate = (): void => {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!raw) {
      return;
    }

    try {
      session.value = JSON.parse(raw) as AuthSession;
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  const setSession = (nextSession: AuthSession | null): void => {
    session.value = nextSession;

    if (!nextSession) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return;
    }

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextSession));
  };

  const login = async (email: string, password: string): Promise<void> => {
    isSubmitting.value = true;

    try {
      const data = await loginApi(email, password);
      setSession({
        userId: data.userId,
        userName: data.userName,
      });
      profile.value = await fetchUserProfileApi(data.userId);
    } finally {
      isSubmitting.value = false;
    }
  };

  const refreshProfile = async (): Promise<void> => {
    if (!session.value) {
      return;
    }

    profile.value = await fetchUserProfileApi(session.value.userId);
  };

  const logout = (): void => {
    setSession(null);
    profile.value = null;
  };

  return {
    session,
    profile,
    isSubmitting,
    isAuthenticated,
    hydrate,
    login,
    logout,
    refreshProfile,
  };
});
