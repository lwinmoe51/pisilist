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
  cardBorder: string;
  cardSharedBorder: string;
  inputBg: string;
  overlayBg: string;
}

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
  cardBorder: '#e8e8e8',
  cardSharedBorder: '#a8c8fa',
  inputBg: '#ffffff',
  overlayBg: 'rgba(0,0,0,0.5)',
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
  cardBorder: '#333333',
  cardSharedBorder: '#4da3ff',
  inputBg: '#2a2a2a',
  overlayBg: 'rgba(0,0,0,0.7)',
};
