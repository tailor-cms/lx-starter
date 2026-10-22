<template>
  <NuxtLayout name="main">
    <VContainer class="text-left my-8 user-panel" max-width="1200">
      <VCard class="pa-6">
        <VRow>
          <VCol
            class="d-flex flex-column align-center justify-center"
            cols="12"
            md="5"
          >
            <UserAvatar />
            <ChangePassword />
          </VCol>
          <VCol cols="12" md="7">
            <UserInfo />
          </VCol>
        </VRow>
      </VCard>
    </VContainer>
  </NuxtLayout>
</template>

<script setup lang="ts">
import ChangePassword from '@/components/user/ChangePassword.vue';
import UserAvatar from '@/components/user/Avatar/index.vue';
import UserInfo from '@/components/user/UserInfo.vue';

useHead({
  title: 'User profile',
});

definePageMeta({
  name: 'user-profile',
  middleware: ['auth'],
});
</script>

<style lang="scss" scoped>
.user-panel {
  max-width: 75rem;
}
</style>
