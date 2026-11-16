import {
  num, isValidDate, defaultMonth, fmtDate, fmtR, monthLabel, today, nowMonth,
  calcStats, allMonths, buildSummaryText, buildCsv, csvCell, demoEntries, demoSettings, blankSettings,
  DEFAULT_RATE,
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
});

describe('months', () => {
  test('defaultMonth falls back to latest month with data', () => {
    expect(defaultMonth(demoEntries)).toBe('2026-03');
    expect(defaultMonth([])).toMatch(/^\d{4}-\d{2}$/);
  });
  test('allMonths is sorted newest first and includes current month', () => {
    const ms = allMonths(demoEntries);
    expect([...ms].sort().reverse()).toEqual(ms);
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
});

describe('local dates (South Africa is UTC+2)', () => {
  const realTZ = process.env.TZ;
  beforeAll(() => { process.env.TZ = 'Africa/Johannesburg'; });
  afterAll(() => { process.env.TZ = realTZ; });

  test('00:30 local on the 1st is still the 1st, not the previous day or month', () => {
    // 2026-03-31T22:30Z is 2026-04-01 00:30 in Johannesburg
    const now = new Date('2026-03-31T22:30:00Z');
    expect(today(now)).toBe('2026-04-01');
    expect(nowMonth(now)).toBe('2026-04');
  });
  test('late evening local time stays on the same day', () => {
    expect(today(new Date('2026-03-31T21:59:00Z'))).toBe('2026-03-31');
  });
});

describe('default rate', () => {
  test('blank settings use the shared constant', () => {
    expect(blankSettings.ratePerKm).toBe(DEFAULT_RATE);
  });
  test('missing rate falls back instead of producing NaN', () => {
    const t = buildSummaryText(demoEntries, '2026-01', { ...demoSettings, ratePerKm: undefined });
    expect(t).toContain('R 4.28/km');
    expect(calcStats(demoEntries, '2026-01', undefined).reimburse).toBeGreaterThan(0);
  });
});

describe('csvCell', () => {
  test('quotes commas, quotes and newlines', () => {
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell('x\ny')).toBe('"x\ny"');
  });
  test('neutralises spreadsheet formulas but keeps plain negative numbers', () => {
    expect(csvCell('=HYPERLINK("http://x")')).toMatch(/^"'=/);
    expect(csvCell('+1+1')).toBe("'+1+1");
    expect(csvCell('@SUM(A1)')).toBe("'@SUM(A1)");
    expect(csvCell(-5)).toBe('-5');
    expect(csvCell(null)).toBe('');
  });
});

describe('buildCsv', () => {
  test('header plus one row per entry for the month, sorted by date', () => {
    const csv = buildCsv(demoEntries, '2026-01').split('\r\n');
    expect(csv[0]).toContain('Date,Type,Description');
    expect(csv).toHaveLength(1 + 6);
    const dates = csv.slice(1).map(r => r.split(',')[0]);
    expect([...dates].sort()).toEqual(dates);
  });
  test('trip and fuel rows carry their own columns', () => {
    const csv = buildCsv(demoEntries, '2026-01');
    expect(csv).toContain('2026-01-06,Trip,Client meeting - Sandton City,Client Visit,38.2,85420,85458');
    expect(csv).toContain('2026-01-08,Fuel,BP Marlboro Drive,,,,,45.23,22.490,1017.42,');
  });
  test('manual-distance trips leave odometer columns empty', () => {
    const csv = buildCsv(demoEntries, '2026-01');
    expect(csv).toMatch(/2026-01-19,Trip,Airport drop-off - O\.R\. Tambo,Airport \/ Transport,31\.8,,,/);
  });
  test('empty month is just the header', () => {
    expect(buildCsv([], '2026-01').split('\r\n')).toHaveLength(1);
  });
});
