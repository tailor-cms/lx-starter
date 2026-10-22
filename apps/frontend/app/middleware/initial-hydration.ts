import { useAuthStore } from '@/stores/auth';
import { useOnboardingStore } from '@/stores/onboarding';
import { useProgressStore } from '@/stores/progress';

let hydrated = false;

/**
 * Syncs localStorage with backend once per session.
 * Uses auth store user data (fetched by auth middleware).
 */
export default defineNuxtRouteMiddleware(() => {
  if (hydrated) return;
  hydrated = true;
  const { user } = useAuthStore();
  if (user?.activity) {
    useOnboardingStore().sync(user.activity);
    useProgressStore().sync(user.activity);
  }
});
