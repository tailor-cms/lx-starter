<template>
  <NuxtLayout name="main">
    <VContainer max-width="1400" class="py-12">
      <div class="text-h5 font-weight-bold mb-6">Repositories</div>
      <div v-if="status === 'pending'" class="d-flex justify-center pa-16">
        <VProgressCircular indeterminate size="64" />
      </div>
      <VRow v-else-if="repositories?.length">
        <VCol
          v-for="repository in repositories"
          :key="repository.uid"
          cols="12"
          sm="6"
          lg="4"
        >
          <VCard
            :to="{
              name: 'repository',
              params: { repositoryUid: repository.uid },
            }"
            class="repository-card h-100 d-flex flex-column pa-2"
            color="surface"
            rounded="xl"
            variant="flat"
            border
          >
            <VImg
              :src="getThumbnail(repository)"
              :aspect-ratio="16 / 9"
              class="rounded-lg bg-primary-lighten-5 flex-grow-0"
              cover
            >
              <template v-if="!getThumbnail(repository)" #default>
                <div class="d-flex align-center justify-center fill-height">
                  <VIcon
                    icon="mdi-book-open-page-variant-outline"
                    color="primary-lighten-2"
                    size="56"
                  />
                </div>
              </template>
            </VImg>
            <VCardItem class="pt-4">
              <VChip
                v-if="repository.schema"
                class="mb-2 text-uppercase font-weight-bold"
                color="secondary"
                size="x-small"
                variant="tonal"
                label
              >
                {{ repository.schema }}
              </VChip>
              <VCardTitle class="text-h6 font-weight-bold text-wrap">
                {{ repository.name }}
              </VCardTitle>
            </VCardItem>
            <VCardText class="flex-grow-1 text-body-2 text-medium-emphasis">
              <div class="line-clamp">{{ repository.description }}</div>
            </VCardText>
            <VCardActions class="px-4">
              <span class="text-caption text-medium-emphasis">
                <VIcon icon="mdi-calendar-blank-outline" size="14" />
                {{ formatDate(repository.publishedAt) }}
              </span>
              <VSpacer />
              <VBtn
                append-icon="mdi-arrow-right"
                color="primary"
                text="Open"
                variant="tonal"
                rounded="pill"
              />
            </VCardActions>
          </VCard>
        </VCol>
      </VRow>
      <VSheet v-else class="text-center text-medium-emphasis py-16" border>
        <VIcon
          icon="mdi-folder-open-outline"
          size="84"
          color="grey-lighten-1"
          class="mb-4"
        />
        <div class="text-h5 text-medium-emphasis mb-2">
          No repositories available
        </div>
        <div class="text-body text-medium-emphasis">
          Check back later for new content
        </div>
      </VSheet>
    </VContainer>
  </NuxtLayout>
</template>

<script lang="ts" setup>
import type { CatalogEntryDto } from 'app-api-client';
import { formatDate as formatDateFn } from 'date-fns/format';
import { apiClient as api } from '@/api';

definePageMeta({
  name: 'home',
  middleware: ['auth', 'initial-hydration'],
});

useHead({
  title: 'Home',
});

const { data: repositories, status } = await useAsyncData(
  'repositories',
  async () => {
    const response = await api.content.list();
    return response.data;
  },
);

const getThumbnail = (repository: CatalogEntryDto): string | undefined =>
  (repository.meta as any)?.thumbnailImage?.publicUrl;

const formatDate = (date: string) =>
  date ? formatDateFn(new Date(date), 'MM/dd/yyyy') : '-';
</script>

<style lang="scss" scoped>
.repository-card {
  transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(var(--v-theme-primary), 0.16);
  }
}

.line-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
