import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import { createVuetify } from 'vuetify';
import { md3 } from 'vuetify/blueprints';
import { mdi } from 'vuetify/iconsets/mdi';
import { brandThemes } from '@/config/themes';

export default defineNuxtPlugin((nuxt) => {
  const vuetify = createVuetify({
    ssr: true,
    blueprint: md3,
    components,
    directives,
    defaults: {
      VBtn: {
        style: {
          letterSpacing: 'initial',
          textTransform: 'unset',
        },
      },
    },
    theme: {
      defaultTheme: 'tailor',
      themes: brandThemes,
    },
    icons: {
      defaultSet: 'mdi',
      sets: {
        mdi,
      },
    },
  });
  nuxt.vueApp.use(vuetify);
});
