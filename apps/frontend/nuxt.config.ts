import injectConfigHeaders from './app/lib/vite-plugins/injectConfigHeaders';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/google-fonts', '@pinia/nuxt', '@nuxtjs/device', 'nuxt-svgo'],
  ssr: false,
  devtools: { enabled: true },
  css: [
    '@mdi/font/css/materialdesignicons.min.css',
    'vuetify/lib/styles/main.sass',
    '~/assets/styles/main.scss',
  ],
  build: {
    transpile: ['vuetify'],
  },
  routeRules: {
    '/api/**': {
      proxy: `http://localhost:${process.env.BACKEND_PORT}/api/**`,
    },
    '/api/oidc/**': {
      redirect: {
        to: `http://localhost:${process.env.BACKEND_PORT}/api/oidc/**`,
        statusCode: 302,
      },
    },
  },
  devServer: {
    port: parseInt(process.env.REVERSE_PROXY_PORT as string, 10),
  },
  vite: {
    optimizeDeps: { include: ['lodash'] },
    plugins: [injectConfigHeaders()],
  },
  telemetry: false,
  debug: true,
  pinia: {
    storesDirs: ['./app/stores/**'],
  },
  svgo: {
    defaultImport: 'component',
  },
});
