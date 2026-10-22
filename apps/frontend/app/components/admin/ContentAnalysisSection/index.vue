<template>
  <div class="content-analysis-section">
    <div v-if="!analysis?.hasAnalysis" class="empty-state pa-4">
      <div class="d-flex align-center justify-space-between pa-4">
        <div>
          <div class="text-subtitle-2 text-medium-emphasis pa-3">
            No Analysis Available
          </div>
          <div class="text-caption text-medium-emphasis">
            Generate AI-powered insights from your content repositories
          </div>
        </div>
        <VBtn
          :loading="isRegenerating"
          color="primary"
          prepend-icon="mdi-sparkles"
          variant="flat"
          @click="regenerateAnalysis"
        >
          Generate Analysis
        </VBtn>
      </div>
    </div>
    <template v-if="analysis?.hasAnalysis">
      <div class="d-flex align-center justify-space-between mb-6">
        <div class="d-flex align-center gap-4">
          <div class="text-body-2">
            <span class="text-medium-emphasis">Coverage:</span>
            <strong class="ml-1">{{ analysis.coveragePercentage }}%</strong>
            <span class="text-caption text-medium-emphasis ml-1">
              ({{ analysis.analyzedRepositories }}/{{
                analysis.totalRepositories
              }})
            </span>
          </div>
          <div
            v-if="analysis.generatedAt"
            class="text-caption text-medium-emphasis"
          >
            Generated {{ formatDate(analysis.generatedAt) }}
          </div>
        </div>
        <VBtn
          :disabled="isRegenerating"
          :loading="isRegenerating"
          color="primary"
          variant="tonal"
          size="small"
          @click="regenerateAnalysis"
        >
          <VIcon start size="small">mdi-refresh</VIcon>
          Regenerate
        </VBtn>
      </div>
      <TagDistributionCard
        v-if="analysis.tagDistribution.length"
        :tags="analysis.tagDistribution"
        :network-width="networkWidth"
        @tag-click="handleTagClick"
      />
      <VRow class="mb-4">
        <VCol v-if="analysis.difficultyDistribution.length" cols="12" md="6">
          <DistributionCard
            title="Repository Difficulty"
            icon="mdi-signal"
            icon-color="info"
            :items="analysis.difficultyDistribution"
            :total="analysis.totalRepositories"
            :config="DIFFICULTY_CONFIG"
            item-key="level"
            :tooltip="DIFFICULTY_TOOLTIP"
          />
        </VCol>
        <VCol v-if="analysis.categoryDistribution.length" cols="12" md="6">
          <DistributionCard
            title="Tag Category Weight"
            icon="mdi-tag-multiple"
            icon-color="secondary"
            :items="sortedCategories"
            :total="totalCategories"
            :config="CATEGORY_CONFIG"
            item-key="category"
            :tooltip="CATEGORY_TOOLTIP"
          />
        </VCol>
      </VRow>
      <ProfilingQuestionsCard
        v-if="analysis.profilingQuestions.length"
        :questions="analysis.profilingQuestions"
      />
    </template>
    <TagContentDialog v-model:visible="showTagDialog" :tag="selectedTag" />
  </div>
</template>

<script lang="ts" setup>
import { apiClient as api } from '~/api';
import { DIFFICULTY_CONFIG, CATEGORY_CONFIG } from './constants';
import type { ContentAnalysisDto } from 'app-api-client';
import DistributionCard from './DistributionCard.vue';
import ProfilingQuestionsCard from './ProfilingQuestionsCard.vue';
import TagContentDialog from '../TagContentDialog.vue';
import TagDistributionCard from './TagDistributionCard.vue';

export interface Props {
  analysis: ContentAnalysisDto | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  refresh: [];
}>();

const notify = useNotification();

const isRegenerating = ref(false);
const selectedTag = ref('');
const showTagDialog = ref(false);
const networkWidth = ref(800);

const DIFFICULTY_TOOLTIP = {
  title: 'Repository Count by Difficulty',
  description:
    'Shows how many repositories are classified at each difficulty level.',
  example: 'Example: "Beginner: 3" means 3 repositories are beginner-level.',
};

const CATEGORY_TOOLTIP = {
  title: 'Cumulative Tag Importance by Category',
  description:
    'Shows the sum of all tag weights within each category across all repositories.',
  example:
    'Example: "Topic: 25.3" means all topic tags combined have cumulative weight of 25.3',
};

const sortedCategories = computed(() => {
  if (!props.analysis) return [];
  return [...props.analysis.categoryDistribution].sort(
    (a, b) => b.count - a.count,
  );
});

const totalCategories = computed(() => {
  if (!props.analysis) return 1;
  return props.analysis.categoryDistribution.reduce(
    (sum, item) => sum + item.count,
    0,
  );
});

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function handleTagClick(tag: string) {
  selectedTag.value = tag;
  showTagDialog.value = true;
}

async function regenerateAnalysis() {
  isRegenerating.value = true;
  const options = {
    forceAggregated: true,
    forceRepositories: true,
  };
  notify('Performing full re-analysis...', { color: 'info', timeout: -1 });

  try {
    const response = await api.content.forceAnalysis({ body: options });
    if (response.data.success) {
      notify(`Analysis completed!`, {
        color: 'success',
        timeout: 5000,
      });
      emit('refresh');
    }
  } catch (error: any) {
    notify(`Analysis failed: ${error.message || 'Unknown error'}`, {
      color: 'error',
      timeout: 7000,
    });
  } finally {
    isRegenerating.value = false;
  }
}

function updateNetworkWidth() {
  const cards = document.querySelectorAll('.content-analysis-section .v-card');
  if (cards.length > 0) {
    const card = cards[0] as HTMLElement;
    const width = card.clientWidth - 64;
    networkWidth.value = Math.max(width, 400);
  } else {
    networkWidth.value = 800;
  }
}

onMounted(() => {
  nextTick(() => updateNetworkWidth());
  window.addEventListener('resize', updateNetworkWidth);
});

onUnmounted(() => {
  window.removeEventListener('resize', updateNetworkWidth);
});
</script>

<style lang="scss" scoped>
.content-analysis-section {
  .empty-state {
    padding: 24px;
    border-radius: 8px;
    background: rgba(var(--v-theme-surface-variant), 0.2);
  }

  .v-card {
    transition: border-color 0.2s ease;

    &:hover {
      border-color: rgba(var(--v-theme-primary), 0.4);
    }
  }
}
</style>
