<template>
  <div class="content-inspector">
    <div class="d-flex py-6 px-4">
      <h2 class="text-h5 font-weight-bold">Content Inspector</h2>
      <VSpacer />
      <VBtn
        :loading="isLoadingCatalog"
        class="font-weight-bold"
        prepend-icon="mdi-refresh"
        size="large"
        text="Refresh"
        variant="flat"
        @click="loadCatalog"
      />
    </div>
    <div class="pt-4 px-4 pb-3">
      <ContentStatsCards :content-stats="contentStats" />
    </div>
    <div class="px-4 pb-4">
      <VExpansionPanels>
        <VExpansionPanel>
          <VExpansionPanelTitle>
            <div class="d-flex align-center">
              <VIcon class="mr-3" color="purple-darken-2">mdi-brain</VIcon>
              <div>
                <div class="text-subtitle-1 font-weight-medium">
                  AI Content Analysis
                </div>
                <div class="text-caption text-medium-emphasis">
                  <template v-if="analysisData?.hasAnalysis">
                    {{ analysisData.tagDistribution.length }} tags,
                    {{ analysisData.profilingQuestions.length }} questions
                  </template>
                  <template v-else>
                    Click to view or generate analysis
                  </template>
                </div>
              </div>
            </div>
          </VExpansionPanelTitle>
          <VExpansionPanelText>
            <ContentAnalysisSection
              :analysis="analysisData"
              @refresh="refreshAnalysis"
            />
          </VExpansionPanelText>
        </VExpansionPanel>
      </VExpansionPanels>
    </div>
    <div class="px-4 pb-4">
      <ContentRepositoryTable
        :repositories="repositories"
        :loading="isLoadingCatalog"
        @select="openRepositoryDialog"
      />
    </div>
    <ContentNodeDialog
      v-model:visible="showContentDialog"
      :repository-uid="selectedRepositoryUid"
    />
  </div>
</template>

<script lang="ts" setup>
import type { ContentStatsDto, ContentAnalysisDto } from 'app-api-client';
import { apiClient as api } from '~/api';
import ContentAnalysisSection from '@/components/admin/ContentAnalysisSection';
import ContentNodeDialog from '@/components/admin/ContentNodeDialog.vue';
import ContentRepositoryTable from '@/components/admin/ContentRepositoryTable.vue';
import ContentStatsCards from '@/components/admin/ContentStatsCards.vue';
import type { RepositoryItem } from '@/components/admin/ContentRepositoryTable.vue';

definePageMeta({
  name: 'system-content-inspector',
});

useHead({
  title: 'Content Inspector',
});

const isLoadingCatalog = ref(true);
const repositories = ref<RepositoryItem[]>([]);
const selectedRepositoryUid = ref<string | undefined>(undefined);
const showContentDialog = ref(false);
const contentStats = ref<ContentStatsDto>({
  repositories: 0,
  activities: 0,
  containers: 0,
  elements: 0,
});
const analysisData = ref<ContentAnalysisDto | null>(null);

async function loadCatalog() {
  try {
    isLoadingCatalog.value = true;
    const [catalogResponse, statsResponse, analysisResponse] =
      await Promise.all([
        api.content.list(),
        api.content.getStats(),
        api.content.getAnalysis(),
      ]);
    contentStats.value = statsResponse.data;
    analysisData.value = analysisResponse.data;
    repositories.value = catalogResponse.data.map((entry) => ({
      uid: entry.uid,
      name: entry.name || entry.uid,
      schema: entry.schema,
      publishedAt: entry.publishedAt,
    }));
  } catch (error) {
    console.error('Failed to load catalog:', error);
  } finally {
    isLoadingCatalog.value = false;
  }
}

function openRepositoryDialog(repository: RepositoryItem) {
  selectedRepositoryUid.value = repository.uid;
  showContentDialog.value = true;
}

async function refreshAnalysis() {
  try {
    const analysisResponse = await api.content.getAnalysis();
    analysisData.value = analysisResponse.data;
  } catch (error) {
    console.error('Failed to refresh analysis:', error);
  }
}

onMounted(() => {
  loadCatalog();
});
</script>

<style lang="scss" scoped>
.content-inspector {
  height: 100%;
}
</style>
