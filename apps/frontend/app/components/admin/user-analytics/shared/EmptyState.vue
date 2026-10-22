<template>
  <div class="empty-state">
    <div class="empty-icon">
      <VIcon :icon="icon" size="48" />
    </div>
    <p class="empty-message">{{ message }}</p>
    <span v-if="hint" class="empty-hint">{{ hint }}</span>
  </div>
</template>

<script lang="ts" setup>
export interface Props {
  message: string;
  hint?: string;
  icon?: string;
}

withDefaults(defineProps<Props>(), {
  icon: 'mdi-clock-outline',
});
</script>

<style lang="scss" scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.empty-icon {
  margin-bottom: 1rem;
  color: var(--text-muted, #8c8c8c);
  opacity: 0.5;
}

.empty-message {
  font-size: 1rem;
  color: var(--text-muted, #8c8c8c);
  margin: 0 0 0.5rem 0;
}

.empty-hint {
  font-size: 0.875rem;
  color: var(--text-muted, #8c8c8c);
  opacity: 0.7;
}
</style>
