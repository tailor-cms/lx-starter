<template>
  <VCard elevation="1" rounded="lg">
    <VCardTitle class="d-flex align-center px-6 py-4">
      <VIcon class="mr-4" size="24">mdi-package-variant</VIcon>
      <span class="text-h6">Repositories</span>
      <VSpacer />
      <VChip variant="tonal" size="small">
        {{ repositories.length }}
      </VChip>
    </VCardTitle>
    <VDivider />
    <VCardText class="pa-0">
      <VProgressCircular
        v-if="loading"
        class="ma-8"
        color="primary"
        indeterminate
      />
      <VDataTable
        v-else
        :headers="headers"
        :items="repositories"
        :items-per-page="-1"
        class="repository-table"
        density="comfortable"
        hide-default-footer
      >
        <template #item="{ item }">
          <tr class="repository-row" @click="$emit('select', item)">
            <td class="text-left">
              <div class="d-flex align-center py-2">
                <VAvatar
                  color="primary"
                  variant="tonal"
                  size="40"
                  class="mr-3"
                >
                  <VIcon size="22">mdi-package-variant</VIcon>
                </VAvatar>
                <div>
                  <div class="font-weight-medium">{{ item.name }}</div>
                  <div class="text-caption text-medium-emphasis">
                    {{ item.uid }}
                  </div>
                </div>
              </div>
            </td>
            <td class="text-left">
              <VChip
                color="teal-darken-1"
                size="small"
                variant="tonal"
              >
                {{ item.schema }}
              </VChip>
            </td>
            <td class="text-left">
              <div class="d-flex align-center">
                <VIcon size="14" class="mr-1">mdi-calendar</VIcon>
                <span class="text-body-2">
                  {{ formatDate(item.publishedAt) }}
                </span>
              </div>
            </td>
            <td class="text-center">
              <VBtn
                icon="mdi-code-json"
                size="small"
                variant="text"
                color="primary"
              />
            </td>
          </tr>
        </template>
      </VDataTable>
    </VCardText>
  </VCard>
</template>

<script lang="ts" setup>
export interface RepositoryItem {
  uid: string;
  name: string;
  schema: string;
  publishedAt?: string;
}

export interface Props {
  repositories: RepositoryItem[];
  loading?: boolean;
}

defineProps<Props>();

defineEmits<{
  select: [repository: RepositoryItem];
}>();

const headers = [
  { title: 'Repository', key: 'name', sortable: true },
  { title: 'Schema', key: 'schema', sortable: true },
  { title: 'Published', key: 'publishedAt', sortable: true },
  {
    title: 'Actions',
    key: 'actions',
    sortable: false,
    align: 'center' as const,
  },
];

function formatDate(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
</script>

<style lang="scss" scoped>
.repository-table {
  :deep(tbody tr.repository-row) {
    cursor: pointer;

    &:hover {
      background-color: rgba(var(--v-theme-primary), 0.04);
    }
  }
}
</style>
