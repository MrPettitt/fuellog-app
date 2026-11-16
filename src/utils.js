// ─────────────────────────────────
// Helpers
// ─────────────────────────────────

// SARS AA rate for private vehicles. Editable per user in Settings.
export const DEFAULT_RATE = 4.28;

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
}

const pad2 = (n) => String(n).padStart(2, '0');

// Local calendar date as YYYY-MM-DD. toISOString() is UTC, which is the wrong day
// for the first two hours after midnight in South Africa (UTC+2).
export function today(now = new Date()) {
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

export function nowMonth(now = new Date()) {
  return today(now).slice(0, 7);
}

// Parse user-typed numbers: tolerates spaces ("85 420") and decimal commas ("42,5")
export function num(v) {
  const n = parseFloat(String(v ?? '').replace(/\s/g, '').replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

export function isValidDate(d) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d || '')) return false;
  const dt = new Date(d + 'T00:00:00Z');
  return !isNaN(dt) && dt.toISOString().slice(0, 10) === d;
}

// Most recent month containing entries (falls back to the current month)
export function defaultMonth(entries) {
  const cur = nowMonth();
  if (entries.some(e => e.date && e.date.startsWith(cur))) return cur;
  const ms = entries.map(e => e.date && e.date.slice(0, 7)).filter(Boolean).sort();
  return ms.length ? ms[ms.length - 1] : cur;
}

export function fmtDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

