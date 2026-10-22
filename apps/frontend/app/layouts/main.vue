<template>
  <div id="app" class="h-100">
    <AppBar v-if="store.user" :user="store.user" />
    <VMain class="view" scrollable>
      <slot></slot>
    </VMain>
    <ConfirmationDialog />
    <NotificationSnackbar />
  </div>
</template>

<script lang="ts" setup>
import AppBar from '~/components/common/app-bar/index.vue';
import ConfirmationDialog from '@/components/common/ConfirmationDialog.vue';
import NotificationSnackbar from '@/components/common/NotificationSnackbar.vue';
import { useAuthStore } from '~/stores/auth';

const store = useAuthStore();
</script>
