<template>
  <AppDialog
    v-model="isDialogVisible"
    :width="600"
    header-icon="mdi-key-variant"
    persistent
  >
    <template #header>Create OAuth Client</template>
    <template #body>
      <form novalidate @submit.prevent="submit">
        <VTextField
          v-model="nameInput"
          :error-messages="errors.name"
          class="mb-3 required"
          label="Name"
          placeholder="Production API Client"
          variant="outlined"
        />
        <VTextarea
          v-model="descriptionInput"
          :error-messages="errors.description"
          class="mb-3"
          label="Description"
          placeholder="Optional description"
          rows="2"
          variant="outlined"
        />
        <VCombobox
          v-model="scopesInput"
          :items="availableScopes"
          :error-messages="errors.scopes"
          class="mb-3 required"
          label="Scopes"
          variant="outlined"
          chips
          multiple
        />
        <VSelect
          v-model="expirationPreset"
          :items="expirationOptions"
          :error-messages="errors.expiresAt"
          class="mb-3"
          item-title="label"
          item-value="value"
          label="Expiration"
          variant="outlined"
        />
        <div class="d-flex justify-end pb-3 pt-4">
          <VBtn variant="text" @click="close">Cancel</VBtn>
          <VBtn
            :disabled="Object.values(errors).some(Boolean)"
            class="ml-2 px-4"
            type="submit"
            variant="tonal"
          >
            Create
          </VBtn>
        </div>
      </form>
    </template>
  </AppDialog>
</template>

<script lang="ts" setup>
import { object, string, array } from 'yup';
import { useForm } from 'vee-validate';
import AppDialog from '@/components/common/AppDialog.vue';

export interface Props {
  visible?: boolean;
  availableScopes?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  availableScopes: () => ['admin:*', 'read:content'],
});

const emit = defineEmits(['created', 'update:visible']);

const isDialogVisible = computed({
  get: () => props.visible,
  set(value) {
    if (!value) close();
  },
});

// Expiration preset options
const expirationOptions = [
  { label: '1 Month', value: '1month' },
  { label: '3 Months', value: '3months' },
  { label: '6 Months', value: '6months' },
  { label: '1 Year', value: '1year' },
  { label: 'Never', value: 'never' },
];

const expirationPreset = ref('never');

const { defineField, errors, handleSubmit, resetForm } = useForm({
  validationSchema: object({
    name: string().required().min(2).max(100),
    description: string().max(500),
    scopes: array().of(string()).min(1).required(),
  }),
  initialValues: {
    name: '',
    description: '',
    scopes: ['read:content'],
  },
});

const [nameInput] = defineField('name', { validateOnModelUpdate: true });
const [descriptionInput] = defineField('description', {
  validateOnModelUpdate: true,
});
const [scopesInput] = defineField('scopes', { validateOnModelUpdate: true });

const close = () => {
  emit('update:visible', false);
  resetForm();
  expirationPreset.value = 'never';
};

const submit = handleSubmit((values) => {
  const expiresAt = getExpirationDate();
  const data = {
    name: values.name,
    description: values.description,
    scopes: values.scopes,
    expiresAt,
  };
  emit('created', data);
  close();
});

// Helper to calculate expiration date
const getExpirationDate = (): string | null => {
  if (expirationPreset.value === 'never') {
    return null;
  }
  const now = new Date();
  let expiresAt: Date;
  switch (expirationPreset.value) {
    case '1month':
      expiresAt = new Date(now.setMonth(now.getMonth() + 1));
      break;
    case '3months':
      expiresAt = new Date(now.setMonth(now.getMonth() + 3));
      break;
    case '6months':
      expiresAt = new Date(now.setMonth(now.getMonth() + 6));
      break;
    case '1year':
      expiresAt = new Date(now.setFullYear(now.getFullYear() + 1));
      break;
    default:
      return null;
  }
  return expiresAt.toISOString();
};
</script>
