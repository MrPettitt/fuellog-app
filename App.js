import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen  from './src/screens/DashboardScreen';
import AddEntryScreen   from './src/screens/AddEntryScreen';
import MonthlyLogScreen from './src/screens/MonthlyLogScreen';
import SummaryScreen    from './src/screens/SummaryScreen';
import SettingsScreen   from './src/screens/SettingsScreen';

import { demoEntries, demoSettings, blankSettings } from './src/utils';
import { loadData, saveData } from './src/storage';
import { theme } from './src/theme';
import { AppContext } from './src/AppContext';

const Tab = createBottomTabNavigator();

const ICONS = {
  Dashboard:    ['home',          'home-outline'],
  'Add Entry':  ['add-circle',    'add-circle-outline'],
  'Log':        ['list',          'list-outline'],
  Summary:      ['document-text', 'document-text-outline'],
  Settings:     ['settings',      'settings-outline'],
};

export default function App() {
  const [entries,  setEntries]  = useState([]);
  const [settings, setSettings] = useState(blankSettings);
  const [loaded,   setLoaded]   = useState(false);

  // Latest values for writes, so two quick actions never save stale state.
  const latest = useRef({ entries: [], settings: blankSettings });
  // Turned off when storage could not be read, so we never overwrite data we failed to load.
  const canSave = useRef(true);

  // ── Load from storage ──
  useEffect(() => {
    (async () => {
      const res = await loadData();
      if (res.status === 'ok') {
        latest.current = { entries: res.entries, settings: { ...blankSettings, ...res.settings } };
      } else if (res.status === 'unavailable') {
        canSave.current = false;
        Alert.alert(
          'Storage unavailable',
          'FuelLog could not read its saved data, so nothing will be saved this session. Your existing data has not been changed. Restart the app to try again.',
        );
      } else if (res.status === 'corrupt') {
        Alert.alert(
          'Saved data could not be read',
          'A copy of the unreadable data was kept on this device. You are starting with an empty log.',
        );
      }
      // 'empty' = first run: start blank (demo data is opt-in from Settings).
      setEntries(latest.current.entries);
      setSettings(latest.current.settings);
      setLoaded(true);
    })();
  }, []);

  const commit = useCallback((nextEntries, nextSettings) => {
    latest.current = { entries: nextEntries, settings: nextSettings };
    setEntries(nextEntries);
    setSettings(nextSettings);
    if (!canSave.current) return;
    saveData(nextEntries, nextSettings).then(ok => {
      if (!ok) Alert.alert('Could not save', 'Your last change was not saved to this device. Check free storage and try again.');
    });
  }, []);

  const addEntry = (entry) => commit([...latest.current.entries, entry], latest.current.settings);

  const updateEntry = (entry) => commit(
    latest.current.entries.map(e => (e.id === entry.id ? entry : e)),
    latest.current.settings,
  );

  const deleteEntry = (id) => commit(
    latest.current.entries.filter(e => e.id !== id),
    latest.current.settings,
  );

  const updateSettings = (s) => commit(latest.current.entries, s);

  const loadDemo = () => commit(demoEntries, demoSettings);

  const clearAll = () => commit([], { ...blankSettings });

  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.navy }}>
        <ActivityIndicator color={theme.amber} size="large" />
      </View>
    );
  }

  return (
    <AppContext.Provider value={{ entries, settings, addEntry, updateEntry, deleteEntry, updateSettings, loadDemo, clearAll }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerStyle:      { backgroundColor: theme.navy },
              headerTintColor:  '#fff',
              headerTitleStyle: { fontWeight: '700', letterSpacing: 0.5 },
              tabBarActiveTintColor:   theme.amber,
              tabBarInactiveTintColor: '#999',
              tabBarStyle: { borderTopColor: '#DDD9CF', backgroundColor: '#fff', paddingBottom: 4 },
              tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
              tabBarIcon: ({ focused, color, size }) => {
                const [on, off] = ICONS[route.name] || ['ellipse', 'ellipse-outline'];
                return <Ionicons name={focused ? on : off} size={size} color={color} />;
              },
            })}
          >
            <Tab.Screen name="Dashboard"  component={DashboardScreen}  options={{ title: 'Dashboard' }} />
            <Tab.Screen name="Add Entry"  component={AddEntryScreen}   options={{ title: 'New Entry' }} />
            <Tab.Screen name="Log"        component={MonthlyLogScreen} options={{ title: 'Monthly Log' }} />
            <Tab.Screen name="Summary"    component={SummaryScreen}    options={{ title: 'Summary' }} />
            <Tab.Screen name="Settings"   component={SettingsScreen}   options={{ title: 'Settings' }} />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </AppContext.Provider>
  );
}
