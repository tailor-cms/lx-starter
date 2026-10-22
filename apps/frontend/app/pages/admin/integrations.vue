<template>
  <VCard class="user-management pa-6">
    <div class="d-flex justify-space-between align-center mb-6">
      <div class="text-h5 font-weight-bold">Integrations</div>
      <VBtn
        class="font-weight-bold"
        prepend-icon="mdi-credit-card-plus"
        size="large"
        text="Add Integration"
        variant="flat"
        @click.stop="showDialog()"
      />
    </div>
    <VRow class="mb-4">
      <VCol cols="12" md="3">
      </VCol>
      <VCol cols="12" md="9">
        <VTextField
          v-model="filter"
          aria-label="Search integrations"
          label="Search integrations"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          clearable
          hide-details
        />
      </VCol>
    </VRow>
    <VDataTable
      :headers="headers"
      :items="filteredIntegrations"
      :items-per-page="10"
      :loading="isLoading"
      class="pt-4"
      item-value="id"
    >
      <template #item="{ item }">
        <tr :key="item.id" class="integration-entry">
          <td class="text-no-wrap text-left">
            <VIcon class="mr-2">mdi-application</VIcon>
            {{ item.name }}
          </td>
          <td class="text-truncate text-left">
            {{ item.description || '/' }}
          </td>
          <td class="text-no-wrap text-left">
            <VChip
              :color="item.isActive ? 'success' : 'error'"
              rounded="xl"
              size="small"
              variant="tonal"
            >
              {{ item.isActive ? 'Active' : 'Inactive' }}
            </VChip>
          </td>
          <td class="text-no-wrap text-left">
            <VBtn
              aria-label="Edit integration"
              icon="mdi-pencil"
              size="small"
              variant="text"
              @click="showDialog(item)"
            />
            <VBtn
              aria-label="Delete integration"
              icon="mdi-delete"
              size="small"
              variant="text"
              @click="deleteIntegration(item)"
            />
          </td>
        </tr>
      </template>
    </VDataTable>
    <IntegrationDialog
      v-model:visible="isDialogVisible"
      :integration-data="editedIntegration"
      @created="handleCreate"
      @updated="handleUpdate"
    />
  </VCard>
</template>

<script lang="ts" setup>
import { apiClient as api } from '~/api';
import IntegrationDialog from '@/components/admin/IntegrationDialog.vue';

definePageMeta({
  name: 'system-integrations',
});

useHead({
  title: 'Integrations',
});

const headers = [
  { title: 'Name', value: 'name', sortable: true },
  { title: 'Description', value: 'description', sortable: false },
  { title: 'Status', value: 'isActive', sortable: true },
  { title: 'Actions', value: 'actions', sortable: false },
];

const notify = useNotification();
const isLoading = ref(true);
const isDialogVisible = ref(false);
const integrations = ref<any[]>([]);
const filter = ref('');
const editedIntegration = ref<any>(null);

const filteredIntegrations = computed(() => {
  if (!filter.value) return integrations.value;
  const searchTerm = filter.value.toLowerCase();
  return integrations.value.filter(
    (int) =>
      int.name?.toLowerCase().includes(searchTerm) ||
      int.description?.toLowerCase().includes(searchTerm),
  );
});

const showDialog = (integration: any = null) => {
  editedIntegration.value = integration;
  isDialogVisible.value = true;
};

const fetchIntegrations = async () => {
  isLoading.value = true;
  try {
    const response = await api.integrations.list();
    integrations.value = Array.isArray(response.data) ? response.data : [];
  } catch {
    notify('Failed to load integrations', { color: 'error' });
  } finally {
    isLoading.value = false;
  }
};

const handleCreate = async (data: any) => {
  try {
    await api.integrations.create({ body: data });
    notify('Integration created successfully');
    await fetchIntegrations();
  } catch (error: any) {
    notify(error.response?.data?.message || 'Failed to create integration', {
      color: 'error',
    });
  }
};

const handleUpdate = async (data: any) => {
  try {
    await api.integrations.update({
      path: { id: editedIntegration.value.id },
      body: data,
    });
    notify('Integration updated successfully');
    await fetchIntegrations();
  } catch (error: any) {
    notify(error.response?.data?.message || 'Failed to update integration', {
      color: 'error',
    });
  }
};

const deleteIntegration = async (integration: any) => {
  const showDialog = useConfirmationDialog();
  showDialog({
    title: 'Delete Integration',
    message: `Are you sure you want to delete "${integration.name}"?`,
    action: async () => {
      try {
        await api.integrations.delete({ path: { id: integration.id } });
        notify('Integration deleted successfully');
        await fetchIntegrations();
      } catch (error: any) {
        const message =
          error.response?.data?.message || 'Failed to delete integration';
        notify(message, { color: 'error' });
      }
    },
  });
};

onMounted(() => {
  fetchIntegrations();
});
</script>

<style lang="scss" scoped>
td.text-truncate {
  max-width: 12rem;
}
</style>
