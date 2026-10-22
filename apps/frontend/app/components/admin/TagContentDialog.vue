<template>
  <AppDialog v-model="isVisible" header-icon="mdi-tag" :width="1200">
    <template #header>
      Content with tag: <strong>{{ tag }}</strong>
    </template>
    <template #body>
      <VProgressCircular
        v-if="isLoading"
        class="d-block mx-auto my-8"
        color="primary"
        indeterminate
      />
      <div v-if="isLoading" class="text-center text-body-2 pb-8">
        Loading content...
      </div>
      <VAlert v-else-if="error" type="error" variant="tonal" class="ma-6">
        {{ error }}
      </VAlert>
      <div v-else-if="!hasContent" class="text-center pa-8">
        <VIcon color="grey-lighten-1" size="64">mdi-file-search-outline</VIcon>
        <div class="text-h6 mt-4">No content found</div>
        <div class="text-body-2 text-medium-emphasis">
          No activities or containers have this tag
        </div>
      </div>
      <div v-else>
        <VTabs v-model="activeTab" color="primary" class="mb-4">
          <VTab
            v-for="tab in TAB_CONFIG"
            :key="tab.value"
            :value="tab.value"
          >
            <VIcon start>{{ tab.icon }}</VIcon>
            {{ tab.label }}
            <VChip class="ml-2" size="small" variant="tonal">
              {{ getTabCount(tab.value) }}
            </VChip>
          </VTab>
        </VTabs>
        <div v-if="!currentItems.length" class="text-center pa-8">
          <div class="text-body-2 text-medium-emphasis">
            {{ currentTabConfig.emptyMessage }}
          </div>
        </div>
        <VList v-else lines="two">
          <VListItem
            v-for="item in currentItems"
            :key="item.entity.uid || item.entity.id"
            class="content-item"
          >
            <template #prepend>
              <VAvatar :color="currentTabConfig.color" size="40">
                <VIcon>{{ currentTabConfig.icon }}</VIcon>
              </VAvatar>
            </template>
            <VListItemTitle class="d-flex align-center">
              <span>{{ getItemName(item) }}</span>
              <VChip
                size="x-small"
                class="ml-2"
                variant="tonal"
                color="primary"
              >
                {{ item.entity.type }}
              </VChip>
            </VListItemTitle>
            <VListItemSubtitle>
              Repository: {{ item.repositoryId }}
            </VListItemSubtitle>
            <template #append>
              <VBtn
                icon
                size="small"
                variant="text"
                @click="toggleExpanded(item)"
              >
                <VIcon>
                  {{ isExpanded(item) ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
                </VIcon>
              </VBtn>
            </template>
            <VExpandTransition>
              <div v-if="isExpanded(item)" class="json-viewer pa-4 mt-2">
                <pre class="json-content">{{
                  JSON.stringify(item.entity, null, 2)
                }}</pre>
              </div>
            </VExpandTransition>
          </VListItem>
        </VList>
      </div>
    </template>
  </AppDialog>
</template>

<script lang="ts" setup>
import { apiClient as api } from '~/api';
import AppDialog from '@/components/common/AppDialog.vue';

interface Props {
  visible: boolean;
  tag: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

interface ContentItem {
  entity: any;
  entityType: string;
  repositoryId: string;
}

interface TabConfig {
  value: 'activities' | 'containers';
  label: string;
  icon: string;
  color: string;
  emptyMessage: string;
}

const TAB_CONFIG: TabConfig[] = [
  {
    value: 'activities',
    label: 'Activities',
    icon: 'mdi-school',
    color: 'info',
    emptyMessage: 'No activities found with this tag',
  },
  {
    value: 'containers',
    label: 'Containers',
    icon: 'mdi-folder',
    color: 'secondary',
    emptyMessage: 'No containers found with this tag',
  },
];

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

const isLoading = ref(false);
const activities = ref<ContentItem[]>([]);
const containers = ref<ContentItem[]>([]);
const activeTab = ref<'activities' | 'containers'>('activities');
const expandedItems = ref(new Set<string>());
const error = ref<string | null>(null);

const currentTabConfig = computed(
  () => TAB_CONFIG.find((tab) => tab.value === activeTab.value)!,
);

const currentItems = computed(() =>
  activeTab.value === 'activities' ? activities.value : containers.value,
);

const hasContent = computed(
  () => activities.value.length > 0 || containers.value.length > 0,
);

function getTabCount(tabValue: 'activities' | 'containers'): number {
  return tabValue === 'activities' ? activities.value.length : containers.value.length;
}

function isExpanded(item: ContentItem): boolean {
  return expandedItems.value.has(item.entity.uid || item.entity.id);
}

function toggleExpanded(item: ContentItem) {
  const uid = item.entity.uid || item.entity.id;
  if (expandedItems.value.has(uid)) {
    expandedItems.value.delete(uid);
  } else {
    expandedItems.value.add(uid);
  }
}

function getItemName(item: ContentItem): string {
  return (
    item.entity.data?.title ||
    item.entity.data?.name ||
    item.entity.meta?.title ||
    item.entity.meta?.name ||
    item.entity.uid
  );
}

async function loadContent() {
  if (!props.tag) return;
  isLoading.value = true;
  error.value = null;
  activities.value = [];
  containers.value = [];
  expandedItems.value.clear();
  try {
    const [activitiesResponse, containersResponse] = await Promise.all([
      api.content.filterActivities({ query: { tags: props.tag, limit: 50 } }),
      api.content.filterContainers({ query: { tags: props.tag, limit: 50 } }),
    ]);
    activities.value = activitiesResponse.data;
    containers.value = containersResponse.data;
    activeTab.value = activities.value.length > 0 ? 'activities' : 'containers';
  } catch (err: any) {
    error.value = err.message || 'Failed to load content';
    console.error('Error loading tag content:', err);
  } finally {
    isLoading.value = false;
  }
}

watch(
  () => [props.visible, props.tag],
  ([visible, tag]) => {
    if (visible && tag) loadContent();
  },
  { immediate: true },
);
</script>

<style scoped>
.content-item {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.content-item:last-child {
  border-bottom: none;
}

.json-viewer {
  border-radius: 4px;
  border-left: 3px solid rgb(var(--v-theme-primary));
  max-height: 400px;
  overflow: auto;
}

.json-content {
  margin: 0;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.75rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
