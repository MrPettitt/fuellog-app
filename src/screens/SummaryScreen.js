import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Share, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useApp } from '../AppContext';
import { theme, card } from '../theme';
import { monthLabel, allMonths, defaultMonth, buildSummaryText, buildCsv, calcStats, fmtR } from '../utils';
import { MonthHeader, MonthModal } from '../components/MonthPicker';

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
    Alert.alert('Copied', 'The report is on your clipboard. Paste it into an email or message to your employer.');
  };

  const shareReport = async () => {
    try {
      await Share.share({ message: summary, title: `FuelLog - ${monthLabel(month)}` });
    } catch (err) {
      Alert.alert('Share failed', err.message);
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
        await Sharing.shareAsync(uri, { mimeType: 'text/csv', dialogTitle: `FuelLog ${monthLabel(month)} (CSV)`, UTI: 'public.comma-separated-values-text' });
      } else {
        await Share.share({ message: csv, title: `FuelLog ${monthLabel(month)} (CSV)` });
      }
    } catch (err) {
      Alert.alert('Export failed', err.message);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        <MonthHeader month={month} subtitle="Reimbursement report" onPress={() => setMonthModal(true)} />

        {/* Profile notice */}
        {!settings.employeeName && (
          <TouchableOpacity style={s.notice} onPress={() => navigation.navigate('Settings')}>
            <View style={s.noticeIcon}><Ionicons name="person-outline" size={18} color={theme.amber} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.noticeTitle}>Set up your profile</Text>
              <Text style={s.noticeSub}>Add your name and employer in Settings for a complete report.</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.muted} />
          </TouchableOpacity>
        )}

        {/* Highlights */}
        <View style={s.highlights}>
          <Highlight icon="map-outline"   label="Business km"   value={`${st.km.toFixed(1)} km`} />
          <Highlight icon="cash-outline"  label="Reimbursement" value={fmtR(st.reimburse)} green />
        </View>

        {/* Actions */}
        <TouchableOpacity style={[s.btnShare, nothing && s.btnDisabled]} onPress={shareReport} disabled={nothing}>
          <Ionicons name="share-social-outline" size={18} color="#fff" />
          <Text style={s.btnShareText}>Share report</Text>
        </TouchableOpacity>
        <View style={s.actionsRow}>
          <TouchableOpacity style={[s.btnSecondary, nothing && s.btnDisabled]} onPress={copyToClipboard} disabled={nothing}>
            <Ionicons name="copy-outline" size={17} color={theme.navy} />
            <Text style={s.btnSecondaryText}>Copy text</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btnSecondary, nothing && s.btnDisabled]} onPress={shareCsv} disabled={nothing}>
            <Ionicons name="grid-outline" size={17} color={theme.navy} />
            <Text style={s.btnSecondaryText}>Export CSV</Text>
          </TouchableOpacity>
        </View>

        {/* Report preview */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="document-text-outline" size={16} color={theme.muted} />
            <Text style={s.cardTitle}>Report preview</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={s.report} selectable>{summary}</Text>
          </ScrollView>
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

function Highlight({ icon, label, value, green }) {
  return (
    <View style={[s.hl, green && { borderTopColor: theme.success }]}>
      <View style={s.hlTop}>
        <Ionicons name={icon} size={15} color={green ? theme.success : theme.amber} />
        <Text style={s.hlLabel}>{label}</Text>
      </View>
      <Text style={[s.hlValue, green && { color: theme.success }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: theme.bg },
  scroll:  { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },

  notice:      { ...card, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 12, borderColor: '#F3D9A4', backgroundColor: theme.amberSoft },
  noticeIcon:  { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.card, alignItems: 'center', justifyContent: 'center' },
  noticeTitle: { fontSize: 14, fontWeight: '700', color: theme.navy },
  noticeSub:   { fontSize: 12, color: theme.muted, marginTop: 2 },

  highlights: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  hl:      { flex: 1, ...card, borderTopWidth: 3, borderTopColor: theme.amber, padding: 14 },
  hlTop:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  hlLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: theme.muted },
  hlValue: { fontSize: 22, fontWeight: '800', color: theme.navy },

  btnShare:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.navy, borderRadius: theme.radiusSm, paddingVertical: 14, marginBottom: 10, ...theme.shadow },
  btnShareText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  actionsRow:   { flexDirection: 'row', gap: 10, marginBottom: 12 },
  btnSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, ...card, paddingVertical: 12 },
  btnSecondaryText: { color: theme.navy, fontWeight: '700', fontSize: 14 },
  btnDisabled:  { opacity: 0.45 },

  card:       { ...card },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderBottomWidth: 1, borderBottomColor: theme.border },
  cardTitle:  { fontSize: 15, fontWeight: '700', color: theme.navy },
  report:     {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 12, color: theme.text, lineHeight: 20,
    padding: 14, minWidth: '100%',
  },
});
