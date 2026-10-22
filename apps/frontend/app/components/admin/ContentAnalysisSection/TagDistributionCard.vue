<template>
  <VCard class="mb-4" elevation="0" variant="outlined">
    <VCardTitle class="d-flex align-center pa-4">
      <VIcon class="mr-2" color="primary" size="20">mdi-tag-multiple</VIcon>
      <span class="text-subtitle-2 font-weight-medium">Content Tags</span>
      <VSpacer />
      <VBtnGroup density="compact" variant="outlined" size="small">
        <VBtn
          :color="viewMode === 'cloud' ? 'primary' : 'grey'"
          @click="viewMode = 'cloud'"
        >
          <VIcon size="small">mdi-cloud</VIcon>
        </VBtn>
        <VBtn
          :color="viewMode === 'network' ? 'primary' : undefined"
          @click="viewMode = 'network'"
        >
          <VIcon size="small">mdi-graph-outline</VIcon>
        </VBtn>
      </VBtnGroup>
      <VChip size="x-small" variant="text" class="ml-2">
        {{ tags.length }} total
      </VChip>
    </VCardTitle>
    <VDivider />
    <VCardText class="pa-4">
      <div v-if="viewMode === 'cloud'" class="tags-cloud">
        <VTooltip
          v-for="(item, index) in sortedTags.slice(0, LIMITS.tagCloudMax)"
          :key="item.tag"
          location="top"
        >
          <template #activator="{ props: tooltipProps }">
            <VChip
              v-bind="tooltipProps"
              :color="TAG_COLORS[index % TAG_COLORS.length]"
              class="tag-chip"
              size="small"
              variant="tonal"
            >
              <span class="tag-name">{{ item.tag }}</span>
              <span class="tag-count">{{ item.count }}</span>
            </VChip>
          </template>
          <div class="pa-1">
            <div class="font-weight-bold mb-1">{{ item.tag }}</div>
            <div class="text-caption">
              <div>
                Occurrences: <strong>{{ item.count }}</strong>
              </div>
              <div>
                Weight: <strong>{{ getTagWeight(item) }}%</strong>
              </div>
              <div class="text-medium-emphasis mt-1">
                Found in {{ item.count }}
                {{ item.count === 1 ? 'repository' : 'repositories' }}
              </div>
            </div>
          </div>
        </VTooltip>
      </div>
      <div v-else class="network-container">
        <div class="category-filter">
          <VChip
            v-for="cat in CATEGORY_FILTERS"
            :key="cat.value || 'all'"
            :class="{ 'filter-chip--active': cat.value === selectedCategory }"
            :color="cat.color"
            :variant="cat.value === selectedCategory ? 'tonal' : 'outlined'"
            class="filter-chip"
            size="default"
            @click="selectedCategory = cat.value"
          >
            <VIcon start>{{ cat.icon }}</VIcon>
            {{ cat.label }}
          </VChip>
        </div>
        <TagNetworkGraph
          :tags="filteredTags"
          :width="networkWidth"
          :height="500"
          @tag-click="$emit('tag-click', $event)"
        />
      </div>
    </VCardText>
  </VCard>
</template>

<script lang="ts" setup>
import TagNetworkGraph from '../TagNetworkGraph.vue';
import {
  LIMITS,
  TAG_COLORS,
  CATEGORY_FILTERS,
} from './constants';

interface TagItem {
  tag: string;
  count: number;
  category: string;
}

interface Props {
  tags: TagItem[];
  networkWidth: number;
}

const props = defineProps<Props>();

defineEmits<{
  'tag-click': [tag: string];
}>();

const viewMode = ref<'cloud' | 'network'>('cloud');
const selectedCategory = ref<string | null>(null);

const sortedTags = computed(() => {
  return [...props.tags].sort((a, b) => b.count - a.count);
});

const filteredTags = computed(() => {
  const tags = sortedTags.value.slice(0, LIMITS.tagNetworkMax);
  if (selectedCategory.value === null) return tags;
  return tags.filter((t) => t.category === selectedCategory.value);
});

function getTagWeight(item: TagItem): number {
  const total = props.tags.reduce((sum, t) => sum + t.count, 0);
  return Math.round((item.count / total) * 100);
}
</script>

<style lang="scss" scoped>
.tags-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;

  .tag-chip {
    transition: all 0.2s ease;
    cursor: help;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .tag-name {
      font-weight: 500;
      margin-right: 6px;
    }

    .tag-count {
      opacity: 0.7;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 2px 6px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 10px;
      margin-left: 4px;
    }
  }
}

.network-container {
  position: relative;

  .category-filter {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-bottom: 16px;
    flex-wrap: wrap;

    .filter-chip {
      cursor: pointer;
      transition: all 0.2s ease;
      font-weight: 500;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      &.filter-chip--active {
        transform: scale(1.05);
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
      }
    }
  }
}
</style>
