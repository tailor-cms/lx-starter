<template>
  <header class="hero-header" :class="{ 'is-visible': isVisible }">
    <div class="hero-mesh" />
    <div class="hero-content">
      <UserAvatar :initials="initials" />
      <UserMeta
        :email="email"
        :member-since="memberSince"
        :last-active-text="lastActiveText"
      />
      <div class="hero-status-cards">
        <StatusCard type="journey" title="Journey Stage" :info="journeyInfo" />
        <StatusCard type="level" title="Experience Level" :info="experienceInfo" />
      </div>
    </div>
  </header>
</template>

<script lang="ts" setup>
import type { StatusCardInfo } from '../types';
import UserAvatar from './UserAvatar.vue';
import UserMeta from './UserMeta.vue';
import StatusCard from './StatusCard.vue';

export interface Props {
  isVisible: boolean;
  initials: string;
  email: string;
  memberSince: string;
  lastActiveText: string;
  journeyInfo: StatusCardInfo;
  experienceInfo: StatusCardInfo;
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.hero-header {
  position: relative;
  padding: 3rem 3.5rem;
  background: linear-gradient(
    135deg,
    var(--accent-teal, #0d7377) 0%,
    var(--accent-teal-light, #14919b) 50%,
    var(--accent-sage, #81b29a) 100%
  );
  color: var(--text-inverse, #ffffff);
  overflow: hidden;
  opacity: 0;
  transform: translateY(-1.25rem);
  transition: all var(--transition-slow, 400ms cubic-bezier(0.4, 0, 0.2, 1));
}

.hero-header.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.hero-mesh {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(
      ellipse at 20% 30%,
      rgba(255, 255, 255, 0.15) 0%,
      transparent 50%
    ),
    radial-gradient(ellipse at 80% 70%, rgba(0, 0, 0, 0.1) 0%, transparent 50%);
  pointer-events: none;
}

.hero-content {
  position: relative;
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;
}

.hero-status-cards {
  display: flex;
  gap: 1rem;
  margin-left: auto;
}

@media (max-width: 1000px) {
  .hero-status-cards {
    width: 100%;
    margin-left: 0;
    margin-top: 0.5rem;
  }
}

@media (max-width: 768px) {
  .hero-header {
    padding: 2rem 1.5rem;
  }

  .hero-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 1.25rem;
  }

  .hero-status-cards {
    flex-direction: column;
    gap: 0.75rem;
  }
}

@media (max-width: 600px) {
  .hero-status-cards {
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>
