import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import { theme, card } from '../theme';
import Constants from 'expo-constants';
import { num, DEFAULT_RATE } from '../utils';

const APP_VERSION = Constants.expoConfig?.version || '2.0.0';

export default function SettingsScreen({ navigation }) {
  const { settings, updateSettings, clearAll, loadDemoData, entries } = useApp();

  const [name,    setName]    = useState(settings.employeeName   || '');
  const [company, setCompany] = useState(settings.employerName   || '');
  const [vehicle, setVehicle] = useState(settings.vehicleMake    || '');
  const [reg,     setReg]     = useState(settings.vehicleReg     || '');
  const [rate,    setRate]    = useState(String(settings.ratePerKm || DEFAULT_RATE));
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    setName(settings.employeeName   || '');
    setCompany(settings.employerName || '');
    setVehicle(settings.vehicleMake  || '');
    setReg(settings.vehicleReg       || '');
    setRate(String(settings.ratePerKm || DEFAULT_RATE));
  }, [settings]);

  const save = () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your name.'); return;
    }
    const r = num(rate);
    if (!(r > 0 && r < 1000)) {
      Alert.alert('Invalid rate', `Enter the rate per kilometre as a number, e.g. ${DEFAULT_RATE.toFixed(2)}.`); return;
    }
    updateSettings({
      employeeName:    name.trim(),
      employerName:    company.trim(),
      vehicleMake:     vehicle.trim(),
      vehicleReg:      reg.trim(),
      ratePerKm:       r,
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

  const confirmDemo = () => {
    Alert.alert(
      'Load demo data',
      entries.length
        ? 'This replaces your current entries and profile with three months of sample data. Continue?'
        : 'This fills the app with three months of sample entries and a sample profile so you can try it out.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Load', onPress: () => { loadDemoData(); navigation.navigate('Dashboard'); } },
      ]
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        {/* Profile section */}
        <SectionHeader icon="person-outline" title="Employee profile" />
        <View style={s.card}>
          <Field label="Your Full Name" value={name} onChangeText={setName} placeholder="e.g. Thabo Nkosi" />
          <Field label="Employer / Company" value={company} onChangeText={setCompany} placeholder="e.g. Apex Solutions (Pty) Ltd" divider />
          <Field label="Vehicle Make & Model" value={vehicle} onChangeText={setVehicle} placeholder="e.g. Toyota Corolla Quest" divider />
          <Field label="Vehicle Registration" value={reg} onChangeText={setReg} placeholder="e.g. GP 42 FL" divider />
        </View>

        {/* Rate section */}
        <SectionHeader icon="cash-outline" title="Reimbursement rate" />
        <View style={s.card}>
          <Field
            label="Rate per Kilometre (R)"
            value={rate}
            onChangeText={setRate}
            placeholder="4.28"
            keyboardType="decimal-pad"
          />
          <View style={s.rateNote}>
            <Ionicons name="information-circle-outline" size={16} color={theme.muted} />
            <Text style={s.rateNoteText}>
              The SARS AA rate is R {DEFAULT_RATE.toFixed(2)}/km for private vehicles. Confirm the rate with your employer before submitting claims.
            </Text>
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity style={[s.btnSave, saved && s.btnSaved]} onPress={save}>
          <Ionicons name={saved ? 'checkmark-circle' : 'save-outline'} size={18} color="#fff" />
          <Text style={s.btnSaveText}>{saved ? 'Settings saved' : 'Save settings'}</Text>
        </TouchableOpacity>

        {/* Demo data */}
        <SectionHeader icon="flask-outline" title="Try it out" />
        <View style={s.card}>
          <View style={s.dangerRow}>
            <View style={s.rowIcon}><MaterialCommunityIcons name="database-outline" size={20} color={theme.amber} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.rowTitle}>Load demo data</Text>
              <Text style={s.dangerSub}>Three months of sample trips and fill-ups with a sample profile</Text>
            </View>
            <TouchableOpacity style={s.btnOutline} onPress={confirmDemo}>
              <Text style={s.btnOutlineText}>Load</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Danger zone */}
        <SectionHeader icon="warning-outline" title="Danger zone" danger />
        <View style={[s.card, s.dangerCard]}>
          <View style={s.dangerRow}>
            <View style={[s.rowIcon, { backgroundColor: theme.dangerSoft }]}><Ionicons name="trash-outline" size={20} color={theme.danger} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.dangerTitle}>Clear all data</Text>
              <Text style={s.dangerSub}>Permanently delete all log entries and reset your profile</Text>
            </View>
            <TouchableOpacity style={s.btnDanger} onPress={confirmClear}>
              <Text style={s.btnDangerText}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.version}>FuelLog v{APP_VERSION} · Built for South African business travel</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ icon, title, danger }) {
  const color = danger ? theme.danger : theme.muted;
  return (
    <View style={s.sectionHeader}>
      <Ionicons name={icon} size={14} color={color} />
      <Text style={[s.sectionHeaderText, { color }]}>{title.toUpperCase()}</Text>
    </View>
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
        placeholderTextColor={theme.placeholder}
        {...rest}
      />
    </View>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: theme.bg },
  scroll:  { flex: 1 },
  content: { padding: 16, paddingTop: 4, paddingBottom: 40 },

  sectionHeader:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 20, marginBottom: 8, marginLeft: 4 },
  sectionHeaderText: { fontSize: 11, fontWeight: '700', letterSpacing: 1.2 },

  card:       { ...card },
  dangerCard: { borderColor: '#F0CACA' },

  field:        { padding: 14 },
  fieldDivider: { borderTopWidth: 1, borderTopColor: theme.border },
  label:        { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: theme.muted, marginBottom: 6 },
  input:        {
    backgroundColor: theme.inputBg, borderWidth: 1, borderColor: theme.border,
    borderRadius: theme.radiusSm, paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 16, color: theme.text,
  },

  rateNote:     { flexDirection: 'row', alignItems: 'flex-start', gap: 6, padding: 14, paddingTop: 0 },
  rateNoteText: { flex: 1, fontSize: 12, color: theme.muted, lineHeight: 18 },

  btnSave:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.navy, borderRadius: theme.radiusSm, paddingVertical: 14, marginTop: 16, ...theme.shadow },
  btnSaved:    { backgroundColor: theme.success },
  btnSaveText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.2 },

  dangerRow:   { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  rowIcon:     { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.amberSoft, alignItems: 'center', justifyContent: 'center' },
  rowTitle:    { fontSize: 14, fontWeight: '700', color: theme.navy },
  dangerTitle: { fontSize: 14, fontWeight: '700', color: theme.danger },
  dangerSub:   { fontSize: 12, color: theme.muted, marginTop: 2, lineHeight: 17 },
  btnOutline:  { borderWidth: 1.5, borderColor: theme.navy, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  btnOutlineText: { color: theme.navy, fontWeight: '700', fontSize: 13 },
  btnDanger:   { borderWidth: 1.5, borderColor: theme.danger, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 8 },
  btnDangerText: { color: theme.danger, fontWeight: '700', fontSize: 13 },

  version: { textAlign: 'center', fontSize: 12, color: theme.muted, marginTop: 24 },
});
