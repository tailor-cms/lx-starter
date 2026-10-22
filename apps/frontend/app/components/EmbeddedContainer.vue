<template>
  <div class="embedded-container d-flex flex-column ga-2">
    <component
      :is="pascalCase(element.type)"
      v-for="element in elements"
      :id="element.id"
      :key="element.id"
      :element="element"
      :user-state="{}"
    />
  </div>
</template>

<script setup lang="ts">
import upperFirst from 'lodash/upperFirst';
import camelCase from 'lodash/camelCase';

defineProps<{ elements: any[] }>();

const pascalCase = (val: string) => upperFirst(camelCase(val));
</script>

<style scoped>
.text-subtitle-1 {
  line-height: 1;
}
</style>