export function fmtR(n) {
  return 'R ' + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

export function monthLabel(ym) {
  if (!/^\d{4}-\d{2}$/.test(ym || '')) return '';
  const [y, m] = ym.split('-');
  return MONTHS[+m - 1] ? `${MONTHS[+m - 1]} ${y}` : '';
}

export function monthEntries(entries, month) {
  return entries.filter(e => e.date && e.date.startsWith(month));
}

export function calcStats(entries, month, ratePerKm) {
  const es     = monthEntries(entries, month);
  const trips  = es.filter(e => e.type === 'trip');
  const fuels  = es.filter(e => e.type === 'fuel');
  const km     = trips.reduce((s, e) => s + (+e.km || 0), 0);
  const fuel   = fuels.reduce((s, e) => s + (+e.totalCost || 0), 0);
  return {
    trips:      trips.length,
    fuels:      fuels.length,
    km,
    fuel,
    reimburse:  km * (+ratePerKm > 0 ? +ratePerKm : DEFAULT_RATE),
    count:      es.length,
  };
}

export function allMonths(entries) {
  const ms = new Set(entries.map(e => e.date && e.date.slice(0, 7)).filter(Boolean));
  ms.add(nowMonth());
  return [...ms].sort().reverse();
}

// ─────────────────────────────────
// Summary builder
// ─────────────────────────────────
export function buildSummaryText(entries, month, settings) {
  const es    = monthEntries(entries, month).sort((a, b) => a.date.localeCompare(b.date));
  const trips = es.filter(e => e.type === 'trip');
  const fuels = es.filter(e => e.type === 'fuel');
  const st    = calcStats(entries, month, settings.ratePerKm);
  const s     = settings;
  const W     = 56;
  const line  = '─'.repeat(W);
  const ln    = [];
  const mo    = monthLabel(month).toUpperCase();

  ln.push(`BUSINESS TRAVEL REIMBURSEMENT - ${mo}`);
  ln.push(line);
  ln.push(`Employee : ${s.employeeName || '[Employee Name]'}`);
  if (s.vehicleMake) ln.push(`Vehicle  : ${s.vehicleMake}${s.vehicleReg ? ' (' + s.vehicleReg + ')' : ''}`);
  if (s.employerName) ln.push(`Employer : ${s.employerName}`);
  ln.push('');

  ln.push('TRIP LOG');
  ln.push(line);
  if (trips.length === 0) {
    ln.push('  No trips recorded.');
  } else {
    trips.forEach((t, i) => {
      const num  = String(i + 1).padStart(2, '0');
      const km   = `${(+t.km).toFixed(1)} km`;
      ln.push(`  ${num}. ${fmtDate(t.date)}  ${t.purpose || 'Business Trip'}`);
      ln.push(`      ${km}${t.category ? '  ·  ' + t.category : ''}`);
      if (!t.manualKm && t.startOdo)
        ln.push(`      Odo: ${Number(t.startOdo).toLocaleString('en-ZA')} → ${Number(t.endOdo).toLocaleString('en-ZA')} km`);
      if (t.notes) ln.push(`      Note: ${t.notes}`);
    });
  }
  ln.push('');
  ln.push(line);
  ln.push(`  TOTAL BUSINESS KM    : ${st.km.toFixed(1)} km`);
  ln.push(`  REIMBURSEMENT RATE   : R ${(+settings.ratePerKm > 0 ? +settings.ratePerKm : DEFAULT_RATE).toFixed(2)}/km`);
  ln.push(`  TOTAL REIMBURSEMENT  : ${fmtR(st.reimburse)}`);

  if (fuels.length > 0) {
    ln.push('');
    ln.push('FUEL EXPENSES');
    ln.push(line);
    fuels.forEach(f => {
      ln.push(`  ${fmtDate(f.date)}  ${f.station || 'Fill-up'}`);
      ln.push(`      ${(+f.litres).toFixed(2)}L  @  R${(+f.pricePerLitre).toFixed(3)}/L  =  ${fmtR(f.totalCost)}`);
    });
    ln.push('');
    ln.push(`  TOTAL FUEL SPEND     : ${fmtR(st.fuel)}`);
  }

  ln.push('');
  ln.push(line);
  ln.push(`  Generated: ${new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'long', year: 'numeric' })}`);
  ln.push(`  Generated by FuelLog`);

  return ln.join('\n');
}

// ─────────────────────────────────
// CSV export
// ─────────────────────────────────
// Quote one CSV cell. Text starting with = + - @ (or a tab/CR) gets a leading
// apostrophe so a spreadsheet never evaluates user-typed text as a formula.
export function csvCell(v) {
  let t = v === null || v === undefined ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(t) && isNaN(Number(t))) t = "'" + t;
  return /[",\r\n]/.test(t) ? '"' + t.replace(/"/g, '""') + '"' : t;
}

export const CSV_HEADER = [
  'Date', 'Type', 'Description', 'Category', 'Distance (km)', 'Start odometer',
  'End odometer', 'Litres', 'Price per litre (R)', 'Total cost (R)', 'Notes',
];

export function buildCsv(entries, month) {
  const rows = [CSV_HEADER];
  monthEntries(entries, month)
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach(e => {
      if (e.type === 'trip') {
        rows.push([
          e.date, 'Trip', e.purpose, e.category, (+e.km || 0).toFixed(1),
          e.manualKm ? '' : e.startOdo, e.manualKm ? '' : e.endOdo, '', '', '', e.notes,
        ]);
      } else {
        rows.push([
          e.date, 'Fuel', e.station, '', '', '', '',
          (+e.litres || 0).toFixed(2), (+e.pricePerLitre || 0).toFixed(3),
          (+e.totalCost || 0).toFixed(2), '',
        ]);
      }
    });
  return rows.map(r => r.map(csvCell).join(',')).join('\r\n');
}

// ─────────────────────────────────
// Blank profile (first run) and demo profile
// ─────────────────────────────────
export const blankSettings = {
  employeeName:    '',
  employerName:    '',
  vehicleMake:     '',
  vehicleReg:      '',
  ratePerKm:       DEFAULT_RATE,
};

export const demoSettings = {
  employeeName:    'Thabo Nkosi',
  employerName:    'Apex Solutions (Pty) Ltd',
  vehicleMake:     'Toyota Corolla Quest',
  vehicleReg:      'GP 42 FL',
  ratePerKm:       DEFAULT_RATE,
};

// ─────────────────────────────────
// Demo data - 3 months of entries (loaded on request from Settings)
// ─────────────────────────────────
export const demoEntries = [
  // ── January 2026 ──
  {
    id: 'demo01', type: 'trip', date: '2026-01-06',
    purpose: 'Client meeting - Sandton City', category: 'Client Visit',
    km: 38.2, manualKm: false, startOdo: 85420, endOdo: 85458, notes: '',
  },
  {
    id: 'demo02', type: 'fuel', date: '2026-01-08',
    station: 'BP Marlboro Drive', litres: 45.23, pricePerLitre: 22.49, totalCost: 1017.42,
  },
  {
    id: 'demo03', type: 'trip', date: '2026-01-14',
    purpose: 'Site inspection - Midrand', category: 'Site Inspection',
    km: 22.5, manualKm: false, startOdo: 85520, endOdo: 85542, notes: 'Road construction delay',
  },
  {
    id: 'demo04', type: 'trip', date: '2026-01-19',
    purpose: 'Airport drop-off - O.R. Tambo', category: 'Airport / Transport',
    km: 31.8, manualKm: true, startOdo: null, endOdo: null, notes: '',
  },
  {
    id: 'demo05', type: 'trip', date: '2026-01-23',
    purpose: 'Training workshop - Rosebank', category: 'Training',
    km: 15.6, manualKm: false, startOdo: 85620, endOdo: 85636, notes: '',
  },
  {
    id: 'demo06', type: 'fuel', date: '2026-01-27',
    station: 'Engen Rivonia', litres: 42.10, pricePerLitre: 22.49, totalCost: 947.44,
  },

  // ── February 2026 ──
  {
    id: 'demo07', type: 'trip', date: '2026-02-03',
    purpose: 'Head office meeting - Fourways', category: 'Meeting',
    km: 28.4, manualKm: false, startOdo: 85750, endOdo: 85778, notes: '',
  },
  {
    id: 'demo08', type: 'fuel', date: '2026-02-05',
    station: 'Shell Witkoppen', litres: 50.00, pricePerLitre: 22.95, totalCost: 1147.50,
  },
  {
    id: 'demo09', type: 'trip', date: '2026-02-10',
    purpose: 'Delivery to Pretoria CBD', category: 'Delivery / Collection',
    km: 62.3, manualKm: false, startOdo: 85900, endOdo: 85962, notes: '',
  },
  {
    id: 'demo10', type: 'trip', date: '2026-02-17',
    purpose: 'Supplier visit - Germiston', category: 'Client Visit',
    km: 44.1, manualKm: false, startOdo: 86050, endOdo: 86094, notes: 'Invoice collected',
  },
  {
    id: 'demo11', type: 'trip', date: '2026-02-24',
    purpose: 'Staff function - Centurion', category: 'Other Business',
    km: 55.9, manualKm: true, startOdo: null, endOdo: null, notes: '',
  },
  {
    id: 'demo12', type: 'fuel', date: '2026-02-24',
    station: 'Total Centurion', litres: 38.75, pricePerLitre: 22.95, totalCost: 889.31,
  },

  // ── March 2026 ──
  {
    id: 'demo13', type: 'trip', date: '2026-03-04',
    purpose: 'Board meeting - Melrose Arch', category: 'Meeting',
    km: 19.2, manualKm: false, startOdo: 86280, endOdo: 86299, notes: '',
  },
  {
    id: 'demo14', type: 'fuel', date: '2026-03-06',
    station: 'Engen Sandton', litres: 44.60, pricePerLitre: 23.10, totalCost: 1030.26,
  },
  {
    id: 'demo15', type: 'trip', date: '2026-03-11',
    purpose: 'Client demo - Bryanston', category: 'Client Visit',
    km: 11.8, manualKm: false, startOdo: 86360, endOdo: 86372, notes: 'Follow-up scheduled',
  },
  {
    id: 'demo16', type: 'trip', date: '2026-03-14',
    purpose: 'Site visit - Soweto', category: 'Site Inspection',
    km: 34.7, manualKm: false, startOdo: 86420, endOdo: 86455, notes: '',
  },
  {
    id: 'demo17', type: 'trip', date: '2026-03-18',
    purpose: 'Courier pickup - OR Tambo Cargo', category: 'Delivery / Collection',
    km: 28.9, manualKm: true, startOdo: null, endOdo: null, notes: '',
  },
];
