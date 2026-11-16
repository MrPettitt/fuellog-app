import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useApp } from '../AppContext';
import { colors } from '../theme';
import { num, DEFAULT_RATE } from '../utils';
import { Group, Row, Button, SectionTitle, screen } from '../components/ui';
import { InlineField } from '../components/Field';

const APP_VERSION = Constants.expoConfig?.version || '2.0.0';

export default function SettingsScreen({ navigation }) {
  const { settings, updateSettings, clearAll, loadDemoData, entries } = useApp();

  const [name,    setName]    = useState(settings.employeeName || '');
  const [company, setCompany] = useState(settings.employerName || '');
  const [vehicle, setVehicle] = useState(settings.vehicleMake  || '');
  const [reg,     setReg]     = useState(settings.vehicleReg   || '');
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
      Alert.alert('Name needed', 'Your name appears on the reimbursement report.'); return;
    }
    const r = num(rate);
    if (!(r > 0 && r < 1000)) {
      Alert.alert('Check the rate', `Enter the rate per kilometre as a number, for example ${DEFAULT_RATE.toFixed(2)}.`); return;
    }
    updateSettings({
      employeeName: name.trim(), employerName: company.trim(),
      vehicleMake: vehicle.trim(), vehicleReg: reg.trim(), ratePerKm: r,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const confirmDemo = () => {
    Alert.alert(
      'Load sample data?',
      entries.length
        ? 'This replaces your entries and profile with three months of sample data.'
        : 'Three months of sample trips and fill-ups will be added so you can look around.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Load', onPress: () => { loadDemoData(); navigation.navigate('Dashboard'); } },
      ]
    );
  };

  const confirmClear = () => {
    Alert.alert('Delete all data?', 'Every entry and your profile will be removed from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete everything', style: 'destructive', onPress: clearAll },
    ]);
  };

  return (
    <SafeAreaView style={screen.safe} edges={['bottom']}>
      <ScrollView style={screen.scroll} contentContainerStyle={screen.content} keyboardShouldPersistTaps="handled">

        <SectionTitle>Profile</SectionTitle>
        <Group>
          <InlineField label="Name"         value={name}    onChangeText={setName}    placeholder="Required" />
          <InlineField label="Employer"     value={company} onChangeText={setCompany} placeholder="Optional" />
          <InlineField label="Vehicle"      value={vehicle} onChangeText={setVehicle} placeholder="Make and model" />
          <InlineField label="Registration" value={reg}     onChangeText={setReg}     placeholder="Optional" />
        </Group>

        <SectionTitle>Reimbursement</SectionTitle>
        <Group>
          <InlineField label="Rate per km" value={rate} onChangeText={setRate} placeholder={DEFAULT_RATE.toFixed(2)} keyboardType="decimal-pad" prefix="R" />
        </Group>
        <Text style={s.note}>
          The SARS AA rate for private vehicles is R {DEFAULT_RATE.toFixed(2)} per km. Use the rate your employer has agreed to.
        </Text>

        <Button title={saved ? 'Saved' : 'Save'} onPress={save} style={{ marginTop: 16 }} />

        <SectionTitle>Data</SectionTitle>
        <Group>
          <Row label="Load sample data" onPress={confirmDemo} />
          <Row label="Delete all data" onPress={confirmClear} destructive />
        </Group>

        <Text style={s.version}>FuelLog {APP_VERSION}</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  note:    { fontSize: 13, color: colors.text2, lineHeight: 18, marginTop: 8, paddingHorizontal: 16 },
  version: { textAlign: 'center', fontSize: 13, color: colors.text3, marginTop: 32 },
});
