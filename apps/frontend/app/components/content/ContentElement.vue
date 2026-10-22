<template>
  <component
    :is="componentName"
    v-if="isSupported"
    :element="element"
    :user-state="userState"
    @interaction="interact"
  />
  <VAlert v-else type="warning" variant="tonal" density="compact">
    Unsupported content element: {{ element.type }}
  </VAlert>
</template>

<script lang="ts" setup>
import type { ContentElementDto } from 'app-api-client';
import camelCase from 'lodash/camelCase';
import upperFirst from 'lodash/upperFirst';
import { apiClient as api } from '@/api';

const props = defineProps<{ element: ContentElementDto }>();

const instance = getCurrentInstance();
const componentName = computed(() => upperFirst(camelCase(props.element.type)));
const isSupported = computed(
  () => !!instance?.appContext.components[componentName.value],
);

const userState = ref({});

const interact = async (data: any) => {
  const elementUid = props.element.uid;
  try {
    const response = await api.learning.interact({ body: { elementUid, data } });
    if (response.data) userState.value = response.data;
  } catch (error) {
    console.error('Failed to process interaction:', error);
  }
};
</script>
