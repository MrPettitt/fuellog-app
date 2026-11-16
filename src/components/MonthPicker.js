import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, TouchableHighlight, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';
import { monthLabel } from '../utils';

// Bottom sheet with a single-choice list.
export function OptionSheet({ visible, title, options, value, labelOf = (o) => o, onSelect, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose} />
      <View style={s.sheet}>
        <View style={s.grabber} />
        <Text style={s.title}>{title}</Text>
        <ScrollView style={{ maxHeight: 380 }} bounces={false}>
          {options.map((o, i) => {
            const active = o === value;
            return (
              <TouchableHighlight key={o} underlayColor={colors.field} onPress={() => onSelect(o)}>
                <View style={[s.opt, i > 0 && s.optBorder]}>
                  <Text style={[s.optText, active && s.optTextActive]}>{labelOf(o)}</Text>
                  {active && <Ionicons name="checkmark" size={20} color={colors.accent} />}
                </View>
              </TouchableHighlight>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

// Months that have entries, plus the current month.
export function MonthModal({ visible, months, month, onSelect, onClose }) {
  return (
    <OptionSheet visible={visible} title="Month" options={months} value={month} labelOf={monthLabel} onSelect={onSelect} onClose={onClose} />
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet:   { backgroundColor: colors.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 28 },
  grabber: { alignSelf: 'center', width: 36, height: 5, borderRadius: 3, backgroundColor: colors.separator, marginTop: 8, marginBottom: 4 },
  title:   { fontSize: 17, fontWeight: '600', color: colors.text, textAlign: 'center', paddingVertical: 10 },
  opt:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  optBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator },
  optText: { fontSize: 17, color: colors.text },
  optTextActive: { fontWeight: '600' },
});
