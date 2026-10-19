import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Share, Modal, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { useApp } from '../AppContext';
import { theme } from '../theme';
import { monthLabel, allMonths, defaultMonth, buildSummaryText, calcStats, fmtR } from '../utils';

export default function SummaryScreen({ navigation }) {
  const { entries, settings } = useApp();
  const [picked,     setPicked]     = useState(null);   // null = follow latest month with data
  const month = picked ?? defaultMonth(entries);
  const [monthModal, setMonthModal] = useState(false);

  const months  = allMonths(entries);
  const st      = calcStats(entries, month, settings.ratePerKm);
  const summary = buildSummaryText(entries, month, settings);

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(summary);
    Alert.alert('✓ Copied', 'Summary copied to clipboard. Paste it into an email or message to your employer.');
  };

  const shareReport = async () => {
    try {
      await Share.share({
        message: summary,
        title:   `FuelLog - ${monthLabel(month)}`,
      });
    } catch (err) {
      Alert.alert('Share Failed', err.message);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Month header */}
        <View style={s.monthRow}>
          <View>
            <Text style={s.monthTitle}>{monthLabel(month)}</Text>
            <Text style={s.monthSub}>Reimbursement report</Text>
          </View>
          <TouchableOpacity style={s.monthChip} onPress={() => setMonthModal(true)}>
            <Text style={s.monthChipText}>Change ▾</Text>
          </TouchableOpacity>
        </View>

        {/* Profile notice */}
        {!settings.employeeName && (
          <TouchableOpacity style={s.notice} onPress={() => navigation.navigate('Settings')}>
            <Text style={s.noticeIcon}>⚙️</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.noticeTitle}>Set up your profile</Text>
              <Text style={s.noticeSub}>Add your name and employer in Settings for a complete report →</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Summary cards */}
        <View style={s.highlights}>
          <Highlight label="Total KM"      value={`${st.km.toFixed(1)} km`} />
          <Highlight label="Est. Reimburse" value={fmtR(st.reimburse)} green />
        </View>

        {/* Action buttons */}
        <View style={s.actions}>
          <TouchableOpacity style={s.btnShare} onPress={shareReport}>
            <Text style={s.btnShareText}>📤  Share Report</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnCopy} onPress={copyToClipboard}>
            <Text style={s.btnCopyText}>📋  Copy</Text>
          </TouchableOpacity>
        </View>

        {/* Report preview */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Text style={s.cardTitle}>Report Preview</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Text style={s.report} selectable>{summary}</Text>
          </ScrollView>
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

function Highlight({ label, value, green }) {
  return (
    <View style={[s.hl, green && { borderTopColor: theme.success }]}>
      <Text style={s.hlLabel}>{label}</Text>
      <Text style={[s.hlValue, green && { color: theme.success }]}>{value}</Text>
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

  notice:      { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: theme.card, borderLeftWidth: 4, borderLeftColor: theme.amber, borderRadius: 4, padding: 14, marginBottom: 14 },
  noticeIcon:  { fontSize: 22 },
  noticeTitle: { fontSize: 14, fontWeight: '700', color: theme.navy },
  noticeSub:   { fontSize: 12, color: theme.muted, marginTop: 2 },

  highlights: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  hl: {
    flex: 1, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border,
    borderTopWidth: 3, borderTopColor: theme.amber, borderRadius: 4, padding: 14,
  },
  hlLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: theme.muted, marginBottom: 4 },
  hlValue: { fontSize: 20, fontWeight: '800', color: theme.navy },

  actions:      { flexDirection: 'row', gap: 10, marginBottom: 14 },
  btnShare:     { flex: 1, backgroundColor: theme.navy, borderRadius: 4, paddingVertical: 13, alignItems: 'center' },
  btnShareText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  btnCopy:      { flex: 0.6, backgroundColor: theme.card, borderWidth: 1.5, borderColor: theme.border, borderRadius: 4, paddingVertical: 13, alignItems: 'center' },
  btnCopyText:  { color: theme.navy, fontWeight: '700', fontSize: 14 },

  card:       { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 4 },
  cardHeader: { padding: 14, borderBottomWidth: 1, borderBottomColor: theme.border },
  cardTitle:  { fontSize: 15, fontWeight: '700', color: theme.navy },
  report:     {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 12, color: theme.text, lineHeight: 20,
    padding: 14, minWidth: '100%',
  },

  modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  modalBox:           { backgroundColor: theme.card, borderRadius: 8, width: '80%', maxHeight: '60%', padding: 4 },
  modalTitle:         { fontSize: 14, fontWeight: '700', color: theme.navy, padding: 14, paddingBottom: 8 },
  modalOpt:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderTopWidth: 1, borderTopColor: theme.border },
  modalOptActive:     { backgroundColor: '#F0F4FF' },
  modalOptText:       { fontSize: 14, color: theme.text },
  modalOptTextActive: { fontWeight: '700', color: theme.navy },
});
