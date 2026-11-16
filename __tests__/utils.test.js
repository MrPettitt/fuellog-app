import {
  num, isValidDate, today, nowMonth, defaultMonth, fmtDate, fmtR, monthLabel,
  calcStats, allMonths, buildSummaryText, csvCell, buildCsv, CSV_HEADER,
  demoEntries, demoSettings, blankSettings, DEFAULT_RATE,
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

describe('local dates (tests run in Africa/Johannesburg, UTC+2)', () => {
  test('time zone is pinned by jest.global-setup.js', () => {
    expect(new Date('2026-03-31T22:30:00Z').getHours()).toBe(0);
  });
  test('00:30 local on the 1st is still the 1st, not the previous day or month', () => {
    const now = new Date('2026-03-31T22:30:00Z'); // 2026-04-01 00:30 in Johannesburg
    expect(today(now)).toBe('2026-04-01');
    expect(nowMonth(now)).toBe('2026-04');
  });
  test('late evening local time stays on the same day', () => {
    const now = new Date('2026-04-01T21:30:00Z'); // 23:30 local
    expect(today(now)).toBe('2026-04-01');
  });
  test('defaults to the current time', () => {
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(nowMonth()).toBe(today().slice(0, 7));
  });
});

describe('formatters', () => {
  test('fmtDate', () => expect(fmtDate('2026-03-18')).toBe('18/03/2026'));
  test('fmtR', () => {
    expect(fmtR(1030.256)).toBe('R 1,030.26');
    expect(fmtR(null)).toBe('R 0.00');
    expect(fmtR(DEFAULT_RATE)).toBe('R 4.28');
  });
  test('monthLabel', () => {
    expect(monthLabel('2026-03')).toBe('March 2026');
    expect(monthLabel('2026-13')).toBe('');
    expect(monthLabel('garbage')).toBe('');
    expect(monthLabel(undefined)).toBe('');
  });
});

describe('calcStats', () => {
  test('March demo data', () => {
    const st = calcStats(demoEntries, '2026-03', 4.28);
    expect(st.trips).toBe(4);
    expect(st.fuels).toBe(1);
    expect(st.km).toBeCloseTo(94.6, 5);
    expect(st.fuel).toBeCloseTo(1030.26, 2);
    expect(st.reimburse).toBeCloseTo(94.6 * 4.28, 5);
  });
  test('empty month', () => {
    expect(calcStats(demoEntries, '2020-01', 4.28).count).toBe(0);
  });
  test('missing or invalid rate falls back to the default rate', () => {
    expect(calcStats(demoEntries, '2026-03', undefined).reimburse).toBeCloseTo(94.6 * DEFAULT_RATE, 5);
    expect(calcStats(demoEntries, '2026-03', 'abc').reimburse).toBeCloseTo(94.6 * DEFAULT_RATE, 5);
    expect(calcStats(demoEntries, '2026-03', 5).reimburse).toBeCloseTo(94.6 * 5, 5);
  });
});

describe('months', () => {
  test('defaultMonth falls back to latest month with data', () => {
    expect(defaultMonth(demoEntries)).toBe('2026-03');
    expect(defaultMonth([])).toMatch(/^\d{4}-\d{2}$/);
  });
  test('allMonths is sorted newest first and includes current month', () => {
    const ms = allMonths(demoEntries);
    expect([...ms].sort().reverse()).toEqual(ms);
    expect(ms).toContain(nowMonth());
  });
});

describe('buildSummaryText', () => {
  test('includes profile, totals and fuel section', () => {
    const t = buildSummaryText(demoEntries, '2026-02', demoSettings);
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
  test('missing rate never prints NaN', () => {
    const t = buildSummaryText(demoEntries, '2026-03', { ...blankSettings, ratePerKm: undefined });
    expect(t).not.toContain('NaN');
    expect(t).toContain(`R ${DEFAULT_RATE.toFixed(2)}/km`);
  });
});

describe('CSV export', () => {
  test('csvCell quotes commas, quotes and newlines', () => {
    expect(csvCell('plain')).toBe('plain');
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('two\nlines')).toBe('"two\nlines"');
    expect(csvCell(null)).toBe('');
    expect(csvCell(undefined)).toBe('');
  });
  test('csvCell neutralises formula-like text but leaves numbers alone', () => {
    expect(csvCell('=SUM(A1)')).toBe("'=SUM(A1)");
    expect(csvCell('+27 11 555')).toBe("'+27 11 555");
    expect(csvCell('@user')).toBe("'@user");
    expect(csvCell('-12.5')).toBe('-12.5');
    expect(csvCell(-3)).toBe('-3');
  });
  test('buildCsv has a header row and one row per entry in date order', () => {
    const csv = buildCsv(demoEntries, '2026-02');
    const lines = csv.split('\r\n');
    expect(lines[0]).toBe(CSV_HEADER.join(','));
    expect(lines.length).toBe(1 + 6);
    expect(lines[1]).toMatch(/^2026-02-03,Trip,Head office meeting - Fourways,Meeting,28\.4,85750,85778,,,,$/);
    expect(lines[2]).toMatch(/^2026-02-05,Fuel,Shell Witkoppen,,,,,50\.00,22\.950,1147\.50,$/);
    expect(lines[lines.length - 1]).toMatch(/^2026-02-24,Fuel,Total Centurion/);
  });
  test('manual-distance trips leave the odometer columns blank', () => {
    const csv = buildCsv(demoEntries, '2026-01');
    const airport = csv.split('\r\n').find(l => l.includes('Airport drop-off'));
    expect(airport).toBe('2026-01-19,Trip,Airport drop-off - O.R. Tambo,Airport / Transport,31.8,,,,,,');
  });
  test('an empty month is just the header', () => {
    expect(buildCsv([], '2026-01')).toBe(CSV_HEADER.join(','));
  });
});
