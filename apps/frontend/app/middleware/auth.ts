import { useAuthStore } from '@/stores/auth';
import { useConfigStore } from '@/stores/config';

/**
 * Authentication middleware
 * Ensures user is authenticated, redirects to sign-in if not.
 */
export default defineNuxtRouteMiddleware(async () => {
  const isAuthenticated = useCookie('is-authenticated');
  const authStore = useAuthStore();

  if (authStore.user) return;

  await authStore.me();
  isAuthenticated.value = authStore.user ? 'true' : null;

  if (!isAuthenticated.value) {
    return navigateTo({ name: 'sign-in' });
  }

  // Initialize Statsig after authentication
  await initStatsig();
});

const initStatsig = async () => {
  const authStore = useAuthStore();
  const config = useConfigStore();
  if (!config.props.statsigClientKey || !authStore.user?.email) return;
  const nuxtApp: any = useNuxtApp();
  await nuxtApp.$statsigInit(config.props.statsigClientKey, authStore.user.email);
};
