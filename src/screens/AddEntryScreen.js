import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../AppContext';
import { colors } from '../theme';
import { uid, today, num, isValidDate } from '../utils';
import { Group, Row, Button, SectionTitle, screen } from '../components/ui';
import { InlineField, StackedField, SwitchRow, ResultRow } from '../components/Field';
import { OptionSheet } from '../components/MonthPicker';

const CATEGORIES = [
  'Client Visit', 'Site Inspection', 'Delivery / Collection',
  'Meeting', 'Training', 'Airport / Transport', 'Other Business',
];

// Opened from the tab bar to add an entry, or from the Monthly Log / Dashboard with
// `route.params.edit` set to an existing entry to edit it in the same form.
export default function AddEntryScreen({ navigation, route }) {
  const editing = route.params?.edit || null;
  const [tab, setTab] = useState('trip'); // 'trip' | 'fuel'
  const type = editing ? editing.type : tab;

  // Leaving the screen ends an edit so the tab opens on a fresh form next time.
  useEffect(() => {
    if (!editing) return undefined;
    return navigation.addListener('blur', () => navigation.setParams({ edit: undefined }));
  }, [navigation, editing]);

  const finishEdit = () => {
    navigation.setParams({ edit: undefined });
    navigation.navigate('Log');
  };

  return (
    <SafeAreaView style={screen.safe} edges={['bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={screen.scroll} contentContainerStyle={screen.content} keyboardShouldPersistTaps="handled">
          {!editing && (
            <View style={s.segment}>
              {[['trip', 'Business trip'], ['fuel', 'Fuel fill-up']].map(([key, label]) => (
                <TouchableOpacity key={key} style={[s.segmentBtn, tab === key && s.segmentBtnActive]} onPress={() => setTab(key)} accessibilityRole="button">
                  <Text style={[s.segmentText, tab === key && s.segmentTextActive]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {type === 'trip'
            ? <TripForm key={editing ? editing.id : 'new'} navigation={navigation} editing={editing} finishEdit={finishEdit} />
            : <FuelForm key={editing ? editing.id : 'new'} navigation={navigation} editing={editing} finishEdit={finishEdit} />
          }
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function useDelete(editing, finishEdit) {
  const { deleteEntry } = useApp();
  return () => {
    Alert.alert('Delete this entry?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => { deleteEntry(editing.id); finishEdit(); } },
    ]);
  };
}

// --- Trip form ---------------------------------------------------------------
function TripForm({ navigation, editing, finishEdit }) {
  const { addEntry, updateEntry } = useApp();
  const e = editing || {};

  const [date,     setDate]     = useState(e.date || today());
  const [purpose,  setPurpose]  = useState(e.purpose || '');
  const [manual,   setManual]   = useState(!!e.manualKm);
  const [odoStart, setOdoStart] = useState(e.startOdo != null ? String(e.startOdo) : '');
  const [odoEnd,   setOdoEnd]   = useState(e.endOdo != null ? String(e.endOdo) : '');
  const [manualKm, setManualKm] = useState(e.manualKm && e.km != null ? String(e.km) : '');
  const [category, setCategory] = useState(e.category || CATEGORIES[0]);
  const [notes,    setNotes]    = useState(e.notes || '');
  const [catSheet, setCatSheet] = useState(false);
  const confirmDelete = useDelete(editing, finishEdit);

  const derivedKm = manual
    ? num(manualKm)
    : (odoStart && odoEnd ? num(odoEnd) - num(odoStart) : 0);

  const save = () => {
    if (!isValidDate(date)) {
      Alert.alert('Check the date', 'Enter the date as YYYY-MM-DD, for example 2026-03-18.'); return;
    }
    if (!purpose.trim()) {
      Alert.alert('Purpose needed', 'Describe the trip, for example "Client meeting - Sandton".'); return;
    }
    if (!manual && (!odoStart || !odoEnd)) {
      Alert.alert('Odometer needed', 'Enter both the start and end odometer readings.'); return;
    }
    if (derivedKm <= 0) {
      Alert.alert('Check the distance', manual ? 'Enter a distance greater than zero.' : 'The end reading must be greater than the start reading.'); return;
    }

    const entry = {
      id: editing ? editing.id : uid(), type: 'trip',
      date, purpose: purpose.trim(), category, notes: notes.trim(),
      km: derivedKm, manualKm: manual,
      startOdo: manual ? null : num(odoStart),
      endOdo:   manual ? null : num(odoEnd),
    };

    if (editing) {
      updateEntry(entry);
      finishEdit();
      return;
    }

    addEntry(entry);
    setPurpose(''); setOdoStart(''); setOdoEnd(''); setManualKm(''); setNotes('');
    Alert.alert('Trip saved', `${entry.km.toFixed(1)} km added to ${date.slice(0, 7) === today().slice(0, 7) ? 'this month' : 'the log'}.`, [
      { text: 'Add another' },
      { text: 'View log', onPress: () => navigation.navigate('Log') },
    ]);
  };

  return (
    <>
      <Group>
        <InlineField label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />
        <StackedField label="Purpose" value={purpose} onChangeText={setPurpose} placeholder="Client meeting - Sandton City" />
        <Row label="Category" value={category} onPress={() => setCatSheet(true)} />
      </Group>

      <SectionTitle>Distance</SectionTitle>
      <Group>
        <SwitchRow label="Enter distance manually" value={manual} onValueChange={setManual} />
        {manual ? (
          <InlineField label="Distance" value={manualKm} onChangeText={setManualKm} placeholder="0.0" keyboardType="decimal-pad" unit="km" />
        ) : (
          <>
            <InlineField label="Start odometer" value={odoStart} onChangeText={setOdoStart} placeholder="85 420" keyboardType="numeric" unit="km" />
            <InlineField label="End odometer" value={odoEnd} onChangeText={setOdoEnd} placeholder="85 458" keyboardType="numeric" unit="km" />
          </>
        )}
        {derivedKm > 0 && <ResultRow label="Trip distance" value={`${derivedKm.toFixed(1)} km`} />}
      </Group>

      <SectionTitle>Notes</SectionTitle>
      <Group>
        <StackedField label="Optional" value={notes} onChangeText={setNotes} placeholder="Anything worth remembering about this trip" multiline />
      </Group>

      <View style={s.footer}>
        <Button title={editing ? 'Save changes' : 'Save trip'} onPress={save} />
        {editing && <Button title="Delete trip" kind="destructive" onPress={confirmDelete} />}
        {editing && <Button title="Cancel" kind="secondary" onPress={finishEdit} />}
      </View>

      <OptionSheet visible={catSheet} title="Category" options={CATEGORIES} value={category}
        onSelect={c => { setCategory(c); setCatSheet(false); }} onClose={() => setCatSheet(false)} />
    </>
  );
}

// --- Fuel form ---------------------------------------------------------------
function FuelForm({ navigation, editing, finishEdit }) {
  const { addEntry, updateEntry } = useApp();
  const e = editing || {};

  const [date,    setDate]    = useState(e.date || today());
  const [station, setStation] = useState(e.station || '');
  const [litres,  setLitres]  = useState(e.litres != null ? String(e.litres) : '');
  const [ppl,     setPpl]     = useState(e.pricePerLitre != null ? (+e.pricePerLitre).toFixed(2) : '');
  const [total,   setTotal]   = useState(e.totalCost != null ? (+e.totalCost).toFixed(2) : '');
  const confirmDelete = useDelete(editing, finishEdit);

  // Typing any two of litres, price and total fills in the third.
  const handleLitres = (v) => { setLitres(v); const t = num(v) * num(ppl); if (t > 0) setTotal(t.toFixed(2)); };
  const handlePpl    = (v) => { setPpl(v);    const t = num(litres) * num(v); if (t > 0) setTotal(t.toFixed(2)); };
  const handleTotal  = (v) => { setTotal(v);  if (num(litres) > 0 && num(v) > 0) setPpl((num(v) / num(litres)).toFixed(2)); };

  const derivedTotal = num(total) || num(litres) * num(ppl);

  const save = () => {
    if (!isValidDate(date)) {
      Alert.alert('Check the date', 'Enter the date as YYYY-MM-DD, for example 2026-03-18.'); return;
    }
    if (num(litres) <= 0) {
      Alert.alert('Litres needed', 'Enter how many litres were filled.'); return;
    }
    if (!(derivedTotal > 0)) {
      Alert.alert('Price needed', 'Enter the price per litre or the total paid.'); return;
    }
    const entry = {
      id: editing ? editing.id : uid(), type: 'fuel',
      date, station: station.trim(),
      litres:        num(litres),
      pricePerLitre: num(ppl) || derivedTotal / num(litres),
      totalCost:     derivedTotal,
    };

    if (editing) {
      updateEntry(entry);
      finishEdit();
      return;
    }

    addEntry(entry);
    setStation(''); setLitres(''); setPpl(''); setTotal('');
    Alert.alert('Fill-up saved', `R ${entry.totalCost.toFixed(2)} added to the log.`, [
      { text: 'Add another' },
      { text: 'View log', onPress: () => navigation.navigate('Log') },
    ]);
  };

  return (
    <>
      <Group>
        <InlineField label="Date" value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />
        <StackedField label="Filling station (optional)" value={station} onChangeText={setStation} placeholder="Engen Bryanston" />
      </Group>

      <SectionTitle>Fuel</SectionTitle>
      <Group>
        <InlineField label="Litres" value={litres} onChangeText={handleLitres} placeholder="0.00" keyboardType="decimal-pad" unit="L" />
        <InlineField label="Price per litre" value={ppl} onChangeText={handlePpl} placeholder="0.00" keyboardType="decimal-pad" prefix="R" />
        <InlineField label="Total paid" value={total} onChangeText={handleTotal} placeholder="0.00" keyboardType="decimal-pad" prefix="R" />
        {derivedTotal > 0 && <ResultRow label="Fuel cost" value={`R ${derivedTotal.toFixed(2)}`} />}
      </Group>

      <View style={s.footer}>
        <Button title={editing ? 'Save changes' : 'Save fill-up'} onPress={save} />
        {editing && <Button title="Delete fill-up" kind="destructive" onPress={confirmDelete} />}
        {editing && <Button title="Cancel" kind="secondary" onPress={finishEdit} />}
      </View>
    </>
  );
}

const s = StyleSheet.create({
  segment:          { flexDirection: 'row', backgroundColor: '#E6E6EA', borderRadius: 9, padding: 2, marginBottom: 16 },
  segmentBtn:       { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 7 },
  segmentBtnActive: { backgroundColor: colors.surface, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  segmentText:      { fontSize: 14, fontWeight: '500', color: colors.text2 },
  segmentTextActive:{ color: colors.text, fontWeight: '600' },
  footer:           { marginTop: 24, gap: 10 },
});
