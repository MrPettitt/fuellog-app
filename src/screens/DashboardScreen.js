import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import { theme, card } from '../theme';
import { calcStats, monthLabel, allMonths, defaultMonth, fmtDate, fmtR } from '../utils';
import { MonthHeader, MonthModal } from '../components/MonthPicker';
import EntryBadge from '../components/EntryBadge';

export default function DashboardScreen({ navigation }) {
  const { entries, settings } = useApp();
  const [picked, setPicked] = useState(null);   // null = follow latest month with data
  const month = picked ?? defaultMonth(entries);
  const [monthModal, setMonthModal] = useState(false);

  const st     = calcStats(entries, month, settings.ratePerKm);
  const months = allMonths(entries);
  const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  const rate   = +settings.ratePerKm > 0 ? +settings.ratePerKm : st.km ? st.reimburse / st.km : 0;

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <MonthHeader month={month} subtitle="Business travel overview" onPress={() => setMonthModal(true)} />

        {/* Hero: the number the employee actually cares about */}
        <View style={s.hero}>
          <View style={{ flex: 1 }}>
            <Text style={s.heroLabel}>Reimbursement due</Text>
            <Text style={s.heroValue}>{fmtR(st.reimburse)}</Text>
            <Text style={s.heroSub}>
              {st.km.toFixed(1)} km  ·  {st.trips} trip{st.trips === 1 ? '' : 's'}  ·  {fmtR(rate)}/km
            </Text>
          </View>
          <View style={s.heroIcon}>
            <MaterialCommunityIcons name="speedometer" size={30} color={theme.amber} />
          </View>
        </View>

        {/* Stat tiles */}
        <View style={s.grid}>
          <StatTile icon="map-marker-distance" label="Business km" value={st.km.toFixed(0)} sub="kilometres" />
          <StatTile icon="car"                 label="Trips"       value={String(st.trips)} sub="this month" />
          <StatTile icon="gas-station"         label="Fuel spend"  value={fmtR(st.fuel)} sub={`${st.fuels} fill-up${st.fuels === 1 ? '' : 's'}`} small />
        </View>

        {/* Recent entries */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Recent entries</Text>
            <TouchableOpacity style={s.addBtn} onPress={() => navigation.navigate('Add Entry')}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={s.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>

          {recent.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIcon}>
                <MaterialCommunityIcons name="car-outline" size={34} color={theme.amber} />
              </View>
              <Text style={s.emptyTitle}>No entries yet</Text>
              <Text style={s.emptyText}>Log your first business trip or fuel fill-up to see your month here.</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Add Entry')}>
                <Text style={s.emptyBtnText}>Log first entry</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                <Text style={s.emptyLink}>or load demo data in Settings</Text>
              </TouchableOpacity>
            </View>
          ) : (
            recent.map((e, i) => <EntryRow key={e.id} entry={e} last={i === recent.length - 1} />)
          )}

          {entries.length > recent.length && (
            <TouchableOpacity style={s.viewAll} onPress={() => navigation.navigate('Log')}>
              <Text style={s.viewAllText}>View full log</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.amber} />
            </TouchableOpacity>
          )}
        </View>

      </ScrollView>

      <MonthModal
        visible={monthModal} months={months} month={month}
        onSelect={m => { setPicked(m); setMonthModal(false); }}
        onClose={() => setMonthModal(false)}
      />
    </SafeAreaView>
  );
}

function StatTile({ icon, label, value, sub, small }) {
  return (
    <View style={s.tile}>
      <MaterialCommunityIcons name={icon} size={18} color={theme.amber} />
      <Text style={[s.tileValue, small && s.tileValueSm]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={s.tileLabel}>{label}</Text>
      <Text style={s.tileSub}>{sub}</Text>
    </View>
  );
}

function EntryRow({ entry: e, last }) {
  const isTrip = e.type === 'trip';
  return (
    <View style={[s.row, last && { borderBottomWidth: 0 }]}>
      <EntryBadge type={e.type} />
      <View style={s.rowInfo}>
        <Text style={s.rowTitle} numberOfLines={1}>
          {isTrip ? (e.purpose || 'Business trip') : (e.station || 'Fill-up')}
        </Text>
        <Text style={s.rowSub}>{fmtDate(e.date)}{isTrip && e.category ? `  ·  ${e.category}` : ''}</Text>
      </View>
      <Text style={s.rowValue}>{isTrip ? `${(+e.km).toFixed(1)} km` : fmtR(e.totalCost)}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: theme.bg },
  scroll:  { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },

  hero: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: theme.navy, borderRadius: theme.radius, padding: 20, marginBottom: 12,
    ...theme.shadowStrong,
  },
  heroLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: theme.amberLight },
  heroValue: { fontSize: 36, fontWeight: '800', color: theme.onNavy, marginTop: 4, letterSpacing: -0.5 },
  heroSub:   { fontSize: 13, color: theme.onNavyMuted, marginTop: 6 },
  heroIcon:  { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.navyLight, alignItems: 'center', justifyContent: 'center' },

  grid: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  tile: { flex: 1, ...card, padding: 14 },
  tileValue:   { fontSize: 22, fontWeight: '800', color: theme.navy, marginTop: 8 },
  tileValueSm: { fontSize: 16 },
  tileLabel:   { fontSize: 12, fontWeight: '700', color: theme.text, marginTop: 2 },
  tileSub:     { fontSize: 11, color: theme.muted, marginTop: 1 },

  card:       { ...card },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  cardTitle:  { fontSize: 16, fontWeight: '700', color: theme.navy },
  addBtn:     { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.amber, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  empty:        { alignItems: 'center', padding: 32 },
  emptyIcon:    { width: 68, height: 68, borderRadius: 34, backgroundColor: theme.amberSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle:   { fontSize: 17, fontWeight: '700', color: theme.navy, marginBottom: 4 },
  emptyText:    { fontSize: 13, color: theme.muted, textAlign: 'center', marginBottom: 16, lineHeight: 19 },
  emptyBtn:     { backgroundColor: theme.navy, paddingHorizontal: 24, paddingVertical: 11, borderRadius: theme.radiusSm },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  emptyLink:    { color: theme.amber, fontWeight: '600', fontSize: 13, marginTop: 12 },

  row:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border, gap: 12 },
  rowInfo:  { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: theme.text },
  rowSub:   { fontSize: 12, color: theme.muted, marginTop: 2 },
  rowValue: { fontSize: 14, fontWeight: '700', color: theme.navy },

  viewAll:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.border },
  viewAllText: { color: theme.amber, fontWeight: '700', fontSize: 13 },
});
