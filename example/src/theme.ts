export const palette = {
  // Dark chrome; pane tones match Apple's ArrangementView diagrams (systemIndigo, systemCyan).
  canvas: '#000000',
  surface: '#1C1C1E',
  ink: '#F5F5F7',
  inkMuted: '#8E8E93',
  line: '#2C2C2E',
  hairline: 'rgba(0,0,0,0.12)',
  bar: '#1B1B1F',
  barText: '#F6F5F2',
  barMuted: '#8E8E99',
  accent: '#FF5A1F',
  primary: { fill: '#CCCCF2', accent: '#5856D6', text: '#5856D6' },
  secondary: { fill: '#C1E6F7', accent: '#32ADE6', text: '#32ADE6' },
} as const;

export const radius = { sm: 8, md: 14, lg: 24 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
