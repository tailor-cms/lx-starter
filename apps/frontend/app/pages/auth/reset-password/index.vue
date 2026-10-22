<template>
  <NuxtLayout name="centered" title="Reset password">
    <VAlert
      v-if="notificationText"
      :color="isError ? 'primary' : 'success'"
      :type="isError ? 'error' : 'info'"
      class="mb-8"
      variant="tonal"
    >
      {{ notificationText }}
    </VAlert>
    <div v-if="isLoading" class="d-flex justify-center pt-14 pb-16">
      <VProgressCircular color="primary" size="54" indeterminate />
    </div>
    <div v-else-if="isError" class="d-flex flex-column justify-center">
      <NuxtLink
        :to="{ name: 'forgot-password' }"
        class="text-center text-primary"
      >
        <VIcon size="20">mdi-arrow-top-right-thick</VIcon>
        Click here to send another reset email.
      </NuxtLink>
      <VBtn
        :to="{ name: 'sign-in' }"
        class="mt-7 font-weight-bold"
        variant="flat"
        size="x-large"
      >
        <VIcon class="pr-2">mdi-arrow-left</VIcon>Sign in
      </VBtn>
    </div>
    <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
    <form v-else novalidate @keydown.enter="submit" @submit.prevent="submit">
      <label class="font-weight-bold" for="password">Password</label>
      <VTextField
        id="password"
        v-model="passwordInput"
        :error-messages="errors.password"
        class="required my-2"
        name="password"
        placeholder="Enter your new password"
        prepend-inner-icon="mdi-lock"
        type="password"
        variant="outlined"
      />
      <label class="font-weight-bold" for="passwordConfirmation">
        Re-enter password
      </label>
      <VTextField
        id="passwordConfirmation"
        v-model="passwordConfirmationInput"
        :error-messages="errors.passwordConfirmation"
        class="required mt-2 mb-4"
        name="passwordConfirmation"
        placeholder="Confirm your new password"
        prepend-inner-icon="mdi-lock-outline"
        type="password"
        variant="outlined"
      />
      <VBtn
        class="font-weight-bold"
        type="submit"
        variant="flat"
        size="x-large"
        block
      >
        Change password
      </VBtn>
    </form>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { object, string, ref as yupRef } from 'yup';
import { useAuthStore } from '@/stores/auth';
import { useForm } from 'vee-validate';

import { apiClient as api } from '@/api';

definePageMeta({
  name: 'reset-password',
});

useHead({
  title: 'Reset password',
  meta: [{ name: 'description', content: 'Reset password page' }],
});

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const ERRORS = {
  default: 'An error has occurred!',
  resetToken: 'Invalid reset password token!',
};
const passwordValidationMessage =
  'Password must contain at least one lowercase letter, ' +
  'one uppercase letter, one number, and one special character';

const route = useRoute();
const authStore = useAuthStore();

const isLoading = ref(true);
const isError = ref(false);
const notificationText = ref('');

const { defineField, errors, handleSubmit } = useForm({
  validationSchema: object({
    password: string()
      .required()
      .min(8)
      .matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
        passwordValidationMessage,
      ),
    passwordConfirmation: string()
      .required()
      .oneOf([yupRef('password')], 'Password confirmation does not match'),
  }),
});

const [passwordInput] = defineField('password');
const [passwordConfirmationInput] = defineField('passwordConfirmation');

const submit = handleSubmit(async ({ password }) => {
  try {
    await authStore.resetPassword({
      password,
      token: route.query.token as string,
    });
    isError.value = false;
    notificationText.value = 'Password changed successfully. Redirecting...';
    await delay(3000);
    navigateTo({ name: 'sign-in' });
  } catch {
    isError.value = true;
    notificationText.value = ERRORS.default;
  }
});

onMounted(async () => {
  // Check if token exists in query
  if (!route.query.token) {
    isError.value = true;
    notificationText.value = ERRORS.resetToken;
    isLoading.value = false;
    return;
  }
  // Make sure the loader is visible for at least 1 second
  await delay(1000);
  try {
    const res = await api.auth.validateResetToken({
      body: { token: route.query.token },
    });
    if (res.statusCode !== 202) throw new Error('Invalid token');
  } catch (err: Error | any) {
    isError.value = true;
    notificationText.value = err?.message || ERRORS.resetToken;
  } finally {
    isLoading.value = false;
  }
});
</script>
