import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../AppContext';
import { theme } from '../theme';
import { uid, today, num, isValidDate } from '../utils';

const CATEGORIES = [
  'Client Visit', 'Site Inspection', 'Delivery / Collection',
  'Meeting', 'Training', 'Airport / Transport', 'Other Business',
];

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function AddEntryScreen({ navigation }) {
  const [tab, setTab] = useState('trip'); // 'trip' | 'fuel'

  return (
    <SafeAreaView style={s.safe} edges={['bottom']}>
      {/* Segment */}
      <View style={s.segWrap}>
        <View style={s.seg}>
          <TouchableOpacity style={[s.segBtn, tab === 'trip' && s.segBtnActive]} onPress={() => setTab('trip')}>
            <Text style={[s.segText, tab === 'trip' && s.segTextActive]}>🚗  Business Trip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.segBtn, tab === 'fuel' && s.segBtnActive]} onPress={() => setTab('fuel')}>
            <Text style={[s.segText, tab === 'fuel' && s.segTextActive]}>⛽  Fuel Fill-up</Text>
          </TouchableOpacity>
        </View>
      </View>

      {tab === 'trip'
        ? <TripForm   navigation={navigation} />
        : <FuelForm   navigation={navigation} />
      }
    </SafeAreaView>
  );
}

