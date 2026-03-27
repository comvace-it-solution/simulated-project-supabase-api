import { computed, ref } from "vue";
import { defineStore } from "pinia";

export const useLoadingStore = defineStore("loading", () => {
  const sources = ref<string[]>([]);
  const isLoading = computed(() => sources.value.length > 0);

  const startLoading = (source: string): void => {
    if (sources.value.includes(source)) {
      return;
    }

    sources.value.push(source);
  };

  const stopLoading = (source: string): void => {
    sources.value = sources.value.filter((current) => current !== source);
  };

  return {
    isLoading,
    startLoading,
    stopLoading,
  };
});
