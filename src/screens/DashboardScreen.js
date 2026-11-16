import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../AppContext';
import { colors, font } from '../theme';
import { calcStats, monthLabel, allMonths, defaultMonth, fmtDate, fmtR } from '../utils';
import { MonthModal } from '../components/MonthPicker';
import { TitleRow, SectionTitle, Group, Row, EntryIcon, EmptyState, screen } from '../components/ui';

export default function DashboardScreen({ navigation }) {
  const { entries, settings } = useApp();
  const [picked, setPicked] = useState(null);   // null = follow latest month with data
  const month = picked ?? defaultMonth(entries);
  const [monthModal, setMonthModal] = useState(false);

  const st     = calcStats(entries, month, settings.ratePerKm);
  const months = allMonths(entries);
  const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  const rate   = +settings.ratePerKm > 0 ? +settings.ratePerKm : 0;

  return (
    <SafeAreaView style={screen.safe} edges={['bottom']}>
      <ScrollView style={screen.scroll} contentContainerStyle={screen.content} showsVerticalScrollIndicator={false}>

        <TitleRow title={monthLabel(month)} actionLabel="Change" onAction={() => setMonthModal(true)} />

        <Group>
          <View style={s.total}>
            <Text style={s.totalLabel}>Reimbursement</Text>
            <Text style={[s.totalValue, font.tabular]}>{fmtR(st.reimburse)}</Text>
            <Text style={s.totalSub}>{st.km.toFixed(1)} km at {fmtR(rate)} per km</Text>
          </View>
        </Group>

        <SectionTitle>This month</SectionTitle>
        <Group>
          <Row label="Business distance" value={`${st.km.toFixed(1)} km`} />
          <Row label="Trips" value={String(st.trips)} />
          <Row label="Fuel" value={`${fmtR(st.fuel)}${st.fuels ? `  ·  ${st.fuels} fill-up${st.fuels === 1 ? '' : 's'}` : ''}`} />
        </Group>

        <SectionTitle right={entries.length > recent.length ? 'See all' : undefined} onRight={() => navigation.navigate('Log')}>
          Recent
        </SectionTitle>
        <Group>
          {recent.length === 0 ? (
            <EmptyState
              title="No entries yet"
              message="Log a business trip or a fuel fill-up and it will show up here."
              actionLabel="Add an entry"
              onAction={() => navigation.navigate('Add Entry')}
            />
          ) : recent.map(e => (
            <Row key={e.id} label="" onPress={() => navigation.navigate('Add Entry', { edit: e })}>
              <EntryRow entry={e} />
            </Row>
          ))}
        </Group>

      </ScrollView>

      <MonthModal
        visible={monthModal} months={months} month={month}
        onSelect={m => { setPicked(m); setMonthModal(false); }}
        onClose={() => setMonthModal(false)}
      />
    </SafeAreaView>
  );
}

function EntryRow({ entry: e }) {
  const isTrip = e.type === 'trip';
  return (
    <View style={s.entry}>
      <EntryIcon type={e.type} />
      <View style={{ flex: 1 }}>
        <Text style={s.entryTitle} numberOfLines={1}>{isTrip ? (e.purpose || 'Business trip') : (e.station || 'Fuel')}</Text>
        <Text style={s.entrySub}>{fmtDate(e.date)}</Text>
      </View>
      <Text style={[s.entryValue, font.tabular]}>{isTrip ? `${(+e.km).toFixed(1)} km` : fmtR(e.totalCost)}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  total:      { paddingHorizontal: 16, paddingVertical: 18 },
  totalLabel: { fontSize: 14, color: colors.text2 },
  totalValue: { fontSize: 38, fontWeight: '700', color: colors.text, letterSpacing: -0.8, marginTop: 2 },
  totalSub:   { fontSize: 14, color: colors.text2, marginTop: 4 },

  entry:      { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  entryTitle: { fontSize: 16, color: colors.text },
  entrySub:   { fontSize: 13, color: colors.text2, marginTop: 2 },
  entryValue: { fontSize: 16, color: colors.text, fontWeight: '500' },
});
