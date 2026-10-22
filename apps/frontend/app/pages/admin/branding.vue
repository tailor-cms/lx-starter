<template>
  <VCard class="pa-6">
    <h2 class="text-h5 font-weight-bold mb-2">Branding</h2>
    <p class="text-body-1 text-medium-emphasis mb-6">
      Select the active brand. This changes the logo and
      theme colors across the application.
    </p>
    <VItemGroup
      :model-value="brand"
      mandatory
      @update:model-value="setBrand"
    >
      <VRow dense>
        <VCol
          v-for="option in brandOptions"
          :key="option.value"
          cols="12"
          sm="6"
        >
          <VItem
            v-slot="{ isSelected, toggle }"
            :value="option.value"
          >
            <VCard
              :color="isSelected ? 'primary' : undefined"
              rounded="lg"
              variant="flat"
              border
              @click="toggle"
            >
              <VCardText class="pa-5">
                <div class="d-flex align-center mb-4">
                  <BrandLogo
                    :brand="option.value"
                    :height="32"
                    :color="isSelected ? 'white' : 'high-emphasis'"
                  />
                  <VSpacer />
                  <VChip
                    v-if="isSelected"
                    color="white"
                    rounded
                  >
                    Active
                  </VChip>
                </div>
                <div
                  class="text-subtitle-1 font-weight-bold mb-3"
                  :class="{ 'text-white': isSelected }"
                >
                  {{ option.label }}
                </div>
                <div class="d-flex flex-column ga-2">
                  <div
                    v-for="palette in getThemeColors(option.value)"
                    :key="palette.name"
                    class="d-flex align-center ga-2"
                  >
                    <span
                      class="text-caption font-weight-medium text-uppercase"
                      :class="isSelected
                        ? 'text-white'
                        : 'text-medium-emphasis'"
                    >
                      {{ palette.name }}
                    </span>
                    <VSpacer />
                    <div
                      class="d-flex rounded-pill overflow-hidden"
                      style="height: 24px"
                    >
                      <div
                        v-for="shade in palette.shades"
                        :key="shade.key"
                        :style="{ background: shade.hex }"
                        :title="shade.key"
                        style="width: 24px"
                      />
                    </div>
                  </div>
                </div>
              </VCardText>
            </VCard>
          </VItem>
        </VCol>
      </VRow>
    </VItemGroup>
  </VCard>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { useBrandingStore, type Brand } from '@/stores/branding';
import BrandLogo from '@/components/common/BrandLogo.vue';
import { brandThemes } from '@/config/themes';

definePageMeta({ name: 'admin-branding' });
useHead({ title: 'Branding' });

const brandingStore = useBrandingStore();
const { brand } = storeToRefs(brandingStore);
const { setBrand } = brandingStore;

const brandOptions: { value: Brand; label: string }[] = [
  { value: 'tailor', label: 'Tailor' },
  { value: 'tailor-fire', label: 'Tailor Fire' },
];

const palettes = ['primary', 'secondary'] as const;
const variants = [
  'darken-4', 'darken-3', 'darken-2', 'darken-1', '',
  'lighten-1', 'lighten-2', 'lighten-3', 'lighten-4', 'lighten-5',
] as const;

function getThemeColors(brand: Brand) {
  const colors = brandThemes[brand]?.colors ?? {};
  return palettes.map((palette) => ({
    name: palette,
    shades: variants
      .map((variant) => {
        const key = variant ? `${palette}-${variant}` : palette;
        return { key, hex: colors[key] as string };
      })
      .filter(({ hex }) => hex),
  }));
}
</script>
