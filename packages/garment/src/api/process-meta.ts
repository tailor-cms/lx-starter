import type { GarmentConfig } from '../garment/interfaces';
import { GarmentEnv } from '../garment/enums';

// seconds, 12 hrs
const DEFAULT_ACCESS_TOKEN_INTERVAL = 12 * 60 * 60;
const INTERNAL_STORAGE_PROTOCOL = 'storage://';

interface MetaInputs { [key: string]: any }

function isStorageAsset(url: string) {
  return url.startsWith(INTERNAL_STORAGE_PROTOCOL);
}

function getAssetPath(url: string) {
  return url.substring(INTERNAL_STORAGE_PROTOCOL.length);
}

/**
 * A file input stores the asset under `key` and leaves the signed url to be
 * derived on read, since that url expires:
 *
 *   { key: 'repository/107/assets/c011aa4a__hqdefault.jpg',
 *     name: 'World Cup Highlights Thumbnail' }
 *
 * Older values also carry the same path as a `storage://` uri in `url`,
 * which is the only form this used to read.
 *
 * A key is only honoured when it sits under a storage root we manage;
 * `key` is a plain string, and any meta value is free to use that name for
 * something that is not a file.
 */
function getStorageKey(value: any, roots: string[]): string | undefined {
  const url = value?.url;
  if (typeof url === 'string' && isStorageAsset(url)) return getAssetPath(url);
  const key = value?.key;
  if (typeof key !== 'string') return undefined;
  return roots.some((root) => key.startsWith(`${root}/`)) ? key : undefined;
}

// Storage locations garment owns
function storageRoots(config: GarmentConfig): string[] {
  return [config[GarmentEnv.Source], config[GarmentEnv.Snapshot]]
    .filter(Boolean);
}

export default function (api: any, config: GarmentConfig) {
  const roots = storageRoots(config);

  // Signs all internal urls;
  // adds token param which enables access for a limited time.
  return function processMeta(
    inputs: MetaInputs,
    interval = DEFAULT_ACCESS_TOKEN_INTERVAL,
  ) {
    if (!inputs)
      return Promise.resolve([]);
    const meta = Object.entries(inputs);
    return Promise.all(meta.map(async ([_, value]) => {
      const key = getStorageKey(value, roots);
      if (!key) return;
      value.publicUrl = await api.getSignedUrl(key, interval);
    }));
  };
}
