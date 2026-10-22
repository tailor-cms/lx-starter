<template>
  <VCard class="user-management pa-6">
    <div class="d-flex justify-space-between align-center mb-6">
      <div class="text-h5 font-weight-bold">User Profiles</div>
      <VBtn
        :loading="isLoading"
        class="font-weight-bold"
        prepend-icon="mdi-refresh"
        size="large"
        text="Refresh"
        variant="flat"
        @click="loadUsers"
      />
    </div>
    <VRow class="mb-4">
      <VCol cols="12">
        <VTextField
          v-model="search"
          label="Search users"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          clearable
          hide-details
        />
      </VCol>
    </VRow>
    <VDataTable
      :headers="headers"
      :items="users"
      :loading="isLoading"
      :search="search"
      items-per-page="10"
    >
      <template #[`item.email`]="{ item }">
        <div class="d-flex align-center">
          <VAvatar size="32" color="primary" class="mr-2">
            <span class="text-caption">{{ getInitials(item.email) }}</span>
          </VAvatar>
          {{ item.email }}
        </div>
      </template>
      <template #[`item.hasProfile`]="{ item }">
        <VChip
          :color="item.hasProfile ? 'success-darken-2' : 'default'"
          size="x-small"
          variant="tonal"
        >
          {{ item.hasProfile ? 'Yes' : 'No' }}
        </VChip>
      </template>
      <template #[`item.affinityCount`]="{ item }">
        <VChip
          v-if="item.affinityCount > 0"
          size="x-small"
          variant="tonal"
          color="pink-accent-2"
        >
          {{ item.affinityCount }} tags
        </VChip>
        <span v-else class="text-medium-emphasis">-</span>
      </template>
      <template #[`item.topAffinities`]="{ item }">
        <div v-if="item.topAffinities.length" class="d-flex flex-wrap ga-1">
          <VChip
            v-for="affinity in item.topAffinities.slice(0, 3)"
            :key="affinity.tag"
            size="x-small"
            variant="tonal"
            color="primary"
          >
            {{ formatTag(affinity.tag) }}
          </VChip>
        </div>
        <span v-else class="text-medium-emphasis">-</span>
      </template>
      <template #[`item.actions`]="{ item }">
        <div class="d-flex ga-1">
          <VTooltip text="View Profile" location="top">
            <template #activator="{ props: tooltipProps }">
              <VBtn
                v-bind="tooltipProps"
                icon="mdi-eye"
                variant="text"
                size="small"
                rounded="circle"
                :disabled="!item.hasProfile"
                @click="viewProfile(item)"
              />
            </template>
          </VTooltip>
          <VTooltip text="Reset Progress" location="top">
            <template #activator="{ props: tooltipProps }">
              <VBtn
                v-bind="tooltipProps"
                icon="mdi-chart-timeline-variant-shimmer"
                variant="text"
                size="small"
                rounded="circle"
                :disabled="!item.hasProfile"
                :loading="isResetting(item.id, 'progress')"
                @click="confirmReset(item, 'progress')"
              />
            </template>
          </VTooltip>
          <VTooltip text="Reset Onboarding" location="top">
            <template #activator="{ props: tooltipProps }">
              <VBtn
                v-bind="tooltipProps"
                icon="mdi-account-sync"
                variant="text"
                size="small"
                rounded="circle"
                :disabled="!item.hasProfile"
                :loading="isResetting(item.id, 'onboarding')"
                @click="confirmReset(item, 'onboarding')"
              />
            </template>
          </VTooltip>
        </div>
      </template>
    </VDataTable>
    <UserAnalyticsDashboard
      :visible="showDialog"
      :user="selectedUser"
      @update:visible="showDialog = $event"
    />
  </VCard>
</template>

<script lang="ts" setup>
import { apiClient as api } from '~/api';
import { useAuthStore } from '@/stores/auth';
import { useOnboardingStore } from '@/stores/onboarding';
import { useProgressStore } from '@/stores/progress';
import UserAnalyticsDashboard from '@/components/admin/user-analytics/index.vue';

definePageMeta({ name: 'system-user-profiles' });
useHead({ title: 'User Profiles - Admin' });

type ResetType = 'progress' | 'onboarding';

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

