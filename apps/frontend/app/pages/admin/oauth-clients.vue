<template>
  <VCard class="user-management pa-6">
    <div class="text-h5 font-weight-bold mb-5">
      OAuth Clients for integrations
    </div>
    <VRow class="filters">
      <VCol cols="12" md="6">
        <VSelect
          v-model="selectedIntegration"
          :items="integrations"
          item-title="name"
          item-value="id"
          label="Select Integration"
          prepend-inner-icon="mdi-application"
          variant="outlined"
          clearable
          @update:model-value="fetchClients"
        >
          <template #item="{ item, props }">
            <VListItem v-bind="props">
              <template #prepend>
                <VIcon>mdi-application</VIcon>
              </template>
              <VListItemTitle>{{ item.raw.name }}</VListItemTitle>
              <VListItemSubtitle>
                {{ item.raw.description || 'No description' }}
              </VListItemSubtitle>
            </VListItem>
          </template>
        </VSelect>
      </VCol>
      <VCol cols="12" md="6" class="d-flex align-center">
        <VSpacer />
        <VBtn
          :disabled="!selectedIntegration"
          class="font-weight-bold"
          prepend-icon="mdi-plus"
          size="large"
          text="Create Client"
          variant="flat"
          @click="showCreateDialog = true"
        />
      </VCol>
    </VRow>
    <div v-if="!selectedIntegration">
      <VAlert icon="mdi-information" variant="tonal">
        Please select an integration to manage its OAuth clients
      </VAlert>
    </div>
    <div v-else-if="clients.length === 0">
      <VAlert icon="mdi-alert" variant="tonal">
        No OAuth clients for this integration yet. Create one to allow API
        access.
      </VAlert>
    </div>
    <VCard
      v-for="client in clients"
      :key="client.id"
      class="ma-4 bg-grey-lighten-4"
      elevation="1"
    >
      <VCardText>
        <div class="d-flex align-center mb-2">
          <VIcon class="mr-2">mdi-key-variant</VIcon>
          <span class="text-h6">{{ client.name }}</span>
          <VSpacer />
          <VChip
            :color="client.isActive ? 'success' : 'error'"
            rounded="xl"
            size="small"
            variant="tonal"
          >
            {{ client.isActive ? 'Active' : 'Inactive' }}
          </VChip>
        </div>
        <div
          v-if="client.description"
          class="mx-2 text-body text-grey-darken-1 text-left"
        >
          {{ client.description }}
        </div>
        <VDivider class="my-3" />
        <VRow>
          <VCol cols="12" md="8">
            <div class="mb-2 text-left">
              <div class="text-caption text-grey-darken-1">Client ID</div>
              <div class="d-flex align-center">
                <code class="mr-2">{{ client.clientId }}</code>
                <VBtn
                  icon="mdi-content-copy"
                  size="x-small"
                  variant="text"
                  @click="copyToClipboard(client.clientId, 'Client ID')"
                />
              </div>
            </div>
            <div class="mb-2 text-left">
              <div class="text-caption text-grey-darken-1">Scopes</div>
              <div class="d-flex flex-wrap gap-1 mt-1">
                <VChip
                  v-for="scope in client.allowedScopes"
                  :key="scope"
                  color="primary"
                  size="x-small"
                  variant="tonal"
                  rounded
                >
                  {{ scope }}
                </VChip>
              </div>
            </div>
          </VCol>
          <VCol cols="12" md="4" class="text-left">
            <div class="mb-2">
              <div class="text-caption text-grey-darken-1">Created</div>
              <div class="text-body">{{ formatDate(client.createdAt) }}</div>
            </div>
            <div v-if="client.lastUsedAt" class="mb-2">
              <div class="text-caption text-grey-darken-1">Last Used</div>
              <div class="text-body">{{ formatDate(client.lastUsedAt) }}</div>
            </div>
            <div class="mb-2">
              <div class="text-caption text-grey-darken-1">Usage Count</div>
              <div class="text-body">{{ client.usageCount || 0 }}</div>
            </div>
            <div class="mb-2">
              <div class="text-caption text-grey-darken-1">Expires</div>
              <div class="d-flex align-center">
                <div class="text-body">
                  {{ client.expiresAt ? formatDate(client.expiresAt) : 'Never' }}
                </div>
                <VChip
                  v-if="client.expiresAt && client.isExpired"
                  class="ml-2"
                  color="error"
                  size="x-small"
                  rounded
                >
                  Expired
                </VChip>
              </div>
            </div>
          </VCol>
        </VRow>
        <VDivider class="my-3" />
        <div class="d-flex gap-2">
          <VBtn
            class="mr-2"
            size="small"
            variant="tonal"
            @click="rotateSecret(client)"
          >
            <VIcon class="mr-1">mdi-refresh</VIcon>
            Rotate Secret
          </VBtn>
          <VBtn
            color="error"
            size="small"
            variant="tonal"
            @click="deleteClient(client)"
          >
            <VIcon class="mr-1">mdi-delete</VIcon>
            Delete
          </VBtn>
        </div>
      </VCardText>
    </VCard>
    <OAuthClientDialog
      v-model:visible="showCreateDialog"
      :available-scopes="availableScopes"
      @created="handleCreateClient"
    />
    <OAuthCredentialsDialog
      v-model:visible="showSecretDialog"
      :client-id="newCredentials.clientId"
      :client-secret="newCredentials.clientSecret"
      @close="closeSecretDialog"
    />
  </VCard>
