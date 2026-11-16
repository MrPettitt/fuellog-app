import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen  from './src/screens/DashboardScreen';
import AddEntryScreen   from './src/screens/AddEntryScreen';
import MonthlyLogScreen from './src/screens/MonthlyLogScreen';
import SummaryScreen    from './src/screens/SummaryScreen';
import SettingsScreen   from './src/screens/SettingsScreen';

import { dummyEntries, defaultSettings, blankSettings } from './src/utils';
import { theme } from './src/theme';
import { AppContext } from './src/AppContext';

// ─── Global Context ───────────────────────────────────────────────────────────

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
  const [settings, setSettings] = useState(defaultSettings);
  const [loaded,   setLoaded]   = useState(false);

  // ── Load from storage ──
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('fuellog_v1');
        if (raw) {
          const d = JSON.parse(raw);
          setEntries(Array.isArray(d.entries) ? d.entries : dummyEntries);
          setSettings(s => ({ ...s, ...(d.settings || {}) }));
        } else {
          // First launch - seed with demo data
          setEntries(dummyEntries);
          setSettings(defaultSettings);
          await AsyncStorage.setItem('fuellog_v1', JSON.stringify({ entries: dummyEntries, settings: defaultSettings }));
        }
      } catch (_) {
        setEntries(dummyEntries);
        setSettings(defaultSettings);
      }
      setLoaded(true);
    })();
  }, []);

  // ── Persist helpers ──
  const persist = async (e, s) => {
    try { await AsyncStorage.setItem('fuellog_v1', JSON.stringify({ entries: e, settings: s })); } catch (_) {}
  };

  const addEntry = (entry) => {
    const next = [...entries, entry];
    setEntries(next);
    persist(next, settings);
  };

  const deleteEntry = (id) => {
    const next = entries.filter(e => e.id !== id);
    setEntries(next);
    persist(next, settings);
  };

  const updateSettings = (s) => {
    setSettings(s);
    persist(entries, s);
  };

  const clearAll = () => {
    setEntries([]);
    const s = { ...blankSettings };
    setSettings(s);
    persist([], s);
  };

  if (!loaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.navy }}>
        <ActivityIndicator color={theme.amber} size="large" />
      </View>
    );
  }

  return (
    <AppContext.Provider value={{ entries, settings, addEntry, deleteEntry, updateSettings, clearAll }}>
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
