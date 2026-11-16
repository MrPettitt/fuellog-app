import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../AppContext';
import { theme } from '../theme';
import { calcStats, monthLabel, allMonths, defaultMonth, fmtDate, fmtR } from '../utils';

export default function DashboardScreen({ navigation }) {
  const { entries, settings } = useApp();
  const [picked,     setPicked]     = useState(null);   // null = follow latest month with data
  const month = picked ?? defaultMonth(entries);
  const [monthModal,  setMonthModal]  = useState(false);

  const st     = calcStats(entries, month, settings.ratePerKm);
  const months = allMonths(entries);
  const recent = [...entries]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 10);

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Month row */}
        <View style={s.monthRow}>
          <View>
            <Text style={s.monthMain}>{monthLabel(month)}</Text>
            <Text style={s.monthSub}>Business travel overview</Text>
          </View>
          <TouchableOpacity style={s.monthChip} onPress={() => setMonthModal(true)}>
            <Text style={s.monthChipText}>Change month ▾</Text>
          </TouchableOpacity>
        </View>

        {/* Stat cards */}
        <View style={s.grid}>
          <StatCard label="Business KM"    value={st.km.toFixed(0)}   sub="kilometres"           accent={theme.amber} />
          <StatCard label="Trips"          value={String(st.trips)}   sub="business trips"       accent={theme.amber} />
          <StatCard label="Fuel Spend"     value={fmtR(st.fuel)}      sub={`${st.fuels} fill-up${st.fuels === 1 ? '' : 's'}`} accent={theme.amber} compact />
          <StatCard label="Reimbursement"  value={fmtR(st.reimburse)} sub={`@ R${settings.ratePerKm}/km`} accent={theme.success} valueColor={theme.success} compact />
        </View>

        {/* Recent entries */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Recent Entries</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Add Entry')}>
              <Text style={s.cardAction}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {recent.length === 0 ? (
            <View style={s.empty}>
              <Text style={s.emptyIcon}>🚗</Text>
              <Text style={s.emptyTitle}>No entries yet</Text>
              <Text style={s.emptyText}>Start logging your business trips and fuel fill-ups</Text>
              <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Add Entry')}>
                <Text style={s.emptyBtnText}>Log First Entry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            recent.map((e, i) => (
              <EntryRow key={e.id} entry={e} last={i === recent.length - 1} />
            ))
          )}
        </View>

      </ScrollView>

      {/* Month picker modal */}
      <Modal visible={monthModal} transparent animationType="fade" onRequestClose={() => setMonthModal(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setMonthModal(false)}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Select Month</Text>
            <ScrollView>
              {months.map(m => (
                <TouchableOpacity
                  key={m}
                  style={[s.modalOpt, m === month && s.modalOptActive]}
                  onPress={() => { setPicked(m); setMonthModal(false); }}
                >
                  <Text style={[s.modalOptText, m === month && s.modalOptTextActive]}>
                    {monthLabel(m)}
                  </Text>
                  {m === month && <Text style={{ color: theme.amber }}>✓</Text>}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

function StatCard({ label, value, sub, accent, compact, valueColor }) {
  return (
    <View style={[s.stat, { borderTopColor: accent }]}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={[s.statValue, compact && s.statValueSm, valueColor && { color: valueColor }]}>
        {value}
      </Text>
      <Text style={s.statSub}>{sub}</Text>
    </View>
  );
}

function EntryRow({ entry: e, last }) {
  const isTrip = e.type === 'trip';
  return (
    <View style={[s.row, last && { borderBottomWidth: 0 }]}>
      <View style={[s.badge, { backgroundColor: isTrip ? theme.tripBg : theme.fuelBg }]}>
        <Text style={s.badgeIcon}>{isTrip ? '🚗' : '⛽'}</Text>
      </View>
      <View style={s.rowInfo}>
        <Text style={s.rowTitle} numberOfLines={1}>
          {isTrip ? (e.purpose || 'Business Trip') : (e.station || 'Fill-up')}
        </Text>
        <Text style={s.rowSub}>{fmtDate(e.date)}</Text>
      </View>
      <Text style={s.rowValue}>
        {isTrip ? `${(+e.km).toFixed(1)} km` : fmtR(e.totalCost)}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: theme.bg },
  scroll:  { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },

  monthRow:      { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 },
  monthMain:     { fontSize: 22, fontWeight: '800', color: theme.navy },
  monthSub:      { fontSize: 12, color: theme.muted, marginTop: 2 },
  monthChip:     { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 7, marginTop: 2 },
  monthChipText: { fontSize: 13, fontWeight: '700', color: theme.navy },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  stat: {
    width: '47.8%', backgroundColor: theme.card, borderRadius: 4,
    padding: 14, borderWidth: 1, borderColor: theme.border,
    borderTopWidth: 3,
  },
  statLabel:   { fontSize: 10, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase', color: theme.muted, marginBottom: 6 },
  statValue:   { fontSize: 26, fontWeight: '800', color: theme.navy },
  statValueSm: { fontSize: 17 },
  statSub:     { fontSize: 11, color: theme.muted, marginTop: 3 },

  card:       { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: theme.border },
  cardTitle:  { fontSize: 15, fontWeight: '700', color: theme.navy },
  cardAction: { fontSize: 13, fontWeight: '700', color: theme.amber },

  empty:       { alignItems: 'center', padding: 36 },
  emptyIcon:   { fontSize: 40, marginBottom: 10 },
  emptyTitle:  { fontSize: 16, fontWeight: '700', color: theme.navy, marginBottom: 4 },
  emptyText:   { fontSize: 13, color: theme.muted, textAlign: 'center', marginBottom: 16 },
  emptyBtn:    { backgroundColor: theme.navy, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 4 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  row:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
  badge:     { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  badgeIcon: { fontSize: 18 },
  rowInfo:   { flex: 1 },
  rowTitle:  { fontSize: 14, fontWeight: '600', color: theme.text },
  rowSub:    { fontSize: 12, color: theme.muted, marginTop: 2 },
  rowValue:  { fontSize: 13, fontWeight: '700', color: theme.navy },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  modalBox:     { backgroundColor: theme.card, borderRadius: 8, width: '80%', maxHeight: '60%', padding: 4 },
  modalTitle:   { fontSize: 14, fontWeight: '700', color: theme.navy, padding: 14, paddingBottom: 8, letterSpacing: 0.5 },
  modalOpt:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderTopWidth: 1, borderTopColor: theme.border },
  modalOptActive:     { backgroundColor: '#F0F4FF' },
  modalOptText:       { fontSize: 14, color: theme.text },
  modalOptTextActive: { fontWeight: '700', color: theme.navy },
});
