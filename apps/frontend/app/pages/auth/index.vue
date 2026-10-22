<template>
  <NuxtLayout name="centered" title="Sign in">
    <VAlert
      v-if="!!errorMessage"
      class="mb-7 text-left"
      variant="tonal"
      type="error"
      closable
    >
      {{ errorMessage }}
    </VAlert>
    <div v-if="config.props.oidcEnabled" class="mt-4">
      <VBtn
        data-testid="auth_oidcLoginBtn"
        class="font-weight-bold"
        size="x-large"
        variant="outlined"
        block
        @click="loginOIDC"
      >
        <VIcon v-if="config.oidcLoginText.includes('Google')" start>
          mdi-google
        </VIcon>
        {{ config.oidcLoginText }}
      </VBtn>
      <VDivider class="my-10" />
    </div>
    <!-- eslint-disable-next-line vuejs-accessibility/no-static-element-interactions -->
    <form novalidate @keydown.enter="signIn" @submit.prevent="signIn">
      <label class="font-weight-bold" for="email">Email</label>
      <VTextField
        id="email"
        v-model="emailInput"
        :error-messages="errors.email"
        autocomplete="username"
        class="required my-2"
        name="email"
        placeholder="you@example.com"
        prepend-inner-icon="mdi-email-outline"
        type="email"
        variant="outlined"
      />
      <label class="font-weight-bold" for="password">Password</label>
      <VTextField
        id="password"
        v-model="passwordInput"
        :error-messages="errors.password"
        autocomplete="current-password"
        class="required mt-2"
        name="password"
        placeholder="Enter your password"
        prepend-inner-icon="mdi-lock-outline"
        type="password"
        variant="outlined"
      />
      <VBtn
        class="mt-4 font-weight-bold"
        size="x-large"
        variant="flat"
        block
        @click="signIn"
      >
        Sign in
      </VBtn>
      <div class="options">
        <NuxtLink :to="{ name: 'forgot-password' }">Forgot password?</NuxtLink>
      </div>
    </form>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import { object, string } from 'yup';
import { useAuthStore } from '@/stores/auth';
import { useForm } from 'vee-validate';
import { useConfigStore } from '@/stores/config';

const LOGIN_ERR_MESSAGE = 'The email or password you entered is incorrect.';

const getOidcErrorMessage = (
  email: string | null,
  query: string | null,
  buttonLabel: string,
): string | null => {
  if (email) {
    const cause = `Account with email ${email} does not exist.`;
    return `${cause}. Click "${buttonLabel}" to try with a different account.`;
  }
  if (query === 'domain_not_authorized') {
    return `
      Your email domain is not authorized to access this application.
      Please contact your administrator or use email/password login.`;
  }
  if (query === 'account_deactivated') {
    return `
      Your account has been deactivated.
      Please contact your administrator.`;
  }
  if (query === 'no_email') {
    return `
      Your email address could not be retrieved.
      Please try again or use email/password login.`;
  }
  if (query === 'authentication_failed') {
    return 'Authentication failed. Please try again.';
  }
  if (query === 'oauth_failed' || query === 'token_creation_failed') {
    return 'OAuth login failed. Please try again or use email/password.';
  }
  return null;
};

definePageMeta({
  name: 'sign-in',
});

useHead({
  title: 'Sign in',
  meta: [{ name: 'description', content: 'Sign in page' }],
});

const localError = ref('');

const { $oidc } = useNuxtApp() as any;
const config = useConfigStore();
const authStore = useAuthStore();
const route = useRoute();

const { defineField, handleSubmit, errors } = useForm({
  validationSchema: object({
    email: string().required().email(),
    password: string().required(),
  }),
});

const [emailInput] = defineField('email');
const [passwordInput] = defineField('password');

const oidcError = computed(() =>
  getOidcErrorMessage(
    route.query.accessDenied as string | null,
    route.query.error as string | null,
    config.oidcLoginText,
  ),
);

const errorMessage = computed(() => oidcError.value || localError.value);

const loginOIDC = () => {
  const action = oidcError.value ? 'reauthenticate' : 'authenticate';
  $oidc[action]();
};

const signIn = handleSubmit(({ email, password }) => {
  localError.value = '';
  authStore
    .login({ email, password })
    .then(async () => {
      const isAuthenticated = useCookie('is-authenticated');
      isAuthenticated.value = 'true';
      await authStore.me();
      navigateTo('/');
    })
    .catch((err) => {
      localError.value = err?.message || LOGIN_ERR_MESSAGE;
    });
});
</script>

<style lang="scss" scoped>
.options {
  padding: 0.875rem 0 0.25rem;
  text-align: right;
}
</style>
