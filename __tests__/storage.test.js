import { loadData, saveData, isEntry, STORAGE_KEY, BACKUP_KEY, DATA_VERSION } from '../src/storage';

function fakeStore(initial = {}, { failing = false } = {}) {
  const data = { ...initial };
  return {
    data,
    async getItem(k) { if (failing) throw new Error('boom'); return k in data ? data[k] : null; },
    async setItem(k, v) { if (failing) throw new Error('boom'); data[k] = v; },
  };
}

const entries = [
  { id: 'a1', type: 'trip', date: '2026-03-04', km: 19.2 },
  { id: 'b2', type: 'fuel', date: '2026-03-06', litres: 44.6, totalCost: 1030.26 },
];
const settings = { employeeName: 'Thabo', ratePerKm: 4.28 };

describe('loadData', () => {
  test('first run: nothing saved', async () => {
    const d = await loadData(fakeStore());
    expect(d.status).toBe('empty');
    expect(d.entries).toEqual([]);
  });

  test('reads a v2 payload', async () => {
    const store = fakeStore({ [STORAGE_KEY]: JSON.stringify({ version: 2, entries, settings }) });
    const d = await loadData(store);
    expect(d.status).toBe('ok');
    expect(d.entries).toEqual(entries);
    expect(d.settings).toEqual(settings);
  });

  test('reads a v1 payload (no version field) so existing installs keep their data', async () => {
    const store = fakeStore({ [STORAGE_KEY]: JSON.stringify({ entries, settings }) });
    const d = await loadData(store);
    expect(d.status).toBe('ok');
    expect(d.entries).toEqual(entries);
  });

  test('drops malformed entries but keeps the rest', async () => {
    const store = fakeStore({ [STORAGE_KEY]: JSON.stringify({ entries: [entries[0], null, { id: 1 }, 'x', entries[1]], settings }) });
    const d = await loadData(store);
    expect(d.status).toBe('ok');
    expect(d.entries).toEqual(entries);
  });

  test('corrupt JSON is backed up and reported, not overwritten', async () => {
    const store = fakeStore({ [STORAGE_KEY]: '{not json' });
    const d = await loadData(store);
    expect(d.status).toBe('corrupt');
    expect(d.entries).toEqual([]);
    expect(store.data[BACKUP_KEY]).toBe('{not json');
    expect(store.data[STORAGE_KEY]).toBe('{not json');
  });

  test('wrong shape is treated as corrupt', async () => {
    const store = fakeStore({ [STORAGE_KEY]: JSON.stringify({ entries: 'nope' }) });
    expect((await loadData(store)).status).toBe('corrupt');
  });

  test('storage failure is reported as unavailable', async () => {
    const d = await loadData(fakeStore({}, { failing: true }));
    expect(d.status).toBe('unavailable');
  });
});

describe('saveData', () => {
  test('writes a versioned payload that loadData reads back', async () => {
    const store = fakeStore();
    expect(await saveData(entries, settings, store)).toBe(true);
    expect(JSON.parse(store.data[STORAGE_KEY]).version).toBe(DATA_VERSION);
    const d = await loadData(store);
    expect(d.status).toBe('ok');
    expect(d.entries).toEqual(entries);
    expect(d.settings).toEqual(settings);
  });

  test('returns false instead of throwing when storage fails', async () => {
    expect(await saveData(entries, settings, fakeStore({}, { failing: true }))).toBe(false);
  });
});

describe('isEntry', () => {
  test('accepts trips and fuel entries only', () => {
    expect(isEntry(entries[0])).toBe(true);
    expect(isEntry(entries[1])).toBe(true);
    expect(isEntry({ id: 'x', type: 'other', date: '2026-01-01' })).toBe(false);
    expect(isEntry({ type: 'trip', date: '2026-01-01' })).toBe(false);
    expect(isEntry(null)).toBe(false);
  });
});
