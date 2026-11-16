import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Share, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useApp } from '../AppContext';
import { colors, font } from '../theme';
import { monthLabel, allMonths, defaultMonth, buildSummaryText, buildCsv, calcStats, fmtR } from '../utils';
import { MonthModal } from '../components/MonthPicker';
import { TitleRow, SectionTitle, Group, Row, Button, screen } from '../components/ui';

export default function SummaryScreen({ navigation }) {
  const { entries, settings } = useApp();
  const [picked, setPicked] = useState(null);   // null = follow latest month with data
  const month = picked ?? defaultMonth(entries);
  const [monthModal, setMonthModal] = useState(false);

  const months  = allMonths(entries);
  const st      = calcStats(entries, month, settings.ratePerKm);
  const summary = buildSummaryText(entries, month, settings);
  const nothing = st.count === 0;

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(summary);
    Alert.alert('Copied', 'The report is on your clipboard.');
  };

  const shareReport = async () => {
    try {
      await Share.share({ message: summary, title: `FuelLog - ${monthLabel(month)}` });
    } catch (err) {
      Alert.alert('Could not share', err.message);
    }
  };

  // Writes the month to a .csv file in the cache folder and opens the share sheet.
  // Where file sharing is not available (e.g. web) the CSV text is shared instead.
  const shareCsv = async () => {
    const csv = buildCsv(entries, month);
    try {
      const canShareFile = Platform.OS !== 'web' && FileSystem.cacheDirectory && await Sharing.isAvailableAsync();
      if (canShareFile) {
        const uri = `${FileSystem.cacheDirectory}FuelLog-${month}.csv`;
        await FileSystem.writeAsStringAsync(uri, csv, { encoding: FileSystem.EncodingType.UTF8 });
        await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: `FuelLog ${monthLabel(month)}`, UTI: 'public.comma-separated-values-text' });
      } else {
        await Share.share({ message: csv, title: `FuelLog ${monthLabel(month)} (CSV)` });
      }
    } catch (err) {
      Alert.alert('Could not export', err.message);
    }
  };

  return (
    <SafeAreaView style={screen.safe} edges={['bottom']}>
      <ScrollView style={screen.scroll} contentContainerStyle={screen.content} showsVerticalScrollIndicator={false}>

        <TitleRow title={monthLabel(month)} subtitle="Reimbursement claim" actionLabel="Change" onAction={() => setMonthModal(true)} />

        <Group>
          <Row label="Business distance" value={`${st.km.toFixed(1)} km`} />
          <Row label="Rate" value={`${fmtR(settings.ratePerKm)} per km`} />
          <Row label="Total claim" value={fmtR(st.reimburse)} valueColor={colors.money} />
        </Group>

        {!settings.employeeName && (
          <Group style={{ marginTop: 12 }}>
            <Row label="Add your name and employer for a complete report" onPress={() => navigation.navigate('Settings')} />
          </Group>
        )}

        <View style={s.actions}>
          <Button title="Share report" onPress={shareReport} disabled={nothing} />
          <View style={s.actionsRow}>
            <Button title="Copy text" kind="secondary" onPress={copyToClipboard} disabled={nothing} style={{ flex: 1 }} />
            <Button title="Export CSV" kind="secondary" onPress={shareCsv} disabled={nothing} style={{ flex: 1 }} />
          </View>
        </View>

        <SectionTitle>Preview</SectionTitle>
        <Group>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={[s.report, font.mono]} selectable>{summary}</Text>
          </ScrollView>
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

const s = StyleSheet.create({
  actions:    { marginTop: 16, gap: 10 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  report:     { fontSize: 12, lineHeight: 19, color: colors.text, padding: 16, minWidth: '100%' },
});
