import { computed, ref } from "vue";
import { defineStore } from "pinia";

const LOADING_HIDE_DELAY_MS = 150;

export const useLoadingStore = defineStore("loading", () => {
  const sourceCounts = ref<Record<string, number>>({});
  const pendingStops = ref<Record<string, true>>({});
  const hideTimers = new Map<string, ReturnType<typeof window.setTimeout>>();

  const clearPendingStop = (source: string): void => {
    const timer = hideTimers.get(source);

    if (timer) {
      window.clearTimeout(timer);
      hideTimers.delete(source);
    }

    if (!(source in pendingStops.value)) {
      return;
    }

    const { [source]: _removed, ...rest } = pendingStops.value;
    pendingStops.value = rest;
  };

  const isLoading = computed(() => {
    return (
      Object.values(sourceCounts.value).some((count) => count > 0) ||
      Object.keys(pendingStops.value).length > 0
    );
  });

  const startLoading = (source: string): void => {
    clearPendingStop(source);
    sourceCounts.value = {
      ...sourceCounts.value,
      [source]: (sourceCounts.value[source] ?? 0) + 1,
    };
  };

  const stopLoading = (source: string): void => {
    const currentCount = sourceCounts.value[source] ?? 0;

    if (currentCount === 0) {
      return;
    }

    if (currentCount > 1) {
      sourceCounts.value = {
        ...sourceCounts.value,
        [source]: currentCount - 1,
      };
      return;
    }

    const { [source]: _removed, ...rest } = sourceCounts.value;
    sourceCounts.value = rest;
    pendingStops.value = {
      ...pendingStops.value,
      [source]: true,
    };
    hideTimers.set(
      source,
      window.setTimeout(() => {
        const { [source]: _ignored, ...nextPendingStops } = pendingStops.value;
        pendingStops.value = nextPendingStops;
        hideTimers.delete(source);
      }, LOADING_HIDE_DELAY_MS),
    );
  };

  const resetLoading = (): void => {
    for (const timer of hideTimers.values()) {
      window.clearTimeout(timer);
    }

    hideTimers.clear();
    sourceCounts.value = {};
    pendingStops.value = {};
  };

  return {
    isLoading,
    startLoading,
    stopLoading,
    resetLoading,
  };
});
