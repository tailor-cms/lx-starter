import { runStatsigAutoCapture } from '@statsig/web-analytics';
import { runStatsigSessionReplay } from '@statsig/session-replay';
import { StatsigClient } from '@statsig/js-client';

let client: StatsigClient | null = null;

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.provide('statsigInit', async (sdkKey: string, userID: string) => {
    if (client) return client;
    if (!sdkKey || !userID) return null;
    client = new StatsigClient(sdkKey, { userID });
    runStatsigSessionReplay(client);
    runStatsigAutoCapture(client);
    await client.initializeAsync();
    return client;
  });
  nuxtApp.provide('statsig', client);
});