// ─── Trip Form ────────────────────────────────────────────────────────────────
function TripForm({ navigation }) {
  const { addEntry } = useApp();

  const [date,     setDate]     = useState(today());
  const [purpose,  setPurpose]  = useState('');
  const [manual,   setManual]   = useState(false);
  const [odoStart, setOdoStart] = useState('');
  const [odoEnd,   setOdoEnd]   = useState('');
  const [manualKm, setManualKm] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [notes,    setNotes]    = useState('');
  const [catModal, setCatModal] = useState(false);

  const derivedKm = manual
    ? num(manualKm)
    : num(odoEnd) - num(odoStart);

  const save = () => {
    if (!isValidDate(date)) {
      Alert.alert('Invalid date', 'Enter the date as YYYY-MM-DD, e.g. 2026-03-18.'); return;
    }
    if (!purpose.trim()) {
      Alert.alert('Required', 'Please fill in the trip purpose.'); return;
    }
    if (!manual && (!odoStart || !odoEnd)) {
      Alert.alert('Required', 'Enter start and end odometer readings.'); return;
    }
    if (!manual && derivedKm <= 0) {
      Alert.alert('Invalid', 'End odometer must be greater than start.'); return;
    }
    if (manual && derivedKm <= 0) {
      Alert.alert('Required', 'Enter a valid distance.'); return;
    }

    addEntry({
      id: uid(), type: 'trip',
      date, purpose: purpose.trim(), category, notes: notes.trim(),
      km: derivedKm, manualKm: manual,
      startOdo: manual ? null : num(odoStart),
      endOdo:   manual ? null : num(odoEnd),
    });

    Alert.alert('✓ Saved', 'Trip has been logged.', [
      { text: 'Add Another', onPress: () => {} },
      { text: 'Dashboard',   onPress: () => navigation.navigate('Dashboard'), style: 'cancel' },
    ]);
    // Reset
    setPurpose(''); setOdoStart(''); setOdoEnd(''); setManualKm(''); setNotes('');
  };

  return (
    <>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        <Row label="Date">
          <TextInput style={s.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        </Row>

        <Row label="Trip Purpose / Description">
          <TextInput style={s.input} value={purpose} onChangeText={setPurpose}
            placeholder="e.g. Client meeting - Sandton City" />
        </Row>

        {/* Odometer toggle */}
        <TouchableOpacity style={s.toggleRow} onPress={() => setManual(!manual)}>
          <View style={[s.checkbox, manual && s.checkboxOn]}>
            {manual && <Text style={s.checkmark}>✓</Text>}
          </View>
          <Text style={s.toggleLabel}>Enter distance manually (no odometer)</Text>
        </TouchableOpacity>

        {manual ? (
          <Row label="Distance (km)">
            <TextInput style={s.input} value={manualKm} onChangeText={setManualKm}
              keyboardType="decimal-pad" placeholder="e.g. 42.5" />
          </Row>
        ) : (
          <View style={s.twoCol}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Start Odometer (km)</Text>
              <TextInput style={s.input} value={odoStart} onChangeText={setOdoStart}
                keyboardType="numeric" placeholder="e.g. 85 420" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>End Odometer (km)</Text>
              <TextInput style={s.input} value={odoEnd} onChangeText={setOdoEnd}
                keyboardType="numeric" placeholder="e.g. 85 468" />
            </View>
          </View>
        )}

        {derivedKm > 0 && (
          <View style={s.calcInfo}>
            <Text style={s.calcInfoText}>📍 Distance: {derivedKm.toFixed(1)} km</Text>
          </View>
        )}

        <Row label="Category">
          <TouchableOpacity style={[s.input, s.picker]} onPress={() => setCatModal(true)}>
            <Text style={s.pickerText}>{category}</Text>
            <Text style={{ color: theme.muted }}>▾</Text>
          </TouchableOpacity>
        </Row>

        <Row label="Notes (optional)">
          <TextInput style={s.input} value={notes} onChangeText={setNotes}
            placeholder="Any additional notes…" />
        </Row>

      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.btnOutline} onPress={() => navigation.navigate('Dashboard')}>
          <Text style={s.btnOutlineText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnPrimary} onPress={save}>
          <Text style={s.btnPrimaryText}>Save Trip</Text>
        </TouchableOpacity>
      </View>

      {/* Category picker modal */}
      <Modal visible={catModal} transparent animationType="fade" onRequestClose={() => setCatModal(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setCatModal(false)}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Select Category</Text>
            {CATEGORIES.map(c => (
              <TouchableOpacity key={c} style={[s.modalOpt, c === category && s.modalOptActive]}
                onPress={() => { setCategory(c); setCatModal(false); }}>
                <Text style={[s.modalOptText, c === category && s.modalOptTextActive]}>{c}</Text>
                {c === category && <Text style={{ color: theme.amber }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ─── Fuel Form ────────────────────────────────────────
function FuelForm({ navigation }) {
  const { addEntry } = useApp();

  const [date,      setDate]      = useState(today());
  const [station,   setStation]   = useState('');
  const [litres,    setLitres]    = useState('');
  const [ppl,       setPpl]       = useState('');
  const [total,     setTotal]     = useState('');

  // Auto-calculate total
  const handleLitres = (v) => {
    setLitres(v);
    const t = num(v) * num(ppl);
    if (t > 0) setTotal(t.toFixed(2));
  };
  const handlePpl = (v) => {
    setPpl(v);
    const t = num(litres) * num(v);
    if (t > 0) setTotal(t.toFixed(2));
  };
  const handleTotal = (v) => {
    setTotal(v);
    if (num(litres) > 0 && num(v) > 0) setPpl((num(v) / num(litres)).toFixed(3));
  };

  const derivedTotal = num(total) || num(litres) * num(ppl);

  const save = () => {
    if (!isValidDate(date)) {
      Alert.alert('Invalid date', 'Enter the date as YYYY-MM-DD, e.g. 2026-03-18.'); return;
    }
    if (num(litres) <= 0) {
      Alert.alert('Required', 'Enter the litres filled.'); return;
    }
    const finalTotal = derivedTotal;
    if (!(finalTotal > 0)) {
      Alert.alert('Required', 'Enter price per litre or total cost.'); return;
    }
    addEntry({
      id: uid(), type: 'fuel',
      date, station: station.trim(),
      litres:        num(litres),
      pricePerLitre: num(ppl) || finalTotal / num(litres),
      totalCost:     finalTotal,
    });
    Alert.alert('✓ Saved', 'Fuel fill-up has been logged.', [
      { text: 'Add Another', onPress: () => {} },
      { text: 'Dashboard',   onPress: () => navigation.navigate('Dashboard'), style: 'cancel' },
    ]);
    setStation(''); setLitres(''); setPpl(''); setTotal('');
  };

  return (
    <>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        <Row label="Date">
          <TextInput style={s.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        </Row>

        <Row label="Filling Station (optional)">
          <TextInput style={s.input} value={station} onChangeText={setStation}
            placeholder="e.g. Engen Bryanston" />
        </Row>

        <View style={s.threeCol}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Litres</Text>
            <TextInput style={s.input} value={litres} onChangeText={handleLitres}
              keyboardType="decimal-pad" placeholder="e.g. 40.50" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Price/Litre (R)</Text>
            <TextInput style={s.input} value={ppl} onChangeText={handlePpl}
              keyboardType="decimal-pad" placeholder="e.g. 23.10" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Total (R)</Text>
            <TextInput style={s.input} value={total} onChangeText={handleTotal}
              keyboardType="decimal-pad" placeholder="Auto" />
          </View>
        </View>

        {derivedTotal > 0 && (
          <View style={s.calcInfo}>
            <Text style={s.calcInfoText}>💰 Total: R {derivedTotal.toFixed(2)}</Text>
          </View>
        )}

      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.btnOutline} onPress={() => navigation.navigate('Dashboard')}>
          <Text style={s.btnOutlineText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btnPrimary, { backgroundColor: theme.amber }]} onPress={save}>
          <Text style={s.btnPrimaryText}>Save Fill-up</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function Row({ label, children }) {
  return (
    <View style={s.formGroup}>
      <Text style={s.label}>{label}</Text>
      {children}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: theme.bg },
  scroll:  { flex: 1 },
  content: { padding: 16, paddingBottom: 20 },

  segWrap: { backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border, padding: 12 },
  seg:     { flexDirection: 'row', backgroundColor: theme.bg, borderRadius: 4, padding: 3, borderWidth: 1, borderColor: theme.border },
  segBtn:  { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 3 },
  segBtnActive: { backgroundColor: theme.card, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
  segText: { fontSize: 14, fontWeight: '600', color: theme.muted },
  segTextActive: { color: theme.navy, fontWeight: '700' },

  formGroup: { marginBottom: 14 },
  label:     { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: theme.muted, marginBottom: 5 },
  input:     {
    backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border,
    borderRadius: 4, paddingHorizontal: 12, paddingVertical: 11,
    fontSize: 15, color: theme.text,
  },

  toggleRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 10 },
  checkbox:   { width: 20, height: 20, borderRadius: 3, borderWidth: 2, borderColor: theme.muted, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: theme.navy, borderColor: theme.navy },
  checkmark:  { color: '#fff', fontSize: 13, fontWeight: '700' },
  toggleLabel:{ fontSize: 14, color: theme.text },

  twoCol:   { flexDirection: 'row', gap: 10, marginBottom: 14 },
  threeCol: { flexDirection: 'row', gap: 8, marginBottom: 14 },

  calcInfo:     { backgroundColor: '#EBF5FF', borderWidth: 1, borderColor: '#B3D4F8', borderRadius: 4, padding: 10, marginBottom: 14 },
  calcInfoText: { fontSize: 13, fontWeight: '700', color: '#1A56DB' },

  picker:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerText: { fontSize: 15, color: theme.text },

  footer:        { flexDirection: 'row', gap: 10, padding: 14, backgroundColor: theme.card, borderTopWidth: 1, borderTopColor: theme.border },
  btnPrimary:    { flex: 1, backgroundColor: theme.navy, borderRadius: 4, paddingVertical: 13, alignItems: 'center' },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14, letterSpacing: 0.4 },
  btnOutline:    { flex: 0.55, borderWidth: 1.5, borderColor: theme.border, borderRadius: 4, paddingVertical: 13, alignItems: 'center' },
  btnOutlineText: { color: theme.text, fontWeight: '700', fontSize: 14 },

  modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  modalBox:           { backgroundColor: theme.card, borderRadius: 8, width: '80%', padding: 4 },
  modalTitle:         { fontSize: 14, fontWeight: '700', color: theme.navy, padding: 14, paddingBottom: 8 },
  modalOpt:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, borderTopWidth: 1, borderTopColor: theme.border },
  modalOptActive:     { backgroundColor: '#F0F4FF' },
  modalOptText:       { fontSize: 14, color: theme.text },
  modalOptTextActive: { fontWeight: '700', color: theme.navy },
});
