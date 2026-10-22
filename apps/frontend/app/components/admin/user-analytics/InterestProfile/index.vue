<template>
  <section
    class="section interests-section"
    :class="{ 'is-visible': isVisible }"
  >
    <div class="section-header">
      <div class="section-icon gradient-purple">
        <VIcon icon="mdi-star-outline" size="20" />
      </div>
      <div>
        <h2 class="section-title">Learner Interest Profile</h2>
        <p class="section-subtitle">
          {{ affinityCount }} tracked interests across
          {{ activeDimensionsCount }}
          dimensions
        </p>
      </div>
    </div>
    <InterestsLegend v-if="topAffinities.length" />
    <div class="interests-hero">
      <div v-if="topAffinities.length" class="interests-showcase">
        <InterestCard
          v-for="(interest, index) in topAffinities.slice(0, 8)"
          :key="interest.tag"
          :interest="interest"
          :rank="index + 1"
          :delay="index * 60"
        />
      </div>
      <EmptyState
        v-else
        message="No interests tracked yet"
        hint="Interests are built from onboarding surveys and learning activity"
        icon="mdi-star-outline"
      />
    </div>
    <div class="interests-secondary">
      <TrendingCard
        v-if="trendingInterests.length"
        :trends="trendingInterests"
      />
      <DimensionPills
        :class="{ 'full-width': !trendingInterests.length }"
        :expanded-dimension="expandedDimension"
        :get-dimension-count="getDimensionCount"
        @toggle="handleDimensionToggle"
      />
    </div>
    <DimensionDetail
      :dimension="expandedDimension"
      :tags="expandedDimensionTags"
      @close="expandedDimension = null"
    />
    <RadarChart
      :is-visible="showRadarChart"
      :get-dimension-strength="getDimensionStrength"
      @toggle="showRadarChart = !showRadarChart"
    />
  </section>
</template>

<script lang="ts" setup>
import type { TopAffinity, TrendingInterest, DimensionTag } from '../types';
import EmptyState from '../shared/EmptyState.vue';
import InterestsLegend from './InterestsLegend.vue';
import InterestCard from './InterestCard.vue';
import TrendingCard from './TrendingCard.vue';
import DimensionPills from './DimensionPills.vue';
import DimensionDetail from './DimensionDetail.vue';
import RadarChart from './RadarChart.vue';

export interface Props {
  isVisible: boolean;
  affinityCount: number;
  activeDimensionsCount: number;
  topAffinities: TopAffinity[];
  trendingInterests: TrendingInterest[];
  getDimensionCount: (key: string) => number;
  getDimensionStrength: (key: string) => number;
  getTopTagsForDimension: (key: string) => DimensionTag[];
}

const props = defineProps<Props>();

const expandedDimension = ref<string | null>(null);
const showRadarChart = ref(false);

const expandedDimensionTags = computed(() => {
  if (!expandedDimension.value) return [];
  return props.getTopTagsForDimension(expandedDimension.value);
});

function handleDimensionToggle(key: string) {
  expandedDimension.value = expandedDimension.value === key ? null : key;
}
</script>

<style lang="scss" scoped>
.section {
  padding: 2.5rem 3.5rem;
  opacity: 0;
  transform: translateY(1.875rem);
  transition: all var(--transition-slow, 400ms cubic-bezier(0.4, 0, 0.2, 1));

  &.is-visible {
    opacity: 1;
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    padding: 1.75rem 1.5rem;
  }
}

.section-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.section-icon {
  width: 3rem;
  height: 3rem;
  border-radius: var(--radius-lg, 1rem);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-inverse, #ffffff);
  flex-shrink: 0;
}

.gradient-purple {
  background: linear-gradient(135deg, var(--accent-purple, #7209b7), #b5179e);
}

.section-title {
  font-family: var(--font-display, 'Fraunces', Georgia, serif);
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 0.125rem 0;
  color: var(--text-primary, #1a1a1a);

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
}

.section-subtitle {
  font-size: 0.875rem;
  color: var(--text-muted, #8c8c8c);
  margin: 0;
}

.interests-hero {
  margin-bottom: 1.5rem;
}

.interests-showcase {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 800px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 500px) {
    grid-template-columns: 1fr;
  }
}

.interests-secondary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  margin-bottom: 1.25rem;

  .full-width {
    grid-column: span 2;
  }

  @media (max-width: 700px) {
    grid-template-columns: 1fr;

    .full-width {
      grid-column: span 1;
    }
  }
}
</style>
