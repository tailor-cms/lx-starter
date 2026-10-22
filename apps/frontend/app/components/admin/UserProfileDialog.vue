<template>
  <AppDialog
    v-model="isDialogVisible"
    header-icon="mdi-account-circle"
    fullscreen
  >
    <template #header>User Profile: {{ user?.email }}</template>
    <template #body>
      <div class="profile-body">
        <div class="mb-6">
          <div class="text-subtitle-1 font-weight-medium mb-3">
            Profile Statistics
          </div>
          <VRow>
            <VCol cols="6" md="3">
              <div class="text-h6">{{ user?.affinityCount }}</div>
              <div class="text-caption text-medium-emphasis">
                Tag Affinities
              </div>
            </VCol>
            <VCol cols="6" md="3">
              <div class="text-h6">
                {{ user?.activity?.onboarding?.survey?.length || 0 }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Questions Answered
              </div>
            </VCol>
            <VCol cols="6" md="3">
              <div class="text-h6">
                {{ user?.activity?.onboarding?.completedAt ? 'Yes' : 'No' }}
              </div>
              <div class="text-caption text-medium-emphasis">Completed</div>
            </VCol>
            <VCol cols="6" md="3">
              <div class="text-h6">
                {{ formatDate(user?.lastUpdatedAt || null) }}
              </div>
              <div class="text-caption text-medium-emphasis">Last Updated</div>
            </VCol>
          </VRow>
        </div>
        <div class="my-8">
          <div class="text-subtitle-1 font-weight-medium my-4">
            Top Tag Affinities
          </div>
          <VList density="compact" bg-color="transparent">
            <VListItem
              v-for="affinity in user?.topAffinities || []"
              :key="affinity.tag"
            >
              <template #prepend>
                <VIcon class="mr-2" color="primary" size="small">
                  mdi-tag
                </VIcon>
              </template>
              <VListItemTitle>{{ formatTag(affinity.tag) }}</VListItemTitle>
              <template #append>
                <VChip color="primary" size="small" variant="tonal">
                  {{ Math.round(affinity.affinity * 100) }}%
                </VChip>
              </template>
            </VListItem>
          </VList>
        </div>
        <VExpansionPanels bg-color="grey-">
          <VExpansionPanel>
            <VExpansionPanelTitle>
              <VIcon class="mr-2">mdi-code-json</VIcon>
              Raw Profile Data
            </VExpansionPanelTitle>
            <VExpansionPanelText>
              <pre class="raw-json">
                {{ JSON.stringify(user?.activity, null, 2) }}
              </pre>
            </VExpansionPanelText>
          </VExpansionPanel>
        </VExpansionPanels>
      </div>
    </template>
  </AppDialog>
</template>

<script lang="ts" setup>
import AppDialog from '@/components/common/AppDialog.vue';

interface Affinity {
  tag: string;
  affinity: number;
}

interface ProcessedUser {
  id: string;
  email: string;
  activity: any;
  affinityCount: number;
  topAffinities: Affinity[];
  hasProfile: boolean;
  lastUpdatedAt: string | null;
}

const props = defineProps<{
  visible: boolean;
  user: ProcessedUser | null;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

const isDialogVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
});

function formatTag(tag: string): string {
  return tag
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatDate(date: string | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString();
}
</script>

<style scoped>
.profile-body {
  padding: 24px;
  padding-bottom: 48px;
  min-height: 100%;
}

.raw-json {
  overflow-x: auto;
  padding: 12px;
  border-radius: 4px;
  font-size: 0.75rem;
}
</style>