const RESET_CONFIG = {
  progress: {
    title: 'Reset Progress',
    message: (email: string) =>
      `Reset progress for ${email}? ` +
      'This clears visit history, affinities, and engagement. ' +
      'Onboarding preferences are preserved.',
    successMessage: (email: string) => `Progress reset for ${email}`,
    errorMessage: 'Failed to reset progress',
    body: { resetProgress: true },
  },
  onboarding: {
    title: 'Reset Onboarding',
    message: (email: string) =>
      `Reset onboarding for ${email}? ` +
      'This clears survey answers and onboarding status. ' +
      'Progress data is preserved.',
    successMessage: (email: string) => `Onboarding reset for ${email}`,
    errorMessage: 'Failed to reset onboarding',
    body: { resetOnboarding: true },
  },
} as const;

const headers = [
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Profile', key: 'hasProfile', sortable: true },
  { title: 'Affinities', key: 'affinityCount', sortable: true },
  { title: 'Top Interests', key: 'topAffinities', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const },
];

const notify = useNotification();
const confirmDialog = useConfirmationDialog();
const authStore = useAuthStore();
const progressStore = useProgressStore();
const onboardingStore = useOnboardingStore();

const isLoading = ref(true);
const showDialog = ref(false);
const search = ref('');
const users = ref<ProcessedUser[]>([]);
const selectedUser = ref<ProcessedUser | null>(null);
const resetting = ref<{ id: string; type: ResetType } | null>(null);

function flattenAffinities(
  affinities: Record<string, Record<string, any>>,
): Record<string, number> {
  const flat: Record<string, number> = {};
  for (const dimension of Object.values(affinities || {})) {
    for (const [tag, score] of Object.entries(dimension || {})) {
      flat[tag] = score?.value ?? 0;
    }
  }
  return flat;
}

function processUser(user: any): ProcessedUser {
  const { activity } = user;
  // User has profile if they have any activity data (onboarding, affinities, goals, etc.)
  const hasProfile = !!(
    activity?.onboarding ||
    activity?.affinities ||
    activity?.goals?.length ||
    activity?.visitHistory?.length
  );
  if (!hasProfile) {
    return {
      ...user,
      activity: null,
      affinityCount: 0,
      topAffinities: [],
      lastUpdatedAt: null,
      hasProfile: false,
    };
  }
  const affinities = flattenAffinities(activity.affinities || {});
  const topAffinities = Object.entries(affinities)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([tag, affinity]) => ({ tag, affinity }));
  return {
    ...user,
    activity,
    affinityCount: Object.keys(affinities).length,
    topAffinities,
    lastUpdatedAt: activity.lastUpdatedAt,
    hasProfile: true,
  };
}

async function loadUsers() {
  isLoading.value = true;
  try {
    const res = await api.user.fetch({
      query: { limit: 100, sortBy: 'updatedAt', sortOrder: 'DESC' },
    });
    users.value = (res.data || []).map(processUser);
  } finally {
    isLoading.value = false;
  }
}

function viewProfile(user: ProcessedUser) {
  selectedUser.value = user;
  showDialog.value = true;
}

async function resetUser(user: ProcessedUser, type: ResetType) {
  const config = RESET_CONFIG[type];
  resetting.value = { id: user.id, type };
  try {
    await api.learning.resetUserActivity({
      path: { userId: user.id },
      body: config.body,
    });
    // If admin resets their own profile, also clear local stores
    if (user.id === authStore.user?.id) {
      if (type === 'progress') progressStore.clearLocal();
      else onboardingStore.clearLocal();
    }
    notify(config.successMessage(user.email), { color: 'success' });
    await loadUsers();
  } catch {
    notify(config.errorMessage, { color: 'error' });
  } finally {
    resetting.value = null;
  }
}

function confirmReset(user: ProcessedUser, type: ResetType) {
  const config = RESET_CONFIG[type];
  confirmDialog({
    title: config.title,
    message: config.message(user.email),
    action: () => resetUser(user, type),
  });
}

const isResetting = (id: string, type: ResetType) =>
  resetting.value?.id === id && resetting.value?.type === type;

const getInitials = (email: string) => email.substring(0, 2).toUpperCase();

const formatTag = (tag: string) =>
  tag
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

onMounted(loadUsers);
</script>
