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

  // Latest state, so saves never write a stale snapshot. `canWrite` stays false
  // when storage is unavailable, so we never clobber data we could not read.
  const latest   = useRef({ entries: [], settings: blankSettings });
  const canWrite = useRef(false);
  latest.current = { entries, settings };

  // -- Load from storage --
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const d = await loadData();
      if (cancelled) return;
      if (d.status === 'ok') {
        setEntries(d.entries);
        setSettings({ ...blankSettings, ...d.settings });
      }
      canWrite.current = d.status !== 'unavailable';
      setLoaded(true);
      if (d.status === 'corrupt') {
        Alert.alert(
          'Saved data could not be read',
          'A copy of the unreadable data has been kept on the device. The app is starting with an empty log.',
        );
      } else if (d.status === 'unavailable') {
        Alert.alert(
          'Storage unavailable',
          'The app could not access its saved data. Changes made now will not be saved.',
        );
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // -- Persist --
  const commit = useCallback((next) => {
    const merged = { ...latest.current, ...next };
    latest.current = merged;
    if (next.entries)  setEntries(merged.entries);
    if (next.settings) setSettings(merged.settings);
    if (canWrite.current) {
      saveData(merged.entries, merged.settings).then(ok => {
        if (!ok) Alert.alert('Save failed', 'Your latest change could not be saved to the device.');
      });
    }
  }, []);

  const addEntry       = (entry)  => commit({ entries: [...latest.current.entries, entry] });
  const updateEntry    = (entry)  => commit({ entries: latest.current.entries.map(e => (e.id === entry.id ? entry : e)) });
  const deleteEntry    = (id)     => commit({ entries: latest.current.entries.filter(e => e.id !== id) });
  const updateSettings = (s)      => commit({ settings: { ...blankSettings, ...s } });
  const clearAll       = ()       => commit({ entries: [], settings: { ...blankSettings } });
  const loadDemoData   = ()       => commit({ entries: [...demoEntries], settings: { ...demoSettings } });

  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.navy }}>
        <ActivityIndicator color={theme.amber} size="large" />
      </View>
    );
  }

  return (
    <AppContext.Provider value={{ entries, settings, addEntry, updateEntry, deleteEntry, updateSettings, clearAll, loadDemoData }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerStyle:      { backgroundColor: theme.navy },
              headerTintColor:  '#fff',
              headerTitleStyle: { fontWeight: '700', letterSpacing: 0.5 },
              tabBarActiveTintColor:   theme.amber,
              tabBarInactiveTintColor: '#9A948A',
              tabBarStyle: { borderTopColor: theme.border, backgroundColor: '#fff', height: 64, paddingTop: 6, paddingBottom: 8 },
              tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
              tabBarIcon: ({ focused, color, size }) => {
                const [on, off] = ICONS[route.name] || ['ellipse', 'ellipse-outline'];
                return <Ionicons name={focused ? on : off} size={size} color={color} />;
              },
            })}
          >
            <Tab.Screen name="Dashboard"  component={DashboardScreen}  options={{ title: 'Dashboard' }} />
            <Tab.Screen
              name="Add Entry"
              component={AddEntryScreen}
              options={({ route }) => ({ title: route.params?.edit ? 'Edit Entry' : 'New Entry' })}
            />
            <Tab.Screen name="Log"        component={MonthlyLogScreen} options={{ title: 'Monthly Log' }} />
            <Tab.Screen name="Summary"    component={SummaryScreen}    options={{ title: 'Summary' }} />
            <Tab.Screen name="Settings"   component={SettingsScreen}   options={{ title: 'Settings' }} />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </AppContext.Provider>
  );
}
