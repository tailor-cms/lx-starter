export type ServerRuntime = 'authoring' | 'delivery';

export interface ContentElementHooks {
  afterLoaded?: (
    element: any,
    services: any,
    runtime: ServerRuntime,
  ) => Promise<any>;
}
