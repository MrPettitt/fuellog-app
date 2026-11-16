// Form rows used inside a Group.
import React from 'react';
import { View, Text, TextInput, Switch, StyleSheet } from 'react-native';
import { colors, font } from '../theme';

// Label on the left, short value typed on the right (dates, numbers).
export function InlineField({ label, value, onChangeText, placeholder, keyboardType, unit, prefix }) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      {prefix ? <View style={{ flex: 1 }} /> : null}
      {prefix ? <Text style={s.unit}>{prefix}</Text> : null}
      <TextInput
        style={[s.inlineInput, font.tabular, prefix && { flex: 0, minWidth: 64 }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text3}
        keyboardType={keyboardType}
      />
      {unit ? <Text style={s.unit}>{unit}</Text> : null}
    </View>
  );
}

// Small label above a full-width input (free text).
export function StackedField({ label, value, onChangeText, placeholder, multiline }) {
  return (
    <View style={s.stacked}>
      <Text style={s.stackedLabel}>{label}</Text>
      <TextInput
        style={[s.stackedInput, multiline && { minHeight: 44 }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.text3}
        multiline={multiline}
      />
    </View>
  );
}

export function SwitchRow({ label, value, onValueChange }) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Switch value={value} onValueChange={onValueChange} trackColor={{ false: '#D9D9DE', true: colors.text }} thumbColor="#fff" />
    </View>
  );
}

// Read-only computed value, shown bold.
export function ResultRow({ label, value }) {
  return (
    <View style={s.row}>
      <Text style={[s.label, { fontWeight: '600', flex: 1 }]}>{label}</Text>
      <Text style={[s.result, font.tabular]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  row:         { flexDirection: 'row', alignItems: 'center', minHeight: 50, paddingHorizontal: 16, paddingVertical: 8, gap: 12 },
  label:       { fontSize: 16, color: colors.text, flexShrink: 0 },
  inlineInput: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: 6, minWidth: 80, textAlign: 'right' },
  unit:        { fontSize: 16, color: colors.text2 },
  result:      { fontSize: 16, fontWeight: '600', color: colors.text },

  stacked:      { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 8 },
  stackedLabel: { fontSize: 13, color: colors.text2, marginBottom: 2 },
  stackedInput: { fontSize: 16, color: colors.text, paddingVertical: 6 },
});
