<template>
  <span class="tag-chip" :style="{ '--delay': `${delay}ms` }">
    {{ label }}
  </span>
</template>

<script lang="ts" setup>
defineProps<{
  label: string;
  delay?: number;
}>();
</script>

<style lang="scss" scoped>
.tag-chip {
  display: inline-block;
  padding: 0.375rem 0.75rem;
  background: rgba(13, 115, 119, 0.08);
  border: 0.0625rem solid rgba(13, 115, 119, 0.15);
  border-radius: 1.25rem;
  font-size: 0.8125rem;
  color: var(--accent-teal);
  animation: tagFadeIn 0.4s ease-out backwards;
  animation-delay: var(--delay, 0ms);
}

@keyframes tagFadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
