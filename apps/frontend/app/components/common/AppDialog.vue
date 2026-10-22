<template>
  <VDialog
    :model-value="modelValue"
    :width="props.width"
    v-bind="$attrs"
    @update:model-value="onModelUpdate"
  >
    <template v-if="$slots.activator" #activator="activatorProps">
      <slot v-bind="activatorProps" name="activator"></slot>
    </template>
    <template v-if="$slots.default" #default="defaultProps">
      <slot v-bind="defaultProps"></slot>
    </template>
    <VCard :data-testid="dataTestid" rounded="xl" class="pa-2">
      <VCardTitle class="d-flex align-center pb-0">
        <VIcon :icon="props.headerIcon" color="primary" class="mr-4" />
        <div class="text-truncate font-weight-bold">
          <slot name="header"></slot>
        </div>
        <VSpacer />
        <VBtn
          icon="mdi-close"
          variant="text"
          @click="onModelUpdate(false)"
        />
      </VCardTitle>
      <VCardText :class="[props.paddingless ? 'pa-0' : 'py-3 px-4']">
        <slot name="body"></slot>
      </VCardText>
      <VCardActions v-if="$slots.actions" class="px-4 pb-3">
        <VSpacer />
        <slot name="actions"></slot>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<script lang="ts" setup>
export interface Props {
  headerIcon?: string;
  width?: number | string;
  paddingless?: boolean;
  dataTestid?: string;
  modelValue?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  headerIcon: 'mdi-alert',
  width: 500,
  paddingless: false,
  dataTestid: 'AppDialog',
  modelValue: false,
});

const emit = defineEmits(['open', 'close', 'update:modelValue']);

const onModelUpdate = (val: boolean) => {
  emit('update:modelValue', val);
  emit(val ? 'open' : 'close');
};
</script>

<style lang="scss" scoped>
.dialog-title {
  display: flex;

  .text-truncate {
    flex: 1;
    text-align: left;
  }
}
</style>
