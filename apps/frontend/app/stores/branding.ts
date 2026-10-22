import { useLocalStorage } from '@vueuse/core';
import { useTheme } from 'vuetify';

export const brands = ['tailor', 'tailor-fire'] as const;
export type Brand = (typeof brands)[number];

export const useBrandingStore = defineStore('branding', () => {
  const theme = useTheme();
  const brand = useLocalStorage<Brand>('lx-branding', 'tailor');
  // Reset brands that no longer exist
  if (!brands.includes(brand.value)) brand.value = 'tailor';

  function setBrand(value: Brand) {
    brand.value = value;
    theme.change(value);
  }

  // Sync theme on store init
  theme.change(brand.value);

  return { brand, setBrand };
});
