<template>
  <NuxtLayout name="main">
    <VContainer max-width="1200" class="text-left my-8">
      <VRow>
        <VCol cols="12" md="3">
          <AdminSidebar />
        </VCol>
        <VCol cols="12" md="9">
          <NuxtPage />
        </VCol>
      </VRow>
    </VContainer>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import AdminSidebar from '@/components/admin/AdminSidebar.vue';
import { useAuthStore } from '~/stores/auth';

definePageMeta({
  name: 'admin',
  middleware: ['auth'],
});

const authStore = useAuthStore();

onBeforeMount(async () => {
  // Refetch user info to get the latest permissions
  await authStore.me();
  if (authStore.isAdmin) return;
  navigateTo({ name: 'home' });
});
</script>
