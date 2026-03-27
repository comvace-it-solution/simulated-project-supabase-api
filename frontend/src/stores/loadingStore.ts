import { computed, ref } from "vue";
import { defineStore } from "pinia";

export const useLoadingStore = defineStore("loading", () => {
  const sourceCounts = ref<Record<string, number>>({});
  const isLoading = computed(() =>
    Object.values(sourceCounts.value).some((count) => count > 0)
  );

  const startLoading = (source: string): void => {
    sourceCounts.value = {
      ...sourceCounts.value,
      [source]: (sourceCounts.value[source] ?? 0) + 1,
    };
  };

  const stopLoading = (source: string): void => {
    const currentCount = sourceCounts.value[source] ?? 0;

    if (currentCount <= 1) {
      const { [source]: _removed, ...rest } = sourceCounts.value;
      sourceCounts.value = rest;
      return;
    }

    sourceCounts.value = {
      ...sourceCounts.value,
      [source]: currentCount - 1,
    };
  };

  return {
    isLoading,
    startLoading,
    stopLoading,
  };
});
