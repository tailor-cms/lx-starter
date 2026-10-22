<template>
  <AppDialog
    v-model="isDialogVisible"
    header-icon="mdi-application"
    :width="600"
    persistent
  >
    <template #header>
      {{ isNewIntegration ? 'Create' : 'Edit' }} Integration
    </template>
    <template #body>
      <form novalidate @submit.prevent="submit">
        <VTextField
          v-model="nameInput"
          :error-messages="errors.name"
          class="mb-3 required"
          label="Name"
          placeholder="My Integration"
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
        <VSwitch
          v-model="isActiveInput"
          color="primary"
          label="Active"
          hide-details
        />
        <div class="d-flex justify-end pb-2 pt-4">
          <VBtn variant="text" @click="close">Cancel</VBtn>
          <VBtn
            :disabled="Object.values(errors).some(Boolean)"
            class="ml-2 px-4"
            type="submit"
            variant="flat"
          >
            {{ isNewIntegration ? 'Create' : 'Update' }}
          </VBtn>
        </div>
      </form>
    </template>
  </AppDialog>
</template>

<script lang="ts" setup>
import { boolean, object, string } from 'yup';
import { useForm } from 'vee-validate';
import isEmpty from 'lodash/isEmpty';
import AppDialog from '@/components/common/AppDialog.vue';

export interface Props {
  visible?: boolean;
  integrationData?: any;
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  integrationData: null,
});

const emit = defineEmits(['created', 'updated', 'update:visible']);

const isDialogVisible = computed({
  get: () => props.visible,
  set(value) {
    if (!value) close();
  },
});

const isNewIntegration = computed(() => !props.integrationData?.id);

const { defineField, errors, handleSubmit, resetForm } = useForm({
  validationSchema: object({
    name: string().required().min(2).max(100),
    description: string().max(500),
    isActive: boolean(),
  }),
  initialValues: {
    name: '',
    description: '',
    isActive: true,
  },
});

const [nameInput] = defineField('name', { validateOnModelUpdate: true });
const [descriptionInput] = defineField('description', { validateOnModelUpdate: true });
const [isActiveInput] = defineField('isActive');

watch(isDialogVisible, (val) => {
  if (!val) return;
  if (!isEmpty(props.integrationData)) {
    nameInput.value = props.integrationData.name;
    descriptionInput.value = props.integrationData.description || '';
    isActiveInput.value = props.integrationData.isActive;
  } else {
    resetForm();
  }
});

const close = () => {
  emit('update:visible', false);
  resetForm();
};

const submit = handleSubmit((values) => {
  const data = {
    name: values.name,
    description: values.description,
    isActive: values.isActive,
  };

  if (isNewIntegration.value) {
    emit('created', data);
  } else {
    emit('updated', data);
  }

  close();
});
</script>
