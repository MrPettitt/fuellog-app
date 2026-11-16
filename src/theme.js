// Design tokens. Deliberately restrained: one accent, hairline separators,
// grouped white surfaces on a light grey background, system fonts.
import { Platform } from 'react-native';

export const colors = {
  bg:        '#F2F2F4',   // screen background
  surface:   '#FFFFFF',   // grouped sections
  separator: '#E5E5EA',
  text:      '#0B1F3A',   // navy, used for headings and primary buttons
  text2:     '#6B6F76',
  text3:     '#A2A6AD',
  accent:    '#B8770A',   // amber, used sparingly for links and the active tab
  money:     '#1B7A46',
  danger:    '#C0392B',
  trip:      '#2E5BBA',
  fuel:      '#C8860A',
  field:     '#F7F7F8',
};

export const radius = 12;

export const font = {
  // Numbers line up in columns.
  tabular: { fontVariant: ['tabular-nums'] },
  mono:    { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
};

// Kept for compatibility with older imports.
export const theme = {
  navy: colors.text, amber: colors.accent, bg: colors.bg, card: colors.surface,
  border: colors.separator, text: colors.text, muted: colors.text2,
  success: colors.money, danger: colors.danger, placeholder: colors.text3,
};
