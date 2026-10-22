<template>
  <NuxtLayout name="centered" title="Forgot password?">
    <VAlert
      :color="errorMessage ? 'error' : 'primary'"
      :model-value="showMessage"
      class="mb-8 pa-4 text-subtitle-2"
      variant="tonal"
      rounded="0"
      prominent
    >
      {{ errorMessage || 'Sending reset email...' }}
    </VAlert>
    <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
    <form
      v-if="!errorMessage"
      novalidate
      @keydown.enter="submit"
      @submit.prevent="submit"
    >
      <label class="font-weight-bold" for="email">Email</label>
      <VTextField
        id="email"
        v-model="emailInput"
        :class="['mt-2', errors.email?.length ? 'mb-3' : 'mb-1']"
        :disabled="showMessage"
        :error-messages="errors.email"
        placeholder="you@example.com"
        prepend-inner-icon="mdi-email-outline"
        type="email"
        variant="outlined"
      />
      <div class="mt-4">
        <VBtn
          v-if="!showMessage"
          class="font-weight-bold"
          type="submit"
          variant="flat"
          size="x-large"
          block
        >
          Send reset email
        </VBtn>
        <VBtn
          class="mt-2"
          variant="text"
          size="x-large"
          block
          @click.stop="$router.back()"
        >
          Go back
        </VBtn>
      </div>
    </form>
    <VBtn
      v-else
      variant="tonal"
      block
      @click.stop="resetInput"
    >
      Retry
    </VBtn>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { object, string } from 'yup';
import Promise from 'bluebird';
import { useAuthStore } from '@/stores/auth';
import { useForm } from 'vee-validate';

definePageMeta({
  name: 'forgot-password',
});

useHead({
  title: 'Request password reset',
  meta: [
    {
      name: 'description',
      content: 'Request password reset page',
    },
  ],
});

const authStore = useAuthStore();

const errorMessage = ref('');
const showMessage = ref(false);

const { defineField, handleSubmit, errors } = useForm({
  validationSchema: object({
    email: string().required().email(),
  }),
});
const [emailInput] = defineField('email');

const submit = handleSubmit(({ email }) => {
  showMessage.value = true;
  Promise.all([authStore.forgotPassword({ email }), Promise.delay(5000)])
    .then((): any => navigateTo('/'))
    .catch(() => (errorMessage.value = 'Something went wrong!'));
});

const resetInput = () => {
  emailInput.value = '';
  errorMessage.value = '';
  showMessage.value = false;
};
</script>
