import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet,
  Alert, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useApp } from '../AppContext';
import { theme, card } from '../theme';
import { uid, today, num, isValidDate, fmtDate } from '../utils';

const CATEGORIES = [
  'Client Visit', 'Site Inspection', 'Delivery / Collection',
  'Meeting', 'Training', 'Airport / Transport', 'Other Business',
];

// --- Main screen --------------------------------------------------------------
// Opened from the tab bar to add an entry, or from the Monthly Log with
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
    <SafeAreaView style={s.safe} edges={['bottom']}>
      {editing ? (
        <View style={s.editBanner}>
          <Ionicons name="pencil" size={15} color={theme.fuelText} />
          <Text style={s.editBannerText}>
            Editing {editing.type === 'trip' ? 'trip' : 'fill-up'} from {fmtDate(editing.date)}
          </Text>
        </View>
      ) : (
        <View style={s.segWrap}>
          <View style={s.seg}>
            <TouchableOpacity style={[s.segBtn, tab === 'trip' && s.segBtnActive]} onPress={() => setTab('trip')}>
              <MaterialCommunityIcons name="car" size={18} color={tab === 'trip' ? theme.navy : theme.muted} />
              <Text style={[s.segText, tab === 'trip' && s.segTextActive]}>Business trip</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.segBtn, tab === 'fuel' && s.segBtnActive]} onPress={() => setTab('fuel')}>
              <MaterialCommunityIcons name="gas-station" size={18} color={tab === 'fuel' ? theme.navy : theme.muted} />
              <Text style={[s.segText, tab === 'fuel' && s.segTextActive]}>Fuel fill-up</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {type === 'trip'
        ? <TripForm key={editing ? editing.id : 'new'} navigation={navigation} editing={editing} finishEdit={finishEdit} />
        : <FuelForm key={editing ? editing.id : 'new'} navigation={navigation} editing={editing} finishEdit={finishEdit} />
      }
    </SafeAreaView>
  );
}

