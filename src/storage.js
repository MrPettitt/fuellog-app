// Persistence layer. Kept free of React so it can be unit tested with a fake store.
//
// Saved under the same key as v1 so existing installs keep their data. The payload
// gained a `version` field in v2; v1 payloads (no version field) are still read.

export const STORAGE_KEY  = 'fuellog_v1';
export const BACKUP_KEY   = 'fuellog_v1_backup';
export const DATA_VERSION = 2;

function defaultStore() {
  // Required lazily so tests can inject a fake store without loading the native module.
  return require('@react-native-async-storage/async-storage').default;
}

export function isEntry(e) {
  return !!e && typeof e === 'object' && typeof e.id === 'string'
    && (e.type === 'trip' || e.type === 'fuel') && typeof e.date === 'string';
}

/**
 * Read saved data.
 *   status 'empty'        nothing saved yet (first run)
 *   status 'ok'           data loaded
 *   status 'corrupt'      something was saved but cannot be read; the raw text is copied
 *                         to BACKUP_KEY so it is not lost when the app saves again
 *   status 'unavailable'  storage itself failed; callers must not write anything
 */
export async function loadData(store = defaultStore()) {
  let raw;
  try {
    raw = await store.getItem(STORAGE_KEY);
  } catch (_) {
    return { status: 'unavailable', entries: [], settings: {} };
  }
  if (raw === null || raw === undefined) {
    return { status: 'empty', entries: [], settings: {} };
  }
  try {
    const d = JSON.parse(raw);
    if (!d || typeof d !== 'object' || !Array.isArray(d.entries)) throw new Error('bad shape');
    return {
      status:   'ok',
      entries:  d.entries.filter(isEntry),
      settings: d.settings && typeof d.settings === 'object' ? d.settings : {},
    };
  } catch (_) {
    try { await store.setItem(BACKUP_KEY, raw); } catch (__) { /* best effort */ }
    return { status: 'corrupt', entries: [], settings: {} };
  }
}

/** Write data. Resolves true on success, false on failure (never throws). */
export async function saveData(entries, settings, store = defaultStore()) {
  try {
    await store.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: DATA_VERSION, entries, settings }),
    );
    return true;
  } catch (_) {
    return false;
  }
}
