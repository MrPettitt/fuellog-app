import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../AppContext';
import { theme } from '../theme';
import { num } from '../utils';

export default function SettingsScreen() {
  const { settings, updateSettings, clearAll } = useApp();

  const [name,    setName]    = useState(settings.employeeName   || '');
  const [company, setCompany] = useState(settings.employerName   || '');
  const [vehicle, setVehicle] = useState(settings.vehicleMake    || '');
  const [reg,     setReg]     = useState(settings.vehicleReg     || '');
  const [rate,    setRate]    = useState(String(settings.ratePerKm || 4.28));
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    setName(settings.employeeName   || '');
    setCompany(settings.employerName || '');
    setVehicle(settings.vehicleMake  || '');
    setReg(settings.vehicleReg       || '');
    setRate(String(settings.ratePerKm || 4.28));
  }, [settings]);

  const save = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name.'); return;
    }
    updateSettings({
      employeeName:    name.trim(),
      employerName:    company.trim(),
      vehicleMake:     vehicle.trim(),
      vehicleReg:      reg.trim(),
      ratePerKm:       num(rate) || 4.28,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const confirmClear = () => {
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all entries and reset your profile. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Clear', style: 'destructive', onPress: clearAll },
      ]
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* Profile section */}
        <SectionHeader title="Employee Profile" />
        <View style={s.card}>
          <Field label="Your Full Name" value={name} onChangeText={setName} placeholder="e.g. Thabo Nkosi" />
          <Field label="Employer / Company" value={company} onChangeText={setCompany} placeholder="e.g. Apex Solutions (Pty) Ltd" divider />
          <Field label="Vehicle Make & Model" value={vehicle} onChangeText={setVehicle} placeholder="e.g. Toyota Corolla Quest" divider />
          <Field label="Vehicle Registration" value={reg} onChangeText={setReg} placeholder="e.g. GP 42 FL" divider />
        </View>

        {/* Rate section */}
        <SectionHeader title="Reimbursement Rate" />
        <View style={s.card}>
          <Field
            label="Rate per Kilometre (R)"
            value={rate}
            onChangeText={setRate}
            placeholder="4.28"
            keyboardType="decimal-pad"
          />
          <View style={s.rateNote}>
            <Text style={s.rateNoteText}>
              💡 The current SARS AA rate is R 4.28/km for private vehicles. Confirm the rate with your employer before submitting claims.
            </Text>
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity style={[s.btnSave, saved && s.btnSaved]} onPress={save}>
          <Text style={s.btnSaveText}>{saved ? '✓ Settings Saved' : 'Save Settings'}</Text>
        </TouchableOpacity>

        {/* Danger zone */}
        <SectionHeader title="Danger Zone" danger />
        <View style={[s.card, s.dangerCard]}>
          <View style={s.dangerRow}>
            <View style={{ flex: 1 }}>
              <Text style={s.dangerTitle}>Clear all data</Text>
              <Text style={s.dangerSub}>Permanently delete all log entries and reset your profile</Text>
            </View>
            <TouchableOpacity style={s.btnDanger} onPress={confirmClear}>
              <Text style={s.btnDangerText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.version}>FuelLog v1.0 · Built for South African business travel</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title, danger }) {
  return (
    <Text style={[s.sectionHeader, danger && { color: theme.danger }]}>
      {title.toUpperCase()}
    </Text>
  );
}

function Field({ label, value, onChangeText, placeholder, divider, ...rest }) {
  return (
    <View style={[s.field, divider && s.fieldDivider]}>
      <Text style={s.label}>{label}</Text>
      <TextInput
        style={s.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#B0A898"
        {...rest}
      />
    </View>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: theme.bg },
  scroll:  { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },

  sectionHeader: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase',
    color: theme.muted, marginTop: 20, marginBottom: 8, marginLeft: 2,
  },

  card: {
    backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 4,
  },
  dangerCard: { borderColor: '#EEC0C0', borderLeftWidth: 3, borderLeftColor: theme.danger },

  field:        { padding: 14 },
  fieldDivider: { borderTopWidth: 1, borderTopColor: theme.border },
  label:        { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: theme.muted, marginBottom: 6 },
  input:        {
    backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border,
    borderRadius: 4, paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 15, color: theme.text,
  },

  rateNote:     { padding: 14, paddingTop: 0 },
  rateNoteText: { fontSize: 12, color: theme.muted, lineHeight: 18 },

  btnSave:     { backgroundColor: theme.navy, borderRadius: 4, paddingVertical: 14, alignItems: 'center', marginTop: 16 },
  btnSaved:    { backgroundColor: theme.success },
  btnSaveText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },

  dangerRow:   { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  dangerTitle: { fontSize: 14, fontWeight: '700', color: theme.danger },
  dangerSub:   { fontSize: 12, color: theme.muted, marginTop: 2 },
  btnDanger:   { borderWidth: 1.5, borderColor: theme.danger, borderRadius: 4, paddingHorizontal: 16, paddingVertical: 9 },
  btnDangerText: { color: theme.danger, fontWeight: '700', fontSize: 13 },

  version: { textAlign: 'center', fontSize: 12, color: theme.muted, marginTop: 24 },
});
