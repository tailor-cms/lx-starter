<template>
  <VCard elevation="0" variant="outlined" height="100%">
    <VCardTitle class="d-flex align-center pa-4">
      <VIcon :color="iconColor" class="mr-2" size="20">{{ icon }}</VIcon>
      <span class="text-subtitle-2 font-weight-medium">{{ title }}</span>
      <VTooltip v-if="tooltip" location="top" max-width="400">
        <template #activator="{ props: tooltipProps }">
          <VIcon
            v-bind="tooltipProps"
            class="ml-1"
            color="grey-darken-1"
            size="16"
          >
            mdi-information-outline
          </VIcon>
        </template>
        <div class="text-caption pa-2">
          <div class="font-weight-medium mb-1">{{ tooltip.title }}</div>
          <div class="mb-2">{{ tooltip.description }}</div>
          <div class="text-grey-lighten-1 font-italic">
            {{ tooltip.example }}
          </div>
        </div>
      </VTooltip>
      <VSpacer />
      <VChip size="x-small" variant="text" class="text-medium-emphasis">
        {{ Math.round(total) }} total
      </VChip>
    </VCardTitle>
    <VDivider />
    <VCardText class="pa-4">
      <div class="distribution-chart">
        <div v-for="item in items" :key="item[itemKey]" class="chart-row">
          <div class="chart-label">
            <VIcon :color="config[item[itemKey]]?.color || 'grey'" size="18">
              {{ config[item[itemKey]]?.icon || 'mdi-help-circle' }}
            </VIcon>
            <span class="text-body-2 text-capitalize ml-2">
              {{ item[itemKey] }}
            </span>
          </div>
          <div class="chart-bar-container">
            <div
              class="chart-bar"
              :class="`chart-bar--${config[item[itemKey]]?.color || 'grey'}`"
              :style="{ width: `${(item.count / total) * 100}%` }"
            >
              <span class="chart-value">{{ Math.round(item.count) }}</span>
            </div>
          </div>
          <div class="chart-percentage">
            {{ Math.round((item.count / total) * 100) }}%
          </div>
        </div>
      </div>
    </VCardText>
  </VCard>
</template>

<script lang="ts" setup>
import type { ConfigItem } from './constants';

interface DistributionItem {
  level?: string;
  category?: string;
  count: number;
}

interface TooltipInfo {
  title: string;
  description: string;
  example: string;
}

interface Props {
  title: string;
  icon: string;
  iconColor: string;
  items: DistributionItem[];
  total: number;
  config: Record<string, ConfigItem>;
  itemKey: 'level' | 'category';
  tooltip?: TooltipInfo;
}

defineProps<Props>();
</script>

<style lang="scss" scoped>
.distribution-chart {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.chart-row {
  display: grid;
  grid-template-columns: 130px 1fr 60px;
  align-items: center;
  gap: 12px;

  .chart-label {
    display: flex;
    align-items: center;
    font-weight: 500;
    white-space: nowrap;
  }

  .chart-bar-container {
    position: relative;
    height: 32px;
    background: rgba(var(--v-theme-surface-variant), 0.2);
    border-radius: 4px;
    overflow: hidden;

    .chart-bar {
      height: 100%;
      min-width: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 10px;
      border-radius: 4px;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

      .chart-value {
        font-size: 0.8125rem;
        font-weight: 700;
        color: white;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
        position: relative;
        z-index: 1;
        white-space: nowrap;
        letter-spacing: 0.5px;
      }

      &.chart-bar--green {
        background: linear-gradient(90deg, #43a047, #66bb6a) !important;
      }
      &.chart-bar--orange {
        background: linear-gradient(90deg, #fb8c00, #ffa726) !important;
      }
      &.chart-bar--deep-orange {
        background: linear-gradient(90deg, #f4511e, #ff7043) !important;
      }
      &.chart-bar--red {
        background: linear-gradient(90deg, #e53935, #ef5350) !important;
      }
      &.chart-bar--blue {
        background: linear-gradient(90deg, #1e88e5, #42a5f5) !important;
      }
      &.chart-bar--purple {
        background: linear-gradient(90deg, #8e24aa, #ab47bc) !important;
      }
      &.chart-bar--teal {
        background: linear-gradient(90deg, #00897b, #26a69a) !important;
      }
      &.chart-bar--grey {
        background: linear-gradient(90deg, #757575, #9e9e9e) !important;
      }
      &.chart-bar--primary {
        background: linear-gradient(90deg, #1976d2, #2196f3) !important;
      }
      &.chart-bar--secondary {
        background: linear-gradient(90deg, #7b1fa2, #9c27b0) !important;
      }
      &.chart-bar--success {
        background: linear-gradient(90deg, #388e3c, #4caf50) !important;
      }
      &.chart-bar--info {
        background: linear-gradient(90deg, #0288d1, #03a9f4) !important;
      }
      &.chart-bar--warning {
        background: linear-gradient(90deg, #f57c00, #ff9800) !important;
      }
      &.chart-bar--error {
        background: linear-gradient(90deg, #d32f2f, #f44336) !important;
      }
      &.chart-bar--indigo {
        background: linear-gradient(90deg, #3f51b5, #5c6bc0) !important;
      }
      &.chart-bar--cyan {
        background: linear-gradient(90deg, #0097a7, #00acc1) !important;
      }
      &.chart-bar--light-blue {
        background: linear-gradient(90deg, #0288d1, #039be5) !important;
      }
      &.chart-bar--pink {
        background: linear-gradient(90deg, #c2185b, #e91e63) !important;
      }
      &.chart-bar--deep-purple {
        background: linear-gradient(90deg, #512da8, #673ab7) !important;
      }

      &:hover {
        filter: brightness(1.15);
        transform: scaleY(1.05);
      }
    }
  }

  .chart-percentage {
    font-size: 0.8125rem;
    font-weight: 600;
    text-align: right;
    color: rgba(var(--v-theme-on-surface), 0.6);
  }
}
</style>
