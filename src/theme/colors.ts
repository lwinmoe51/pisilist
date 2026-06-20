/** Color tokens used across the app. */
export interface AppColors {
  background: string;
  surface: string;
  text: string;
  subtext: string;
  border: string;
  primary: string;
  danger: string;
  warning: string;
  muted: string;
  placeholder: string;
  headerBg: string;
  modalBg: string;
  inputBg: string;
  overlayBg: string;
  cardShadow: string;
  headerShadow: string;
  checkboxBorder: string;
  chipBg: string;
}

/** Accent colors available for card backgrounds. */
export const CARD_ACCENT_COLORS: (string | null)[] = [
  null,          // default (surface)
  '#e8f0fe',    // blue
  '#fce8e6',    // red
  '#fef7e0',    // yellow
  '#e6f4ea',    // green
  '#f3e8fd',    // purple
  '#fce2db',    // pink
  '#e0f2f1',    // teal
];

export const CARD_ACCENT_COLORS_DARK: (string | null)[] = [
  null,          // default (surface)
  '#1a2744',    // blue
  '#3c1a1a',    // red
  '#3d3520',    // yellow
  '#1a3324',    // green
  '#2a1a3d',    // purple
  '#3d1a2a',    // pink
  '#1a3330',    // teal
];

/** Light-mode color palette. */
export const lightColors: AppColors = {
  background: '#f5f5f5',
  surface: '#ffffff',
  text: '#1a1a2e',
  subtext: '#666666',
  border: '#e0e0e0',
  primary: '#1a73e8',
  danger: '#e53935',
  warning: '#f9a825',
  muted: '#f5f5f5',
  placeholder: '#999999',
  headerBg: '#ffffff',
  modalBg: 'rgba(0,0,0,0.5)',
  inputBg: '#ffffff',
  overlayBg: 'rgba(0,0,0,0.5)',
  cardShadow: '0 1px 2px rgba(0,0,0,0.08), 0 2px 6px rgba(0,0,0,0.04)',
  headerShadow: '0 1px 3px rgba(0,0,0,0.06)',
  checkboxBorder: '#c4c4c4',
  chipBg: '#f0f0f0',
};

/** Dark-mode color palette. */
export const darkColors: AppColors = {
  background: '#121212',
  surface: '#1e1e1e',
  text: '#e0e0e0',
  subtext: '#aaaaaa',
  border: '#333333',
  primary: '#4da3ff',
  danger: '#ef5350',
  warning: '#ffd54f',
  muted: '#2a2a2a',
  placeholder: '#777777',
  headerBg: '#1a1a1a',
  modalBg: 'rgba(0,0,0,0.7)',
  inputBg: '#2a2a2a',
  overlayBg: 'rgba(0,0,0,0.7)',
  cardShadow: '0 1px 2px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.2)',
  headerShadow: '0 1px 3px rgba(0,0,0,0.4)',
  checkboxBorder: '#555555',
  chipBg: '#333333',
};
