<template>
  <RouterView />
  <Transition name="app-loading">
    <div v-if="loading.isLoading" class="app-loading" aria-live="polite" aria-busy="true">
      <div class="app-loading__panel">
        <span class="app-loading__spinner" />
        <p class="app-loading__label">読み込み中...</p>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useLoadingStore } from "@/stores/loadingStore";

const loading = useLoadingStore();
</script>
