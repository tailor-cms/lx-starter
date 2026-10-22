<template>
  <VRow>
    <VCol
      v-for="stat in stats"
      :key="stat.label"
      cols="12"
      sm="6"
      md="4"
      lg="3"
    >
      <VCard class="stat-card" elevation="2" rounded="lg">
        <VCardText class="pa-4">
          <div class="d-flex align-center mb-3">
            <VAvatar :color="stat.color" class="mr-3" rounded="lg" size="42">
              <VIcon color="white" size="28">{{ stat.icon }}</VIcon>
            </VAvatar>
            <div class="flex-grow-1">
              <div
                class="text-caption text-medium-emphasis text-uppercase mb-1"
              >
                {{ stat.label }}
              </div>
              <div class="text-body-1">
                {{ stat.value }}
              </div>
            </div>
          </div>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<script lang="ts" setup>
import type { ContentStatsDto } from 'app-api-client';

export interface Props {
  contentStats: ContentStatsDto;
}

const props = defineProps<Props>();

interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  color: string;
}

const STAT_COLORS = {
  repositories: 'indigo',
  activities: 'success',
  containers: 'warning',
  elements: 'info',
  compressed: 'secondary',
  uncompressed: 'purple',
  compression: 'cyan',
} as const;

const stats = computed<StatCard[]>(() => {
  const { bulk, repositories, activities, containers, elements } =
    props.contentStats;

  const storageStats: StatCard[] = bulk
    ? [
        {
          label: 'Compressed',
          value: formatBytes(bulk.compressedSize),
          icon: 'mdi-database',
          color: STAT_COLORS.compressed,
        },
        {
          label: 'Uncompressed',
          value: formatBytes(bulk.jsonSize),
          icon: 'mdi-code-json',
          color: STAT_COLORS.uncompressed,
        },
        {
          label: 'Compression',
          value: `${bulk.compressionRatio}%`,
          icon: 'mdi-arrow-collapse-all',
          color: STAT_COLORS.compression,
        },
      ]
    : [];
  return [
    {
      label: 'Repositories',
      value: repositories,
      icon: 'mdi-package-variant',
      color: STAT_COLORS.repositories,
    },
    {
      label: 'Activities',
      value: activities,
      icon: 'mdi-book-open-page-variant',
      color: STAT_COLORS.activities,
    },
    {
      label: 'Containers',
      value: containers,
      icon: 'mdi-folder-open',
      color: STAT_COLORS.containers,
    },
    {
      label: 'Elements',
      value: elements,
      icon: 'mdi-file-document-outline',
      color: STAT_COLORS.elements,
    },
    ...storageStats,
  ];
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`;
}
</script>

<style lang="scss" scoped>
.stat-card {
  height: 100%;
  transition: all 0.2s ease;
}
</style>
