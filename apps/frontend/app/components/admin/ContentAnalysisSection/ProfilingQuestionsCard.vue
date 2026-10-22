<template>
  <VCard elevation="0" variant="outlined">
    <VCardTitle class="d-flex align-center pa-4">
      <VIcon class="mr-2" color="success" size="20">mdi-head-question</VIcon>
      <span class="text-subtitle-2 font-weight-medium">
        Profiling Questions
      </span>
      <VSpacer />
      <VChip size="x-small" variant="text">
        {{ questions.length }} questions
      </VChip>
    </VCardTitle>
    <VDivider />
    <VCardText class="pa-0">
      <VExpansionPanels>
        <VExpansionPanel
          v-for="(question, index) in questions"
          :key="question.id"
        >
          <VExpansionPanelTitle>
            <div class="d-flex align-center">
              <div class="q-tag mr-2">
                <VChip
                  class=""
                  size="x-small"
                  variant="tonal"
                  color="deep-purple"
                >
                  Q{{ index + 1 }} - {{ question.category }}
                </VChip>
              </div>
              <!-- eslint-disable-next-line vue/no-v-html -->
              <div class="ml-1 flex-grow-1" v-html="question.question" />
            </div>
          </VExpansionPanelTitle>
          <VExpansionPanelText>
            <div class="question-details bg-grey-lighten-5">
              <div class="mb-3">
                <div class="text-caption text-medium-emphasis mb-2">
                  Type: {{ question.type }}
                  <span v-if="question.allowMultiple" class="ml-2">
                    (Multiple selection allowed)
                  </span>
                </div>
              </div>
              <div class="text-subtitle-2 mb-2">Answer Options:</div>
              <VList density="compact">
                <VListItem
                  v-for="(option, optIndex) in question.options"
                  :key="optIndex"
                  class="mb-2"
                >
                  <template #prepend>
                    <VIcon size="small" class="mr-2">
                      mdi-checkbox-blank-circle-outline
                    </VIcon>
                  </template>
                  <VListItemTitle>{{ option.label }}</VListItemTitle>
                  <template
                    v-if="Object.keys(option.tagAffinities).length"
                    #append
                  >
                    <VTooltip location="top">
                      <template #activator="{ props: tooltipProps }">
                        <VChip
                          v-bind="tooltipProps"
                          size="x-small"
                          variant="tonal"
                          color="indigo"
                        >
                          {{ Object.keys(option.tagAffinities).length }} tags
                        </VChip>
                      </template>
                      <div class="pa-2">
                        <div
                          v-for="(weight, tag) in option.tagAffinities"
                          :key="tag"
                          class="text-caption"
                        >
                          {{ tag }}: {{ (weight * 100).toFixed(0) }}%
                        </div>
                      </div>
                    </VTooltip>
                  </template>
                </VListItem>
              </VList>
            </div>
          </VExpansionPanelText>
        </VExpansionPanel>
      </VExpansionPanels>
    </VCardText>
  </VCard>
</template>

<script lang="ts" setup>
interface QuestionOption {
  label: string;
  tagAffinities: Record<string, number>;
}

interface Question {
  id: string;
  question: string;
  category: string;
  type: string;
  allowMultiple: boolean;
  options: QuestionOption[];
}

interface Props {
  questions: Question[];
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.question-details {
  background: rgba(var(--v-theme-surface-variant), 0.2);
  padding: 16px;
  border-radius: 8px;
}

.q-tag {
  min-width: 7rem;
}
</style>
