export const palette = {
  // Dark scheme matching Apple's ArrangementView diagrams.
  canvas: '#000000',
  surface: '#1C1C1E',
  ink: '#F5F5F7',
  inkMuted: '#8E8E93',
  line: '#2C2C2E',
  hairline: 'rgba(255,255,255,0.14)',
  bar: '#1B1B1F',
  barText: '#F6F5F2',
  barMuted: '#8E8E99',
  accent: '#FF5A1F',
  primary: { fill: '#45427A', accent: '#6E6BF5', text: '#ECEBFF' },
  secondary: { fill: '#3A6479', accent: '#40C8F0', text: '#E3F6FD' },
} as const;

export const radius = { sm: 8, md: 14, lg: 24 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
