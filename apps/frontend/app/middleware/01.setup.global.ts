import { useConfigStore } from '@/stores/config';

export default defineNuxtRouteMiddleware(() => {
  const configStore = useConfigStore();
  configStore.getConfig();
});