// --- Trip Form ----------------------------------------------------------------
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
  const [catModal, setCatModal] = useState(false);

  const derivedKm = manual
    ? num(manualKm)
    : (odoStart && odoEnd ? num(odoEnd) - num(odoStart) : 0);

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
      Alert.alert('Updated', 'Trip has been updated.');
      return;
    }

    addEntry(entry);
    Alert.alert('Saved', 'Trip has been logged.', [
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
          <TextInput style={s.input} placeholderTextColor={theme.placeholder} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        </Row>

        <Row label="Trip Purpose / Description">
          <TextInput style={s.input} placeholderTextColor={theme.placeholder} value={purpose} onChangeText={setPurpose}
            placeholder="e.g. Client meeting - Sandton City" />
        </Row>

        {/* Odometer toggle */}
        <TouchableOpacity style={s.toggleRow} onPress={() => setManual(!manual)}>
          <View style={[s.checkbox, manual && s.checkboxOn]}>
            {manual && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={s.toggleLabel}>Enter distance manually (no odometer)</Text>
        </TouchableOpacity>

        {manual ? (
          <Row label="Distance (km)">
            <TextInput style={s.input} placeholderTextColor={theme.placeholder} value={manualKm} onChangeText={setManualKm}
              keyboardType="decimal-pad" placeholder="e.g. 42.5" />
          </Row>
        ) : (
          <View style={s.twoCol}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>Start Odometer (km)</Text>
              <TextInput style={s.input} placeholderTextColor={theme.placeholder} value={odoStart} onChangeText={setOdoStart}
                keyboardType="numeric" placeholder="e.g. 85 420" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>End Odometer (km)</Text>
              <TextInput style={s.input} placeholderTextColor={theme.placeholder} value={odoEnd} onChangeText={setOdoEnd}
                keyboardType="numeric" placeholder="e.g. 85 468" />
            </View>
          </View>
        )}

        {derivedKm > 0 && (
          <View style={s.calcInfo}>
            <Ionicons name="navigate-outline" size={16} color={theme.info} />
            <Text style={s.calcInfoText}>Distance: {derivedKm.toFixed(1)} km</Text>
          </View>
        )}

        <Row label="Category">
          <TouchableOpacity style={[s.input, s.picker]} onPress={() => setCatModal(true)}>
            <Text style={s.pickerText}>{category}</Text>
            <Ionicons name="chevron-down" size={16} color={theme.muted} />
          </TouchableOpacity>
        </Row>

        <Row label="Notes (optional)">
          <TextInput style={s.input} placeholderTextColor={theme.placeholder} value={notes} onChangeText={setNotes}
            placeholder="Any additional notes" />
        </Row>

      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.btnOutline} onPress={() => (editing ? finishEdit() : navigation.navigate('Dashboard'))}>
          <Text style={s.btnOutlineText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.btnPrimary} onPress={save}>
          <Text style={s.btnPrimaryText}>{editing ? 'Update Trip' : 'Save Trip'}</Text>
        </TouchableOpacity>
      </View>

      {/* Category picker modal */}
      <Modal visible={catModal} transparent animationType="fade" onRequestClose={() => setCatModal(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setCatModal(false)}>
          <View style={s.modalBox}>
            <View style={s.modalHandle} />
            <Text style={s.modalTitle}>Select category</Text>
            {CATEGORIES.map(c => (
              <TouchableOpacity key={c} style={[s.modalOpt, c === category && s.modalOptActive]}
                onPress={() => { setCategory(c); setCatModal(false); }}>
                <Text style={[s.modalOptText, c === category && s.modalOptTextActive]}>{c}</Text>
                {c === category && <Ionicons name="checkmark-circle" size={20} color={theme.amber} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// --- Fuel Form ----------------------------------------
function FuelForm({ navigation, editing, finishEdit }) {
  const { addEntry, updateEntry } = useApp();
  const e = editing || {};

  const [date,      setDate]      = useState(e.date || today());
  const [station,   setStation]   = useState(e.station || '');
  const [litres,    setLitres]    = useState(e.litres != null ? String(e.litres) : '');
  const [ppl,       setPpl]       = useState(e.pricePerLitre != null ? (+e.pricePerLitre).toFixed(3) : '');
  const [total,     setTotal]     = useState(e.totalCost != null ? (+e.totalCost).toFixed(2) : '');

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
    const entry = {
      id: editing ? editing.id : uid(), type: 'fuel',
      date, station: station.trim(),
      litres:        num(litres),
      pricePerLitre: num(ppl) || finalTotal / num(litres),
      totalCost:     finalTotal,
    };

    if (editing) {
      updateEntry(entry);
      finishEdit();
      Alert.alert('Updated', 'Fuel fill-up has been updated.');
      return;
    }

    addEntry(entry);
    Alert.alert('Saved', 'Fuel fill-up has been logged.', [
      { text: 'Add Another', onPress: () => {} },
      { text: 'Dashboard',   onPress: () => navigation.navigate('Dashboard'), style: 'cancel' },
    ]);
    setStation(''); setLitres(''); setPpl(''); setTotal('');
  };

  return (
    <>
      <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

        <Row label="Date">
          <TextInput style={s.input} placeholderTextColor={theme.placeholder} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" />
        </Row>

        <Row label="Filling Station (optional)">
          <TextInput style={s.input} placeholderTextColor={theme.placeholder} value={station} onChangeText={setStation}
            placeholder="e.g. Engen Bryanston" />
        </Row>

        <View style={s.threeCol}>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Litres</Text>
            <TextInput style={s.input} placeholderTextColor={theme.placeholder} value={litres} onChangeText={handleLitres}
              keyboardType="decimal-pad" placeholder="e.g. 40.50" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Price/Litre (R)</Text>
            <TextInput style={s.input} placeholderTextColor={theme.placeholder} value={ppl} onChangeText={handlePpl}
              keyboardType="decimal-pad" placeholder="e.g. 23.10" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.label}>Total (R)</Text>
            <TextInput style={s.input} placeholderTextColor={theme.placeholder} value={total} onChangeText={handleTotal}
              keyboardType="decimal-pad" placeholder="Auto" />
          </View>
        </View>

        {derivedTotal > 0 && (
          <View style={s.calcInfo}>
            <Ionicons name="cash-outline" size={16} color={theme.info} />
            <Text style={s.calcInfoText}>Total: R {derivedTotal.toFixed(2)}</Text>
          </View>
        )}

      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity style={s.btnOutline} onPress={() => (editing ? finishEdit() : navigation.navigate('Dashboard'))}>
          <Text style={s.btnOutlineText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.btnPrimary, { backgroundColor: theme.amber }]} onPress={save}>
          <Text style={s.btnPrimaryText}>{editing ? 'Update Fill-up' : 'Save Fill-up'}</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

// --- Shared helpers -----------------------------------------------------------
function Row({ label, children }) {
  return (
    <View style={s.formGroup}>
      <Text style={s.label}>{label}</Text>
      {children}
    </View>
  );
}

// --- Styles -----------------------------------------------------------------
const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: theme.bg },
  scroll:  { flex: 1 },
  content: { padding: 16, paddingBottom: 24 },

  segWrap: { backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border, padding: 12 },
  seg:     { flexDirection: 'row', backgroundColor: theme.bg, borderRadius: 999, padding: 4 },
  segBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 10, borderRadius: 999 },
  segBtnActive: { backgroundColor: theme.card, ...theme.shadow },
  segText: { fontSize: 14, fontWeight: '600', color: theme.muted },
  segTextActive: { color: theme.navy, fontWeight: '700' },
  editBanner:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.amberSoft, borderBottomWidth: 1, borderBottomColor: '#F3D9A4', paddingHorizontal: 16, paddingVertical: 12 },
  editBannerText: { fontSize: 13, fontWeight: '700', color: theme.fuelText },

  formGroup: { marginBottom: 16 },
  label:     { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase', color: theme.muted, marginBottom: 6 },
  input:     {
    backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border,
    borderRadius: theme.radiusSm, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, color: theme.text,
  },

  toggleRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 10 },
  checkbox:   { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: theme.muted, alignItems: 'center', justifyContent: 'center' },
  checkboxOn: { backgroundColor: theme.navy, borderColor: theme.navy },
  toggleLabel:{ fontSize: 14, color: theme.text },

  twoCol:   { flexDirection: 'row', gap: 10, marginBottom: 16 },
  threeCol: { flexDirection: 'row', gap: 8, marginBottom: 16 },

  calcInfo:     { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.infoSoft, borderRadius: theme.radiusSm, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16 },
  calcInfoText: { fontSize: 14, fontWeight: '700', color: theme.info },

  picker:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerText: { fontSize: 16, color: theme.text },

  footer:        { flexDirection: 'row', gap: 10, padding: 14, backgroundColor: theme.card, borderTopWidth: 1, borderTopColor: theme.border },
  btnPrimary:    { flex: 1, backgroundColor: theme.navy, borderRadius: theme.radiusSm, paddingVertical: 14, alignItems: 'center', ...theme.shadow },
  btnPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 15, letterSpacing: 0.2 },
  btnOutline:    { flex: 0.5, borderWidth: 1.5, borderColor: theme.border, borderRadius: theme.radiusSm, paddingVertical: 14, alignItems: 'center', backgroundColor: theme.card },
  btnOutlineText: { color: theme.text, fontWeight: '700', fontSize: 15 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(11,31,58,0.45)', justifyContent: 'flex-end' },
  modalBox:     { backgroundColor: theme.card, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 8, paddingBottom: 24, ...theme.shadowStrong },
  modalHandle:  { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: theme.border, marginTop: 10, marginBottom: 6 },
  modalTitle:   { fontSize: 13, fontWeight: '700', color: theme.muted, letterSpacing: 1, textTransform: 'uppercase', paddingHorizontal: 12, paddingVertical: 10 },
  modalOpt:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 14, borderRadius: theme.radiusSm, marginHorizontal: 4 },
  modalOptActive:     { backgroundColor: theme.amberSoft },
  modalOptText:       { fontSize: 16, color: theme.text },
  modalOptTextActive: { fontWeight: '700', color: theme.navy },
});
