import EmbeddedContainer from '~/components/EmbeddedContainer.vue';

export default defineNuxtPlugin((nuxt) => {
  nuxt.vueApp.component('TailorEmbeddedContainer', EmbeddedContainer);
});
