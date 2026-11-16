import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../AppContext';
import { theme } from '../theme';
import {
  calcStats, monthLabel, allMonths, monthEntries, defaultMonth, fmtDate, fmtR,
} from '../utils';

export default function MonthlyLogScreen() {
  const { entries, settings, deleteEntry } = useApp();
  const [picked,     setPicked]     = useState(null);   // null = follow latest month with data
  const month = picked ?? defaultMonth(entries);
  const [monthModal, setMonthModal] = useState(false);

  const es     = monthEntries(entries, month).sort((a, b) => a.date.localeCompare(b.date));
  const months = allMonths(entries);

  const st     = calcStats(entries, month, settings.ratePerKm);

  const confirmDelete = (id, label) => {
    Alert.alert('Delete Entry', `Delete "${label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(id) },
    ]);
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Month header */}
        <View style={s.monthRow}>
          <View>
            <Text style={s.monthTitle}>{monthLabel(month)}</Text>
            <Text style={s.monthSub}>{es.length} entr{es.length === 1 ? 'y' : 'ies'}</Text>
          </View>
          <TouchableOpacity style={s.monthChip} onPress={() => setMonthModal(true)}>
            <Text style={s.monthChipText}>Change ▾</Text>
          </TouchableOpacity>
        </View>

        {/* Stats strip */}
        <View style={s.strip}>
          <StripItem label="Total KM"       value={`${st.km.toFixed(1)} km`} />
          <StripItem label="Trips"          value={String(st.trips)} />
          <StripItem label="Fuel Spend"     value={fmtR(st.fuel)} />
          <StripItem label="Reimbursement"  value={fmtR(st.reimburse)} green />
        </View>

        {/* Entries */}
        {es.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📋</Text>
            <Text style={s.emptyTitle}>No entries for {monthLabel(month)}</Text>
            <Text style={s.emptyText}>Switch months above or add a new entry</Text>
          </View>
        ) : (
          <View style={s.card}>
            {es.map((e, i) => (
              <EntryBlock
                key={e.id}
                entry={e}
                last={i === es.length - 1}
                onDelete={() => confirmDelete(e.id, e.type === 'trip' ? (e.purpose || 'Trip') : (e.station || 'Fill-up'))}
              />
            ))}
          </View>
        )}

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
                  <Text style={[s.modalOptText, m === month && s.modalOptTextActive]}>{monthLabel(m)}</Text>
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

function StripItem({ label, value, green }) {
  return (
    <View style={s.stripItem}>
      <Text style={s.stripLabel}>{label}</Text>
      <Text style={[s.stripValue, green && { color: theme.success }]}>{value}</Text>
    </View>
  );
}

function EntryBlock({ entry: e, last, onDelete }) {
  const isTrip = e.type === 'trip';
  return (
    <View style={[s.entry, last && { borderBottomWidth: 0 }]}>
      <View style={[s.badge, { backgroundColor: isTrip ? theme.tripBg : theme.fuelBg }]}>
        <Text style={s.badgeIcon}>{isTrip ? '🚗' : '⛽'}</Text>
      </View>

      <View style={s.entryBody}>
        <View style={s.entryTopRow}>
          <Text style={s.entryTitle} numberOfLines={1}>
            {isTrip ? (e.purpose || 'Business Trip') : (e.station || 'Fill-up')}
          </Text>
          <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={s.deleteBtn}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={s.entryMeta}>
          <Text style={s.metaDate}>{fmtDate(e.date)}</Text>
          {isTrip ? (
            <>
              {e.category && <Text style={s.metaTag}>{e.category}</Text>}
              <Text style={s.metaValue}>{(+e.km).toFixed(1)} km</Text>
            </>
          ) : (
            <>
              <Text style={s.metaTag}>{(+e.litres).toFixed(2)}L · R{(+e.pricePerLitre).toFixed(3)}/L</Text>
              <Text style={s.metaValue}>{fmtR(e.totalCost)}</Text>
            </>
          )}
        </View>

        {isTrip && !e.manualKm && e.startOdo != null && (
          <Text style={s.odo}>
            Odo: {Number(e.startOdo).toLocaleString('en-ZA')} → {Number(e.endOdo).toLocaleString('en-ZA')} km
          </Text>
        )}
        {e.notes ? <Text style={s.notes}>📝 {e.notes}</Text> : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: theme.bg },
  scroll:  { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },

  monthRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  monthTitle:    { fontSize: 22, fontWeight: '800', color: theme.navy },
  monthSub:      { fontSize: 12, color: theme.muted, marginTop: 2 },
  monthChip:     { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 4, paddingHorizontal: 12, paddingVertical: 7, marginTop: 2 },
  monthChipText: { fontSize: 13, fontWeight: '700', color: theme.navy },

  strip:      { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 4, padding: 12, marginBottom: 14, gap: 12 },
  stripItem:  {},
  stripLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: theme.muted, marginBottom: 2 },
  stripValue: { fontSize: 14, fontWeight: '700', color: theme.navy },

  empty:      { alignItems: 'center', padding: 48 },
  emptyIcon:  { fontSize: 36, marginBottom: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: theme.navy, marginBottom: 4 },
  emptyText:  { fontSize: 13, color: theme.muted, textAlign: 'center' },

  card:  { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 4 },
  entry: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderBottomWidth: 1, borderBottomColor: theme.border, gap: 12 },

  badge:     { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  badgeIcon: { fontSize: 18 },

  entryBody:   { flex: 1 },
  entryTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  entryTitle:  { flex: 1, fontSize: 14, fontWeight: '700', color: theme.text, paddingRight: 8 },
  deleteBtn:   { fontSize: 14, color: theme.muted, fontWeight: '700' },

  entryMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  metaDate:  { fontSize: 12, color: theme.muted },
  metaTag:   { fontSize: 12, color: theme.muted },
  metaValue: { fontSize: 13, fontWeight: '700', color: theme.navy, marginLeft: 'auto' },

  odo:   { fontSize: 11, color: theme.muted, marginTop: 4 },
  notes: { fontSize: 12, color: theme.muted, marginTop: 4, fontStyle: 'italic' },

  modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  modalBox:           { backgroundColor: theme.card, borderRadius: 8, width: '80%', maxHeight: '60%', padding: 4 },
  modalTitle:         { fontSize: 14, fontWeight: '700', color: theme.navy, padding: 14, paddingBottom: 8 },
  modalOpt:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderTopWidth: 1, borderTopColor: theme.border },
  modalOptActive:     { backgroundColor: '#F0F4FF' },
  modalOptText:       { fontSize: 14, color: theme.text },
  modalOptTextActive: { fontWeight: '700', color: theme.navy },
});
