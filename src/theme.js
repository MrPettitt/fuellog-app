// Design tokens shared by every screen.
export const theme = {
  // Brand
  navy:       '#0B1F3A',
  navyLight:  '#1A3358',
  amber:      '#C8860A',
  amberLight: '#E49B18',
  amberSoft:  '#FFF4DD',

  // Surfaces
  bg:         '#F3F1EB',
  card:       '#FFFFFF',
  border:     '#E4E0D6',
  inputBg:    '#FAF9F6',

  // Text
  text:       '#0B1F3A',
  muted:      '#7A7060',
  placeholder:'#B0A898',
  onNavy:     '#FFFFFF',
  onNavyMuted:'rgba(255,255,255,0.72)',

  // Semantic
  success:    '#1E7A4A',
  successSoft:'#E6F4EC',
  danger:     '#B83232',
  dangerSoft: '#FBEAEA',
  info:       '#1A56DB',
  infoSoft:   '#EBF2FF',
  tripBg:     '#E8EFFE',
  tripText:   '#2151B8',
  fuelBg:     '#FEF3C7',
  fuelText:   '#92400E',

  // Shape
  radius:     14,
  radiusSm:   10,

  // Elevation (iOS shadow + Android elevation)
  shadow: {
    shadowColor: '#0B1F3A',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  shadowStrong: {
    shadowColor: '#0B1F3A',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 5,
  },
};

// Base card used across screens.
export const card = {
  backgroundColor: theme.card,
  borderRadius: theme.radius,
  borderWidth: 1,
  borderColor: theme.border,
  ...theme.shadow,
};
