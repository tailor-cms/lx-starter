<template>
  <AppDialog
    v-model="isDialogVisible"
    :width="600"
    header-icon="mdi-shield-key"
    persistent
  >
    <template #header>OAuth Client Credentials</template>
    <template #body>
      <VAlert class="mb-4" icon="mdi-alert" variant="tonal">
        Make sure to save these credentials now. The client secret will not be
        shown again!
      </VAlert>
      <div class="mb-3">
        <div class="text-caption text-grey-darken-1 mb-1">Client ID</div>
        <div class="d-flex align-center credential-row">
          <VTextField
            :model-value="clientId"
            class="credential-field"
            density="compact"
            variant="outlined"
            hide-details
            readonly
          >
            <template #append-inner>
              <VBtn
                icon="mdi-content-copy"
                size="x-small"
                variant="text"
                @click="copyToClipboard(clientId, 'Client ID')"
              />
            </template>
          </VTextField>
        </div>
      </div>
      <div class="mb-3">
        <div class="text-caption text-grey-darken-1 mb-1">Client Secret</div>
        <div class="d-flex align-center credential-row">
          <VTextField
            :model-value="showSecret ? clientSecret : '•'.repeat(40)"
            :type="showSecret ? 'text' : 'password'"
            class="credential-field secret-field"
            density="compact"
            variant="outlined"
            hide-details
            readonly
          >
            <template #append-inner>
              <VBtn
                :icon="showSecret ? 'mdi-eye-off' : 'mdi-eye'"
                size="x-small"
                variant="text"
                @click="showSecret = !showSecret"
              />
              <VBtn
                icon="mdi-content-copy"
                size="x-small"
                variant="text"
                @click="copyToClipboard(clientSecret, 'Client Secret')"
              />
            </template>
          </VTextField>
        </div>
      </div>
      <div class="d-flex justify-end pb-3 pt-4">
        <VBtn class="px-4" variant="tonal" @click="close">
          I've Saved The Credentials
        </VBtn>
      </div>
    </template>
  </AppDialog>
</template>

<script lang="ts" setup>
import AppDialog from '@/components/common/AppDialog.vue';

export interface Props {
  visible?: boolean;
  clientId?: string;
  clientSecret?: string;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  clientId: '',
  clientSecret: '',
});

const emit = defineEmits(['close', 'update:visible']);

const isDialogVisible = computed({
  get: () => props.visible,
  set(value) {
    if (!value) close();
  },
});

const showSecret = ref(false);
const notify = useNotification();

const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text);
  notify(`${label} copied to clipboard`, { color: 'success' });
};

const close = () => {
  showSecret.value = false;
  emit('update:visible', false);
  emit('close');
};
</script>

<style scoped>
.credential-field {
  font-family: monospace;
}

.credential-field :deep(input) {
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.875rem;
}

.secret-field :deep(input) {
  font-weight: 600;
}

.credential-row {
  width: 100%;
}
</style>
