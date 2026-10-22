<template>
  <NuxtLayout name="main">
    <VContainer max-width="1200" class="py-8">
      <VBreadcrumbs :items="breadcrumbs" class="px-0 mb-2" />
      <div v-if="isLoading" class="d-flex justify-center pa-16">
        <VProgressCircular indeterminate size="64" />
      </div>
      <VAlert v-else-if="error" type="error" variant="tonal">
        {{ error }}
      </VAlert>
      <template v-else-if="node">
        <h1 class="text-h4 font-weight-bold mb-1">{{ repository?.name }}</h1>
        <div class="text-subtitle-1 text-medium-emphasis mb-8">
          {{ nodeTitle }}
        </div>
        <template v-if="node.contentContainers?.length">
          <ContentContainer
            v-for="container in sortByPosition(node.contentContainers)"
            :key="container.uid"
            :container="container"
          />
        </template>
        <VSheet v-else class="pa-16 text-center" border>
          <VIcon icon="mdi-alert-circle-outline" size="64" class="mb-4" />
          <div class="text-h6 text-medium-emphasis">Node has no content</div>
        </VSheet>
      </template>
      <VSheet v-else class="pa-16 text-center" border>
        <VIcon icon="mdi-file-hidden" size="64" class="mb-4" />
        <div class="text-h6 text-medium-emphasis">
          Repository has no content
        </div>
      </VSheet>
    </VContainer>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import type { ActivityDto, RepositoryDto } from 'app-api-client';
import { apiClient as api } from '@/api';
import ContentContainer from '@/components/content/ContentContainer.vue';
import { useActivityTracking } from '~/composables/useActivityTracking';
import { findFirstContentNode, sortByPosition } from '@/utils/content';

definePageMeta({
  name: 'repository',
  middleware: ['auth', 'initial-hydration'],
});

const route = useRoute();
const { trackView } = useActivityTracking();

const repositoryUid = computed(() => route.params.repositoryUid as string);

const isLoading = ref(true);
const error = ref<string | null>(null);
const repository = ref<RepositoryDto>();
const node = ref<ActivityDto | null>(null);

const nodeTitle = computed(() => (node.value?.meta as any)?.name);

const breadcrumbs = computed(() => [
  { title: 'Repositories', to: { name: 'home' } },
  { title: repository.value?.name ?? '', disabled: true },
]);

useHead({ title: () => repository.value?.name || 'Repository' });

async function load(uid: string) {
  if (node.value) trackView(node.value.uid);
  isLoading.value = true;
  error.value = null;
  node.value = null;
  try {
    const { data } = await api.content.getPackage({ path: { id: uid } });
    repository.value = data;
    const firstNode = findFirstContentNode(data.structure);
    if (!firstNode) return;
    const { data: nodeData } = await api.content.getNode({
      path: { id: firstNode.uid },
    });
    node.value = nodeData as ActivityDto;
  } catch (err: any) {
    error.value = err?.semanticMessage || 'Failed to load repository';
  } finally {
    isLoading.value = false;
  }
}

watch(repositoryUid, load, { immediate: true });

onBeforeUnmount(() => {
  if (node.value) trackView(node.value.uid);
});
</script>
