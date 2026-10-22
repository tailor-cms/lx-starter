<template>
  <VDialog
    :model-value="visible"
    transition="dialog-bottom-transition"
    fullscreen
    @update:model-value="$emit('update:visible', $event)"
  >
    <VCard>
      <VToolbar class="bg-primary-darken-3" elevation="3">
        <VBtn
          icon="mdi-close"
          color="primary-lighten-4"
          @click="$emit('update:visible', false)"
        />
        <VToolbarTitle class="text-primary-lighten-4">
          <div class="d-flex align-center">
            <VIcon class="mr-2">mdi-package-variant</VIcon>
            <div>
              <div>{{ repositoryName }}</div>
              <div class="text-caption">UID: {{ repositoryUid }}</div>
            </div>
          </div>
        </VToolbarTitle>
        <VSpacer />
        <VTabs v-model="activeTab" color="secondary-lighten-5">
          <VTab value="repository" min-width="200">
            <VIcon class="pr-4">mdi-package</VIcon>
            Repository
          </VTab>
          <VTab value="access" min-width="200">
            <VIcon class="pr-4">mdi-key</VIcon>
            Access
          </VTab>
        </VTabs>
      </VToolbar>
      <VCardText class="pa-4">
        <VProgressCircular
          v-if="loading"
          indeterminate
          color="primary"
          class="ma-4"
        />
        <VAlert
          v-else-if="error"
          type="error"
          variant="tonal"
          class="ma-4"
          closable
          @click:close="error = null"
        >
          {{ error }}
        </VAlert>
        <template v-else>
          <VWindow v-model="activeTab">
            <VWindowItem value="repository">
              <VueJsonPretty
                v-if="nodeData"
                :data="nodeData"
                :deep="4"
                :show-double-quotes="true"
                :show-length="true"
                :show-line="true"
                :highlight-mouseover-node="true"
                :collapsed-on-click-brackets="true"
              />
            </VWindowItem>
            <VWindowItem value="access">
              <VProgressCircular
                v-if="loadingAccess"
                indeterminate
                color="primary"
                class="ma-4"
              />
              <VAlert
                v-else-if="accessError"
                type="error"
                variant="tonal"
                class="ma-4"
                closable
                @click:close="accessError = null"
              >
                {{ accessError }}
              </VAlert>
              <VueJsonPretty
                v-else-if="accessData"
                :data="accessData"
                :deep="5"
                :show-double-quotes="true"
                :show-length="true"
                :show-line="true"
                :highlight-mouseover-node="true"
                :collapsed-on-click-brackets="true"
              />
            </VWindowItem>
          </VWindow>
        </template>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<script lang="ts" setup>
import 'vue-json-pretty/lib/styles.css';

import VueJsonPretty from 'vue-json-pretty';
import { apiClient as api } from '~/api';

export interface Props {
  visible?: boolean;
  repositoryUid?: string;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  repositoryUid: undefined,
});

defineEmits<{
  'update:visible': [value: boolean];
}>();

// State
const activeTab = ref('repository');
const loading = ref(false);
const error = ref<string | null>(null);
const nodeData = ref<any>(null);
const repositoryName = ref<string>('');
const loadingAccess = ref(false);
const accessError = ref<string | null>(null);
const accessData = ref<any>(null);

watch(
  () => props.visible,
  async (isVisible) => {
    if (!isVisible) {
      nodeData.value = null;
      error.value = null;
      accessData.value = null;
      accessError.value = null;
      activeTab.value = 'repository';
      return;
    }
    await loadRepositoryData();
  },
);

watch(activeTab, async (newTab) => {
  if (newTab === 'access' && !accessData.value && !loadingAccess.value) {
    await loadAccessData();
  }
});

async function loadRepositoryData() {
  if (!props.repositoryUid) return;
  loading.value = true;
  error.value = null;
  try {
    const { data } = await api.content.getPackage({
      path: { id: props.repositoryUid },
    });
    nodeData.value = data;
    repositoryName.value = data.name || props.repositoryUid;
  } catch (err) {
    console.error('Failed to load repository:', err);
    error.value = 'Failed to load repository data. Please try again.';
  } finally {
    loading.value = false;
  }
}

async function loadAccessData() {
  if (!props.repositoryUid) return;
  loadingAccess.value = true;
  accessError.value = null;
  try {
    const { data } = await api.content.getRepositoryAccess({
      path: { id: props.repositoryUid },
    });
    accessData.value = data;
  } catch (err: any) {
    console.error('Failed to load access data:', err);
    accessError.value =
      err.response?.status === 404
        ? 'Access data not available for this repository.'
        : 'Failed to load access data. Please try again.';
  } finally {
    loadingAccess.value = false;
  }
}
</script>

<style lang="scss" scoped>
:deep(.vjs-tree) {
  font-size: 14px;
  line-height: 1.6;
}
</style>
