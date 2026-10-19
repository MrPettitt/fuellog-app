import {
  num, isValidDate, defaultMonth, fmtDate, fmtR, monthLabel,
  calcStats, allMonths, buildSummaryText, dummyEntries, defaultSettings, blankSettings,
} from '../src/utils';

describe('num', () => {
  test('parses plain, spaced and comma-decimal input', () => {
    expect(num('42.5')).toBe(42.5);
    expect(num('85 420')).toBe(85420);
    expect(num('42,5')).toBe(42.5);
  });
  test('returns 0 for junk', () => {
    expect(num('abc')).toBe(0);
    expect(num('')).toBe(0);
    expect(num(undefined)).toBe(0);
  });
});

describe('isValidDate', () => {
  test('accepts real dates', () => expect(isValidDate('2026-03-18')).toBe(true));
  test('rejects bad formats and impossible dates', () => {
    expect(isValidDate('18/03/2026')).toBe(false);
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isValidDate('')).toBe(false);
    expect(isValidDate(null)).toBe(false);
  });
});

describe('formatters', () => {
  test('fmtDate', () => expect(fmtDate('2026-03-18')).toBe('18/03/2026'));
  test('fmtR', () => {
    expect(fmtR(1030.256)).toBe('R 1,030.26');
    expect(fmtR(null)).toBe('R 0.00');
  });
  test('monthLabel', () => expect(monthLabel('2026-03')).toBe('March 2026'));
});

describe('calcStats', () => {
  test('March demo data', () => {
    const st = calcStats(dummyEntries, '2026-03', 4.28);
    expect(st.trips).toBe(4);
    expect(st.fuels).toBe(1);
    expect(st.km).toBeCloseTo(94.6, 5);
    expect(st.fuel).toBeCloseTo(1030.26, 2);
    expect(st.reimburse).toBeCloseTo(94.6 * 4.28, 5);
  });
  test('empty month', () => {
    expect(calcStats(dummyEntries, '2020-01', 4.28).count).toBe(0);
  });
});

describe('months', () => {
  test('defaultMonth falls back to latest month with data', () => {
    expect(defaultMonth(dummyEntries)).toBe('2026-03');
    expect(defaultMonth([])).toMatch(/^\d{4}-\d{2}$/);
  });
  test('allMonths is sorted newest first and includes current month', () => {
    const ms = allMonths(dummyEntries);
    expect([...ms].sort().reverse()).toEqual(ms);
  });
});

describe('buildSummaryText', () => {
  test('includes profile, totals and fuel section', () => {
    const t = buildSummaryText(dummyEntries, '2026-02', defaultSettings);
    expect(t).toContain('FEBRUARY 2026');
    expect(t).toContain('Thabo Nkosi');
    expect(t).toContain('TOTAL BUSINESS KM');
    expect(t).toContain('FUEL EXPENSES');
  });
  test('blank profile uses placeholder and handles no trips', () => {
    const t = buildSummaryText([], '2026-01', blankSettings);
    expect(t).toContain('[Employee Name]');
    expect(t).toContain('No trips recorded.');
  });
});
