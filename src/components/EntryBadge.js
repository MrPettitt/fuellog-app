import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '../theme';

// Round icon badge for a trip or fuel entry.
export default function EntryBadge({ type, size = 40 }) {
  const isTrip = type === 'trip';
  return (
    <View style={[s.badge, { width: size, height: size, borderRadius: size / 2, backgroundColor: isTrip ? theme.tripBg : theme.fuelBg }]}>
      <MaterialCommunityIcons
        name={isTrip ? 'car' : 'gas-station'}
        size={Math.round(size * 0.52)}
        color={isTrip ? theme.tripText : theme.fuelText}
      />
    </View>
  );
}

const s = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center' },
});
