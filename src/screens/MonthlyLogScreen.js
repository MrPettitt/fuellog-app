import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import { theme, card } from '../theme';
import { calcStats, monthLabel, allMonths, monthEntries, defaultMonth, fmtDate, fmtR } from '../utils';
import { MonthHeader, MonthModal } from '../components/MonthPicker';
import EntryBadge from '../components/EntryBadge';

export default function MonthlyLogScreen({ navigation }) {
  const { entries, settings, deleteEntry } = useApp();
  const [picked, setPicked] = useState(null);   // null = follow latest month with data
  const month = picked ?? defaultMonth(entries);
  const [monthModal, setMonthModal] = useState(false);

  const es     = monthEntries(entries, month).sort((a, b) => a.date.localeCompare(b.date));
  const months = allMonths(entries);
  const st     = calcStats(entries, month, settings.ratePerKm);

  const confirmDelete = (id, label) => {
    Alert.alert('Delete entry', `Delete "${label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteEntry(id) },
    ]);
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <MonthHeader month={month} subtitle={`${es.length} entr${es.length === 1 ? 'y' : 'ies'}`} onPress={() => setMonthModal(true)} />

        {/* Totals strip */}
        <View style={s.strip}>
          <StripItem label="Total km"  value={`${st.km.toFixed(1)}`} unit="km" />
          <Divider />
          <StripItem label="Trips"     value={String(st.trips)} />
          <Divider />
          <StripItem label="Fuel"      value={fmtR(st.fuel)} />
          <Divider />
          <StripItem label="Claim"     value={fmtR(st.reimburse)} green />
        </View>

        {es.length === 0 ? (
          <View style={[s.card, s.empty]}>
            <View style={s.emptyIcon}>
              <MaterialCommunityIcons name="clipboard-text-outline" size={32} color={theme.amber} />
            </View>
            <Text style={s.emptyTitle}>Nothing logged in {monthLabel(month)}</Text>
            <Text style={s.emptyText}>Switch months above or add a new entry.</Text>
            <TouchableOpacity style={s.emptyBtn} onPress={() => navigation.navigate('Add Entry')}>
              <Text style={s.emptyBtnText}>Add entry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={s.card}>
            {es.map((e, i) => (
              <EntryBlock
                key={e.id}
                entry={e}
                last={i === es.length - 1}
                onEdit={() => navigation.navigate('Add Entry', { edit: e })}
                onDelete={() => confirmDelete(e.id, e.type === 'trip' ? (e.purpose || 'Trip') : (e.station || 'Fill-up'))}
              />
            ))}
          </View>
        )}

      </ScrollView>

      <MonthModal
        visible={monthModal} months={months} month={month}
        onSelect={m => { setPicked(m); setMonthModal(false); }}
        onClose={() => setMonthModal(false)}
      />
    </SafeAreaView>
  );
}

const Divider = () => <View style={s.divider} />;

function StripItem({ label, value, unit, green }) {
  return (
    <View style={s.stripItem}>
      <Text style={s.stripLabel}>{label}</Text>
      <Text style={[s.stripValue, green && { color: theme.success }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}{unit ? <Text style={s.stripUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

function EntryBlock({ entry: e, last, onEdit, onDelete }) {
  const isTrip = e.type === 'trip';
  return (
    <View style={[s.entry, last && { borderBottomWidth: 0 }]}>
      <EntryBadge type={e.type} />

      <View style={s.entryBody}>
        <View style={s.entryTop}>
          <Text style={s.entryTitle} numberOfLines={1}>
            {isTrip ? (e.purpose || 'Business trip') : (e.station || 'Fill-up')}
          </Text>
          <Text style={s.entryValue}>{isTrip ? `${(+e.km).toFixed(1)} km` : fmtR(e.totalCost)}</Text>
        </View>

        <View style={s.metaRow}>
          <Text style={s.metaDate}>{fmtDate(e.date)}</Text>
          {isTrip
            ? (e.category ? <Text style={s.chip}>{e.category}</Text> : null)
            : <Text style={s.chip}>{(+e.litres).toFixed(2)} L  ·  R {(+e.pricePerLitre).toFixed(2)}/L</Text>}
        </View>

        {isTrip && !e.manualKm && e.startOdo != null && (
          <Text style={s.detail}>Odometer {Number(e.startOdo).toLocaleString('en-ZA')} to {Number(e.endOdo).toLocaleString('en-ZA')} km</Text>
        )}
        {e.notes ? <Text style={s.notes}>{e.notes}</Text> : null}

        <View style={s.actions}>
          <TouchableOpacity style={s.actionBtn} onPress={onEdit} accessibilityRole="button" accessibilityLabel="Edit entry">
            <Ionicons name="pencil-outline" size={14} color={theme.navy} />
            <Text style={s.actionText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, s.actionDanger]} onPress={onDelete} accessibilityRole="button" accessibilityLabel="Delete entry">
            <Ionicons name="trash-outline" size={14} color={theme.danger} />
            <Text style={[s.actionText, { color: theme.danger }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: theme.bg },
  scroll:  { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },

  strip:      { ...card, flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6, marginBottom: 12 },
  stripItem:  { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  stripLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: theme.muted, marginBottom: 3 },
  stripValue: { fontSize: 15, fontWeight: '800', color: theme.navy },
  stripUnit:  { fontSize: 11, fontWeight: '600', color: theme.muted },
  divider:    { width: 1, height: 28, backgroundColor: theme.border },

  card:  { ...card },
  entry: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderBottomWidth: 1, borderBottomColor: theme.border, gap: 12 },

  entryBody:  { flex: 1 },
  entryTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  entryTitle: { flex: 1, fontSize: 15, fontWeight: '700', color: theme.text },
  entryValue: { fontSize: 14, fontWeight: '800', color: theme.navy },

  metaRow:  { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 },
  metaDate: { fontSize: 12, color: theme.muted },
  chip:     { fontSize: 11, fontWeight: '600', color: theme.muted, backgroundColor: theme.bg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },

  detail: { fontSize: 12, color: theme.muted, marginTop: 6 },
  notes:  { fontSize: 12, color: theme.text, marginTop: 6, fontStyle: 'italic', backgroundColor: theme.amberSoft, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, overflow: 'hidden' },

  actions:      { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderColor: theme.border, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5, backgroundColor: theme.card },
  actionDanger: { borderColor: '#F0CACA', backgroundColor: theme.dangerSoft },
  actionText:   { fontSize: 12, fontWeight: '700', color: theme.navy },

  empty:        { alignItems: 'center', padding: 36 },
  emptyIcon:    { width: 64, height: 64, borderRadius: 32, backgroundColor: theme.amberSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle:   { fontSize: 16, fontWeight: '700', color: theme.navy, marginBottom: 4, textAlign: 'center' },
  emptyText:    { fontSize: 13, color: theme.muted, textAlign: 'center', marginBottom: 16 },
  emptyBtn:     { backgroundColor: theme.navy, paddingHorizontal: 22, paddingVertical: 10, borderRadius: theme.radiusSm },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
