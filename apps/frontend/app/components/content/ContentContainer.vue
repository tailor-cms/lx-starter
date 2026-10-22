<template>
  <div class="content-container mb-6">
    <ContentElement
      v-for="element in sortByPosition(container.elements ?? [])"
      :key="element.uid"
      :element="element"
      class="mb-4"
    />
    <ContentContainer
      v-for="child in sortByPosition(container.containers ?? [])"
      :key="child.uid"
      :container="child"
    />
  </div>
</template>

<script lang="ts" setup>
import type { ContentContainerDto } from 'app-api-client';
import ContentElement from './ContentElement.vue';
import { sortByPosition } from '@/utils/content';

defineOptions({ name: 'ContentContainer' });

defineProps<{ container: ContentContainerDto }>();
</script>
