<template>
  <VAppBar id="mainAppBar" height="80">
    <VContainer max-width="1456">
      <VSheet class="d-flex align-center px-4 ga-6">
        <NuxtLink :to="{ name: 'home' }" class="app-brand">
          <BrandLogo :height="40" color="primary" />
        </NuxtLink>
        <div>
          <VBtn
            v-for="link in navLinks"
            :key="link.name"
            :to="link.to"
            class="font-weight-bold"
            variant="text"
            color="primary"
            height="80"
            size="large"
            rounded="0"
          >
            {{ link.name }}
          </VBtn>
        </div>
        <VSpacer />
        <div>
          <!-- <VBtn
            class="font-weight-bold"
            variant="text"
            color="primary"
            prepend-icon="mdi-help-circle-outline"
            height="80"
            size="large"
            rounded="0"
          >
            Get help
          </VBtn> -->
          <VMenu
            attach="#mainAppBar"
            min-width="220"
            transition="slide-y-transition"
            location="bottom end"
          >
            <template #activator="{ props }">
              <VBtn
                v-bind="{ ...props, 'aria-label': 'User menu' }"
                class="font-weight-bold"
                color="primary"
                variant="text"
                height="80"
                size="large"
                rounded="0"
              >
                <template #prepend>
                  <UserAvatar :img-url="user.imgUrl" size="40" />
                </template>
                {{ user.firstName }}
              </VBtn>
            </template>
            <VList
              class="d-flex flex-column pa-2"
              color="primary"
              density="comfortable"
              slim
            >
              <VListItem
                :to="{ name: 'user-profile' }"
                title="Profile"
                prepend-icon="mdi-account-circle-outline"
                rounded="lg"
              />
              <VListItem
                :to="{ name: 'system-user-management' }"
                title="Admin"
                prepend-icon="mdi-account-cog-outline"
                rounded="lg"
              />
              <VListItem
                title="Logout"
                prepend-icon="mdi-logout"
                rounded="lg"
                @click="logout"
              />
            </VList>
          </VMenu>
        </div>
      </VSheet>
    </VContainer>
  </VAppBar>
</template>

<script lang="ts" setup>
import type { UserDto } from 'app-api-client';
import { UserAvatar } from '@app/vue-components';

import { useAuthStore } from '@/stores/auth';
import { useConfigStore } from '@/stores/config';
import BrandLogo from '@/components/common/BrandLogo.vue';

defineProps<{ user: UserDto }>();

const { $oidc } = useNuxtApp() as any;
const authStore = useAuthStore();
const config = useConfigStore();

const navLinks = [{ name: 'Repositories', to: '/' }];

const logout = async () => {
  if (authStore.isOidcActive && config.props.oidcLogoutEnabled) {
    return $oidc.logout();
  }
  await authStore.logout();
  navigateTo('/auth');
};
</script>

<style lang="scss" scoped>
.v-app-bar {
  border-bottom: 1px solid rgb(var(--v-theme-grey-lighten-3));
}

.app-brand {
  display: flex;
  cursor: pointer;
}

.v-btn--active {
  box-shadow: inset 0 -3px 0 rgb(var(--v-theme-primary));
}

.v-btn--active:deep(.v-btn__overlay) {
  opacity: 0 !important;
}
</style>
