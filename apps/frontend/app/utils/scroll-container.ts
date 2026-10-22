// Vuetify's VMain with `scrollable` prop creates this inner element
const SCROLL_CONTAINER_SELECTOR = '.v-main__scroller';

export function getScrollContainer(): HTMLElement | null {
  return document.querySelector<HTMLElement>(SCROLL_CONTAINER_SELECTOR);
}

export function getScrollDepth(): number {
  const container = getScrollContainer();
  if (!container) return 0;
  const { scrollTop, scrollHeight, clientHeight } = container;
  const maxScroll = scrollHeight - clientHeight;
  if (maxScroll <= 0) return 0;
  return Math.round((scrollTop / maxScroll) * 100);
}
