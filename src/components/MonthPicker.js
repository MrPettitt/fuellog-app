import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';
import { monthLabel } from '../utils';

// Screen header: big month title with a subtitle and a "change month" chip.
export function MonthHeader({ month, subtitle, onPress }) {
  return (
    <View style={s.row}>
      <View style={{ flex: 1 }}>
        <Text style={s.title}>{monthLabel(month)}</Text>
        {subtitle ? <Text style={s.sub}>{subtitle}</Text> : null}
      </View>
      <TouchableOpacity style={s.chip} onPress={onPress} accessibilityRole="button" accessibilityLabel="Change month">
        <Ionicons name="calendar-outline" size={15} color={theme.navy} />
        <Text style={s.chipText}>Change</Text>
        <Ionicons name="chevron-down" size={14} color={theme.muted} />
      </TouchableOpacity>
    </View>
  );
}

// Bottom-sheet style month picker.
export function MonthModal({ visible, months, month, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <View style={s.sheet}>
          <View style={s.handle} />
          <Text style={s.sheetTitle}>Select month</Text>
          <ScrollView style={{ maxHeight: 360 }}>
            {months.map(m => {
              const active = m === month;
              return (
                <TouchableOpacity key={m} style={[s.opt, active && s.optActive]} onPress={() => onSelect(m)}>
                  <Text style={[s.optText, active && s.optTextActive]}>{monthLabel(m)}</Text>
                  {active && <Ionicons name="checkmark-circle" size={20} color={theme.amber} />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const s = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12 },
  title: { fontSize: 24, fontWeight: '800', color: theme.navy, letterSpacing: -0.3 },
  sub:   { fontSize: 13, color: theme.muted, marginTop: 2 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border,
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, ...theme.shadow,
  },
  chipText: { fontSize: 13, fontWeight: '700', color: theme.navy },

  overlay: { flex: 1, backgroundColor: 'rgba(11,31,58,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: theme.card, borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingBottom: 24, paddingHorizontal: 8, ...theme.shadowStrong,
  },
  handle:     { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border, marginTop: 10, marginBottom: 6 },
  sheetTitle: { fontSize: 13, fontWeight: '700', color: theme.muted, letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 12, paddingVertical: 10 },
  opt:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, borderRadius: theme.radiusSm, marginHorizontal: 4 },
  optActive:  { backgroundColor: theme.amberSoft },
  optText:    { fontSize: 16, color: theme.text },
  optTextActive: { fontWeight: '700', color: theme.navy },
});
