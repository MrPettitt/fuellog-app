// Small set of building blocks shared by every screen.
import React from 'react';
import { View, Text, TouchableOpacity, TouchableHighlight, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, radius, font } from '../theme';

// Screen title row: big month/title on the left, optional action on the right.
export function TitleRow({ title, subtitle, actionLabel, onAction }) {
  return (
    <View style={s.titleRow}>
      <View style={{ flex: 1 }}>
        <Text style={s.title}>{title}</Text>
        {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel ? (
        <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button">
          <View style={s.action}>
            <Text style={s.actionText}>{actionLabel}</Text>
            <Ionicons name="chevron-down" size={14} color={colors.accent} />
          </View>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// Grey section heading above a Group.
export function SectionTitle({ children, right, onRight }) {
  return (
    <View style={s.sectionRow}>
      <Text style={s.section}>{children}</Text>
      {right ? (
        <TouchableOpacity onPress={onRight} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={s.sectionRight}>{right}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

// White rounded container. Children are separated by inset hairlines.
export function Group({ children, style }) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[s.group, style]}>
      {items.map((child, i) => (
        <View key={child.key ?? i}>
          {child}
          {i < items.length - 1 && <View style={s.hairline} />}
        </View>
      ))}
    </View>
  );
}

// Label on the left, value on the right. Tappable when onPress is given.
export function Row({ label, value, valueColor, onPress, chevron, destructive, children }) {
  const inner = (
    <View style={s.row}>
      {children ? children : (
        <>
          <Text style={[s.rowLabel, destructive && { color: colors.danger }]}>{label}</Text>
          {value !== undefined && (
            <Text style={[s.rowValue, font.tabular, valueColor && { color: valueColor }]} numberOfLines={1}>{value}</Text>
          )}
        </>
      )}
      {(chevron || onPress) && !destructive ? <Ionicons name="chevron-forward" size={17} color={colors.text3} style={{ marginLeft: 6 }} /> : null}
    </View>
  );
  if (!onPress) return inner;
  return (
    <TouchableHighlight underlayColor={colors.field} onPress={onPress} accessibilityRole="button">
      {inner}
    </TouchableHighlight>
  );
}

// Solid rounded square with a white glyph, iOS-settings style.
export function EntryIcon({ type, size = 36 }) {
  const isTrip = type === 'trip';
  return (
    <View style={{ width: size, height: size, borderRadius: Math.round(size * 0.26), backgroundColor: isTrip ? colors.trip : colors.fuel, alignItems: 'center', justifyContent: 'center' }}>
      <MaterialCommunityIcons name={isTrip ? 'car' : 'gas-station'} size={Math.round(size * 0.58)} color="#fff" />
    </View>
  );
}

export function Button({ title, onPress, kind = 'primary', disabled, loading, style }) {
  const styles = {
    primary:     [s.btn, s.btnPrimary],
    secondary:   [s.btn, s.btnSecondary],
    destructive: [s.btn, s.btnDestructive],
  }[kind];
  const textStyle = {
    primary:     s.btnPrimaryText,
    secondary:   s.btnSecondaryText,
    destructive: s.btnDestructiveText,
  }[kind];
  return (
    <TouchableOpacity style={[styles, disabled && s.btnDisabled, style]} onPress={onPress} disabled={disabled || loading} accessibilityRole="button">
      {loading ? <ActivityIndicator color={kind === 'primary' ? '#fff' : colors.text} /> : <Text style={textStyle}>{title}</Text>}
    </TouchableOpacity>
  );
}

export function EmptyState({ title, message, actionLabel, onAction }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyTitle}>{title}</Text>
      {message ? <Text style={s.emptyText}>{message}</Text> : null}
      {actionLabel ? <Button title={actionLabel} onPress={onAction} style={{ marginTop: 16, alignSelf: 'center', paddingHorizontal: 28 }} /> : null}
    </View>
  );
}

export const screen = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bg },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 32 },
});

const s = StyleSheet.create({
  titleRow:   { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14, paddingHorizontal: 4 },
  title:      { fontSize: 28, fontWeight: '700', color: colors.text, letterSpacing: -0.4 },
  subtitle:   { fontSize: 14, color: colors.text2, marginTop: 2 },
  action:     { flexDirection: 'row', alignItems: 'center', gap: 3, paddingBottom: 4 },
  actionText: { fontSize: 15, fontWeight: '600', color: colors.accent },

  sectionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 22, marginBottom: 8, paddingHorizontal: 16 },
  section:      { fontSize: 13, color: colors.text2, textTransform: 'uppercase', letterSpacing: 0.3 },
  sectionRight: { fontSize: 14, fontWeight: '600', color: colors.accent },

  group:    { backgroundColor: colors.surface, borderRadius: radius, overflow: 'hidden' },
  hairline: { height: StyleSheet.hairlineWidth, backgroundColor: colors.separator, marginLeft: 16 },

  row:      { flexDirection: 'row', alignItems: 'center', minHeight: 50, paddingHorizontal: 16, paddingVertical: 12, gap: 12 },
  rowLabel: { flex: 1, fontSize: 16, color: colors.text },
  rowValue: { fontSize: 16, color: colors.text2 },

  btn:               { minHeight: 50, borderRadius: radius, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  btnPrimary:        { backgroundColor: colors.text },
  btnPrimaryText:    { color: '#fff', fontSize: 16, fontWeight: '600' },
  btnSecondary:      { backgroundColor: colors.surface },
  btnSecondaryText:  { color: colors.text, fontSize: 16, fontWeight: '600' },
  btnDestructive:    { backgroundColor: colors.surface },
  btnDestructiveText:{ color: colors.danger, fontSize: 16, fontWeight: '600' },
  btnDisabled:       { opacity: 0.4 },

  empty:      { paddingVertical: 36, paddingHorizontal: 24, alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: colors.text, textAlign: 'center' },
  emptyText:  { fontSize: 14, color: colors.text2, textAlign: 'center', marginTop: 6, lineHeight: 20 },
});
