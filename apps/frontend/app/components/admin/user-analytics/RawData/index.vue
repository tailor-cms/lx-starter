<template>
  <section class="section raw-section" :class="{ 'is-visible': isVisible }">
    <VBtn
      class="raw-toggle"
      color="grey-darken-1"
      rounded="lg"
      variant="tonal"
      block
      @click="showRaw = !showRaw"
    >
      <template #prepend>
        <VIcon icon="mdi-code-braces" size="16" />
      </template>
      {{ showRaw ? 'Hide' : 'Show' }} Raw Profile Data
      <template #append>
        <VIcon
          :icon="showRaw ? 'mdi-chevron-up' : 'mdi-chevron-down'"
          size="24"
        />
      </template>
    </VBtn>
    <Transition name="slide">
      <div v-if="showRaw" class="raw-content">
        <div class="raw-actions">
          <VBtn
            :prepend-icon="copySuccess ? 'mdi-check' : 'mdi-content-copy'"
            color="grey-darken-1"
            rounded="xl"
            size="small"
            variant="tonal"
            @click="handleCopy"
          >
            {{ copySuccess ? 'Copied!' : 'Copy JSON' }}
          </VBtn>
        </div>
        <div class="json-viewer-container">
          <VueJsonPretty
            v-if="data"
            :data="data as unknown as Record<string, unknown>"
            :collapsed-on-click-brackets="true"
            :deep="1"
            :highlight-mouseover-node="true"
            :show-double-quotes="false"
            :show-length="true"
            :show-line="false"
          />
        </div>
      </div>
    </Transition>
  </section>
</template>

<script lang="ts" setup>
import VueJsonPretty from 'vue-json-pretty';
import 'vue-json-pretty/lib/styles.css';
import type { ProfileData } from '../types';

export interface Props {
  isVisible: boolean;
  data: ProfileData;
}

const props = defineProps<Props>();

const showRaw = ref(false);
const copySuccess = ref(false);

const formattedJson = computed(() => {
  try {
    return JSON.stringify(props.data, null, 2);
  } catch {
    return '{}';
  }
});

async function handleCopy() {
  try {
    await navigator.clipboard.writeText(formattedJson.value);
    copySuccess.value = true;
    setTimeout(() => (copySuccess.value = false), 2000);
  } catch (e) {
    console.error('Failed to copy:', e);
  }
}

// Reset when parent closes
watch(
  () => props.isVisible,
  (visible) => {
    if (!visible) {
      showRaw.value = false;
    }
  },
);
</script>

<style lang="scss" scoped>
.section {
  padding: 2.5rem 3.5rem 3.75rem;
  opacity: 0;
  transform: translateY(30px);
  transition: all var(--transition-slow, 400ms cubic-bezier(0.4, 0, 0.2, 1));
}

.section.is-visible {
  opacity: 1;
  transform: translateY(0);
}

.raw-toggle {
  text-transform: none;
  font-weight: 500;
  padding: 1rem;
}

.raw-content {
  margin-top: 1rem;
  background: var(--bg-card, #ffffff);
  border-radius: var(--radius-md, 10px);
  overflow: hidden;
  box-shadow: var(--shadow-sm, 0 1px 3px rgba(26, 26, 26, 0.04));
}

.raw-actions {
  display: flex;
  justify-content: flex-end;
  padding: 0.75rem 1rem;
  background: var(--bg-subtle, #f5f5f3);
  border-bottom: 1px solid var(--bg-muted, #edede9);
}

.json-viewer-container {
  padding: 16px;
  max-height: 31.25rem;
  overflow-y: auto;
  background: #fafaf9;
  border-radius: var(--radius-md, 10px);
}

.json-viewer-container :deep(.vjs-tree) {
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.8125rem;
  line-height: 1.7;
  color: #374151;
}

.json-viewer-container :deep(.vjs-key) {
  color: #0d7377;
  font-weight: 600;
}

.json-viewer-container :deep(.vjs-value-string) {
  color: #b45309;
}

.json-viewer-container :deep(.vjs-value-number) {
  color: #7c3aed;
}

.json-viewer-container :deep(.vjs-value-boolean) {
  color: #059669;
}

.json-viewer-container :deep(.vjs-value-null) {
  color: #9ca3af;
}

.json-viewer-container :deep(.vjs-tree-brackets) {
  color: #6b7280;
}

.json-viewer-container :deep(.vjs-tree-node:hover) {
  background: rgba(13, 115, 119, 0.05);
}

/* Slide transition */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

@media (max-width: 768px) {
  .section {
    padding: 1.75rem 1.5rem 3.75rem;
  }
}
</style>