</template>

<script lang="ts" setup>
import { apiClient as api } from '~/api';
import { formatDate as formatDateFn } from 'date-fns/format';
import OAuthClientDialog from '@/components/admin/OAuthClientDialog.vue';
import OAuthCredentialsDialog from '@/components/admin/OAuthCredentialsDialog.vue';

definePageMeta({
  name: 'system-oauth-clients',
});

useHead({
  title: 'OAuth Clients',
});

const integrations = ref<any[]>([]);
const selectedIntegration = ref<string | null>(null);
const clients = ref<any[]>([]);
const showCreateDialog = ref(false);
const showSecretDialog = ref(false);
const newCredentials = ref({ clientId: '', clientSecret: '' });

const availableScopes = ['read:content', 'admin:*'];
const notify = useNotification();

const formatDate = (date: string) => {
  if (!date) return 'Never';
  return formatDateFn(new Date(date), 'MMM dd, yyyy HH:mm');
};

const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text);
  notify(`${label} copied to clipboard`, { color: 'success' });
};

const fetchIntegrations = async () => {
  try {
    const response = await api.integrations.list();
    integrations.value = Array.isArray(response.data) ? response.data : [];
  } catch {
    notify('Failed to load integrations', { color: 'error' });
  }
};

const fetchClients = async () => {
  if (!selectedIntegration.value) {
    clients.value = [];
    return;
  }
  try {
    const response = await api.integrationOAuthClients.list({
      path: { id: selectedIntegration.value },
    });
    clients.value = Array.isArray(response.data) ? response.data : [];
  } catch {
    notify('Failed to load OAuth clients', { color: 'error' });
  }
};

const handleCreateClient = async (data: any) => {
  if (!selectedIntegration.value) return;
  try {
    const response = await api.integrationOAuthClients.create({
      path: { id: selectedIntegration.value },
      body: data,
    });
    newCredentials.value = {
      clientId: response.data.clientId,
      clientSecret: response.data.clientSecret,
    };
    showSecretDialog.value = true;
    await fetchClients();
  } catch (error: any) {
    const errorMessage =
      error.response?.data?.error?.message ||
      error.response?.data?.message ||
      'Failed to create OAuth client';
    notify(errorMessage, { color: 'error' });
  }
};

const closeSecretDialog = () => {
  showSecretDialog.value = false;
  newCredentials.value = { clientId: '', clientSecret: '' };
};

const rotateSecret = async (client: any) => {
  if (!selectedIntegration.value) return;
  const showDialog = useConfirmationDialog();
  showDialog({
    title: 'Rotate Client Secret',
    message: 'This will invalidate the current secret. Are you sure?',
    action: async () => {
      try {
        const response = await api.integrationOAuthClients.rotateSecret({
          path: {
            id: selectedIntegration.value!,
            clientId: client.id,
          },
        });
        newCredentials.value = {
          clientId: response.data.clientId,
          clientSecret: response.data.clientSecret,
        };
        showSecretDialog.value = true;
        await fetchClients();
      } catch {
        notify('Failed to rotate secret', { color: 'error' });
      }
    },
  });
};

const deleteClient = async (client: any) => {
  if (!selectedIntegration.value) return;
  const showDialog = useConfirmationDialog();
  showDialog({
    title: 'Delete OAuth Client',
    message: `Are you sure you want to delete "${client.name}"?`,
    action: async () => {
      try {
        await api.integrationOAuthClients.delete({
          path: {
            id: selectedIntegration.value!,
            clientId: client.id,
          },
        });
        notify('OAuth client deleted successfully');
        await fetchClients();
      } catch {
        notify('Failed to delete OAuth client', { color: 'error' });
      }
    },
  });
};

onMounted(() => {
  fetchIntegrations();
});
</script>

<style scoped>
code {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
