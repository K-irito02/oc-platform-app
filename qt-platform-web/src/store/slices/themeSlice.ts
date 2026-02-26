import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../index';

export interface ThemeConfig {
  background: {
    type: 'video' | 'image';
    url: string;
    opacity: number; // For the glass layer on top of background
    blur: number;    // Backdrop blur amount in px
  };
  appearance: {
    primaryColor: string; // Tailwind color hex or name
    fontFamily: string;
    borderRadius: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
    mode: 'light' | 'dark' | 'system'; // Added system mode
  };
}

// Default Minimalist Config
export const defaultTheme: ThemeConfig = {
  background: {
    type: 'image',
    url: '', // No background image by default
    opacity: 1, // Solid background
    blur: 0,
  },
  appearance: {
    primaryColor: '#2563eb', // Blue-600
    fontFamily: 'Inter, system-ui, sans-serif',
    borderRadius: 'md',
    mode: 'system', // Default to system
  },
};

interface ThemeState {
  userConfig: Partial<ThemeConfig> | null;
  systemConfig: Partial<ThemeConfig> | null;
  currentTheme: ThemeConfig;
}

const initialState: ThemeState = {
  userConfig: null,
  systemConfig: null,
  currentTheme: defaultTheme,
};

// Helper to merge configs deeply
const mergeThemes = (base: ThemeConfig, ...overrides: (Partial<ThemeConfig> | null)[]): ThemeConfig => {
  let result = { ...base };
  overrides.forEach(override => {
    if (!override) return;
    if (override.background) {
      result.background = { ...result.background, ...override.background };
    }
    if (override.appearance) {
      result.appearance = { ...result.appearance, ...override.appearance };
    }
  });
  return result;
};

export const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    setUserConfig: (state, action: PayloadAction<Partial<ThemeConfig> | null>) => {
      state.userConfig = action.payload;
      state.currentTheme = mergeThemes(defaultTheme, state.systemConfig, state.userConfig);
    },
    setSystemConfig: (state, action: PayloadAction<Partial<ThemeConfig> | null>) => {
      state.systemConfig = action.payload;
      state.currentTheme = mergeThemes(defaultTheme, state.systemConfig, state.userConfig);
    },
    resetTheme: (state) => {
      state.userConfig = null;
      state.currentTheme = mergeThemes(defaultTheme, state.systemConfig);
    }
  },
});

export const { setUserConfig, setSystemConfig, resetTheme } = themeSlice.actions;

export const selectTheme = (state: RootState) => state.theme.currentTheme;

export default themeSlice.reducer;
