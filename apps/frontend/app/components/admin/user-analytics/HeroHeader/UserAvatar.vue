<template>
  <div class="hero-avatar">
    <span class="avatar-initials">{{ initials }}</span>
    <div class="avatar-ring" />
  </div>
</template>

<script lang="ts" setup>
export interface Props {
  initials: string;
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.hero-avatar {
  position: relative;
  width: 5.5rem;
  height: 5.5rem;
  border-radius: var(--radius-full, 9999px);
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(0.625rem);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-initials {
  font-family: var(--font-display, 'Fraunces', Georgia, serif);
  font-size: 2rem;
  font-weight: 700;
  color: inherit;
}

.avatar-ring {
  position: absolute;
  inset: -0.25rem;
  border-radius: var(--radius-full, 9999px);
  border: 0.125rem solid rgba(255, 255, 255, 0.3);
  animation: pulse-ring 3s ease-in-out infinite;
}

@keyframes pulse-ring {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.7;
  }
}
</style>
