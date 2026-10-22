<template>
  <VCard class="overflow-hidden pa-6">
    <VList class="py-0">
      <VListItem
        v-for="{ name, label, icon, query } in routes"
        :key="name"
        :to="{ name, query }"
        class="pa-4"
        color="primary"
        slim
      >
        <template #prepend>
          <VIcon>mdi-{{ icon }}</VIcon>
        </template>
        <VListItemTitle>
          {{ label }}
        </VListItemTitle>
      </VListItem>
    </VList>
  </VCard>
</template>

<script lang="ts" setup>
const route = useRoute();

const routes = computed(() => {
  return [
    { label: 'System Users', name: 'system-user-management', icon: 'account' },
    { label: 'User Profiles', name: 'system-user-profiles', icon: 'account-details' },
    { label: 'Integrations', name: 'system-integrations', icon: 'application' },
    { label: 'OAuth Clients', name: 'system-oauth-clients', icon: 'key-variant' },
    { label: 'Content Inspector', name: 'system-content-inspector', icon: 'file-tree' },
    { label: 'Branding', name: 'admin-branding', icon: 'palette-outline' },
  ].map((it) => ({ ...it, query: route.query }));
});
</script>
