import { loadData, saveData, STORAGE_KEY, BACKUP_KEY, DATA_VERSION } from '../src/storage';

// In-memory stand-in for AsyncStorage
function fakeStore(initial = {}, failOn = {}) {
  const data = { ...initial };
  return {
    data,
    getItem: async (k) => { if (failOn.get) throw new Error('read failed'); return k in data ? data[k] : null; },
    setItem: async (k, v) => { if (failOn.set) throw new Error('write failed'); data[k] = v; },
  };
}

const trip  = { id: 'a1', type: 'trip', date: '2026-03-01', km: 10 };
const fuel  = { id: 'b2', type: 'fuel', date: '2026-03-02', totalCost: 500 };

describe('loadData', () => {
  test('first run is reported as empty and writes nothing', async () => {
    const store = fakeStore();
    const res = await loadData(store);
    expect(res.status).toBe('empty');
    expect(res.entries).toEqual([]);
    expect(Object.keys(store.data)).toHaveLength(0);
  });

  test('reads a v1 payload (no version field)', async () => {
    const store = fakeStore({ [STORAGE_KEY]: JSON.stringify({ entries: [trip], settings: { employeeName: 'A' } }) });
    const res = await loadData(store);
    expect(res.status).toBe('ok');
    expect(res.entries).toEqual([trip]);
    expect(res.settings.employeeName).toBe('A');
  });

  test('drops malformed entries but keeps valid ones', async () => {
    const store = fakeStore({ [STORAGE_KEY]: JSON.stringify({ entries: [trip, null, { id: 3 }, { id: 'x', type: 'bad', date: '2026-01-01' }, fuel] }) });
    const res = await loadData(store);
    expect(res.entries).toEqual([trip, fuel]);
  });

  test('corrupt JSON is backed up, not overwritten', async () => {
    const store = fakeStore({ [STORAGE_KEY]: '{not json' });
    const res = await loadData(store);
    expect(res.status).toBe('corrupt');
    expect(res.entries).toEqual([]);
    expect(store.data[BACKUP_KEY]).toBe('{not json');
    expect(store.data[STORAGE_KEY]).toBe('{not json');
  });

  test('wrong shape counts as corrupt', async () => {
    const store = fakeStore({ [STORAGE_KEY]: JSON.stringify({ entries: 'nope' }) });
    expect((await loadData(store)).status).toBe('corrupt');
  });

  test('a failing read is "unavailable" and leaves stored data alone', async () => {
    const store = fakeStore({ [STORAGE_KEY]: JSON.stringify({ entries: [trip] }) }, { get: true });
    const before = store.data[STORAGE_KEY];
    const res = await loadData(store);
    expect(res.status).toBe('unavailable');
    expect(store.data[STORAGE_KEY]).toBe(before);
  });
});

describe('saveData', () => {
  test('round-trips through loadData with a version', async () => {
    const store = fakeStore();
    expect(await saveData([trip, fuel], { employeeName: 'B' }, store)).toBe(true);
    expect(JSON.parse(store.data[STORAGE_KEY]).version).toBe(DATA_VERSION);
    const res = await loadData(store);
    expect(res.entries).toEqual([trip, fuel]);
    expect(res.settings.employeeName).toBe('B');
  });

  test('reports failure instead of throwing', async () => {
    expect(await saveData([trip], {}, fakeStore({}, { set: true }))).toBe(false);
  });
});
