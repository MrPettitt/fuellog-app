import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../AppContext';
import { colors, font } from '../theme';
import { calcStats, monthLabel, allMonths, monthEntries, defaultMonth, fmtDate, fmtR } from '../utils';
import { MonthModal } from '../components/MonthPicker';
import { TitleRow, SectionTitle, Group, Row, EntryIcon, EmptyState, screen } from '../components/ui';

export default function MonthlyLogScreen({ navigation }) {
  const { entries, settings } = useApp();
  const [picked, setPicked] = useState(null);   // null = follow latest month with data
  const month = picked ?? defaultMonth(entries);
  const [monthModal, setMonthModal] = useState(false);

  const es     = monthEntries(entries, month).sort((a, b) => a.date.localeCompare(b.date));
  const months = allMonths(entries);
  const st     = calcStats(entries, month, settings.ratePerKm);
  const trips  = es.filter(e => e.type === 'trip');
  const fuels  = es.filter(e => e.type === 'fuel');

  return (
    <SafeAreaView style={screen.safe} edges={['bottom']}>
      <ScrollView style={screen.scroll} contentContainerStyle={screen.content} showsVerticalScrollIndicator={false}>

        <TitleRow
          title={monthLabel(month)}
          subtitle={`${es.length} entr${es.length === 1 ? 'y' : 'ies'}`}
          actionLabel="Change" onAction={() => setMonthModal(true)}
        />

        <Group>
          <View style={s.stats}>
            <Stat label="Distance" value={`${st.km.toFixed(1)} km`} />
            <Stat label="Fuel" value={fmtR(st.fuel)} />
            <Stat label="Claim" value={fmtR(st.reimburse)} color={colors.money} />
          </View>
        </Group>

        {es.length === 0 ? (
          <Group style={{ marginTop: 22 }}>
            <EmptyState
              title={`Nothing logged in ${monthLabel(month)}`}
              message="Choose another month or add a new entry."
              actionLabel="Add an entry"
              onAction={() => navigation.navigate('Add Entry')}
            />
          </Group>
        ) : (
          <>
            {trips.length > 0 && (
              <>
                <SectionTitle>Trips</SectionTitle>
                <Group>
                  {trips.map(e => (
                    <Row key={e.id} label="" onPress={() => navigation.navigate('Add Entry', { edit: e })}>
                      <Entry entry={e} />
                    </Row>
                  ))}
                </Group>
              </>
            )}
            {fuels.length > 0 && (
              <>
                <SectionTitle>Fuel</SectionTitle>
                <Group>
                  {fuels.map(e => (
                    <Row key={e.id} label="" onPress={() => navigation.navigate('Add Entry', { edit: e })}>
                      <Entry entry={e} />
                    </Row>
                  ))}
                </Group>
              </>
            )}
            <Text style={s.hint}>Tap an entry to edit or delete it.</Text>
          </>
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

function Stat({ label, value, color }) {
  return (
    <View style={s.stat}>
      <Text style={s.statLabel}>{label}</Text>
      <Text style={[s.statValue, font.tabular, color && { color }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

function Entry({ entry: e }) {
  const isTrip = e.type === 'trip';
  const meta = isTrip
    ? [fmtDate(e.date), e.category, !e.manualKm && e.startOdo != null
        ? `${Number(e.startOdo).toLocaleString('en-ZA')} to ${Number(e.endOdo).toLocaleString('en-ZA')} km` : null]
    : [fmtDate(e.date), `${(+e.litres).toFixed(2)} L at R ${(+e.pricePerLitre).toFixed(2)}`];
  return (
    <View style={s.entry}>
      <EntryIcon type={e.type} />
      <View style={{ flex: 1 }}>
        <Text style={s.entryTitle} numberOfLines={1}>{isTrip ? (e.purpose || 'Business trip') : (e.station || 'Fuel')}</Text>
        <Text style={s.entrySub} numberOfLines={2}>{meta.filter(Boolean).join('  ·  ')}</Text>
        {e.notes ? <Text style={s.entryNote} numberOfLines={2}>{e.notes}</Text> : null}
      </View>
      <Text style={[s.entryValue, font.tabular]}>{isTrip ? `${(+e.km).toFixed(1)} km` : fmtR(e.totalCost)}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  stats:     { flexDirection: 'row', paddingVertical: 14, paddingHorizontal: 8 },
  stat:      { flex: 1, paddingHorizontal: 8 },
  statLabel: { fontSize: 13, color: colors.text2 },
  statValue: { fontSize: 18, fontWeight: '600', color: colors.text, marginTop: 3 },

  entry:      { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  entryTitle: { fontSize: 16, color: colors.text },
  entrySub:   { fontSize: 13, color: colors.text2, marginTop: 2 },
  entryNote:  { fontSize: 13, color: colors.text2, marginTop: 2, fontStyle: 'italic' },
  entryValue: { fontSize: 16, color: colors.text, fontWeight: '500' },

  hint: { fontSize: 13, color: colors.text3, textAlign: 'center', marginTop: 16 },
});
