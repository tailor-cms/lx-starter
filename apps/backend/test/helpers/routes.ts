export const paths = {
  users: {
    base: '/api/users',
  },
  integrations: {
    base: '/api/integrations',
  },
  oauth: {
    token: '/api/oauth/token',
  },
  content: {
    webhookPublish: '/api/content/webhook/publish',
  },
} as const;
