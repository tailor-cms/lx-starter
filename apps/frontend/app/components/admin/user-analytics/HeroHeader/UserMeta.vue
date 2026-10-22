<template>
  <div class="hero-info">
    <h1 class="hero-email">{{ email }}</h1>
    <div class="hero-meta">
      <span class="meta-item">
        <VIcon icon="mdi-calendar" size="16" />
        Member since {{ memberSince }}
      </span>
      <span class="meta-item">
        <VIcon icon="mdi-clock-outline" size="16" />
        {{ lastActiveText }}
      </span>
    </div>
  </div>
</template>

<script lang="ts" setup>
export interface Props {
  email: string;
  memberSince: string;
  lastActiveText: string;
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.hero-info {
  flex: 1;
  min-width: 12.5rem;
}

.hero-email {
  font-family: var(--font-display, 'Fraunces', Georgia, serif);
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.02em;
  color: inherit;
}

.hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
  opacity: 0.9;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .hero-email {
    font-size: 1.25rem;
  }
}
</style>
