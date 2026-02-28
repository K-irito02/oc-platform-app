import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { setUserConfig, setSystemConfig, ThemeConfig } from '../../store/slices/themeSlice';
import { selectUser } from '../../store/slices/authSlice';
import { systemApi } from '../../utils/api';

type ApiResponse<T> = {
  data?: T;
};

type GlobalThemeResponse = {
  themeConfig?: ThemeConfig | string | null;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const theme = useAppSelector((state) => state.theme.currentTheme);
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();

  // Load System Config
  useEffect(() => {
    const loadSystemConfig = async () => {
      try {
        const res = await systemApi.getGlobalTheme() as ApiResponse<GlobalThemeResponse>;
        if (res.data && res.data.themeConfig) {
          let config: ThemeConfig | string | null = res.data.themeConfig;
          // Parse potentially nested JSON strings
          while (typeof config === 'string') {
            try {
              config = JSON.parse(config);
            } catch {
              break;
            }
          }
          if (config && typeof config === 'object') {
            // Adapt old ink config to new structure if necessary, or just use if matches
            // For now, assuming we might receive new structure or partial
            if (config.background || config.appearance) {
              dispatch(setSystemConfig(config));
            }
          }
        }
      } catch (error: unknown) {
        console.error('Failed to load system theme:', error);
      }
    };
    loadSystemConfig();
  }, [dispatch]);

  // Load User Config
  useEffect(() => {
    if (user && user.themeConfig) {
      try {
        let config = user.themeConfig;
        if (typeof config === 'string') {
             config = JSON.parse(config);
        }
        dispatch(setUserConfig(config as Partial<ThemeConfig>));
      } catch (e) {
        console.error("Failed to parse user theme config", e);
      }
    } else {
      dispatch(setUserConfig(null));
    }
  }, [user, dispatch]);

  // Apply CSS Variables
  useEffect(() => {
    const root = document.documentElement;
    
    // Background
    if (theme.background.type === 'image') {
        root.style.setProperty('--bg-image-url', `url('${theme.background.url}')`);
    } else {
        root.style.setProperty('--bg-image-url', 'none');
        // Video handling is done in DynamicBackground component
    }

    // Glassmorphism
    root.style.setProperty('--glass-opacity', theme.background.opacity.toString());
    root.style.setProperty('--glass-blur', `${theme.background.blur}px`);

    // Appearance
    root.style.setProperty('--color-primary', hexToRgb(theme.appearance.primaryColor));
    root.style.setProperty('--font-family-base', theme.appearance.fontFamily);
    
    // Mode
    if (theme.appearance.mode === 'dark') {
        document.documentElement.classList.add('dark');
    } else {
        document.documentElement.classList.remove('dark');
    }

  }, [theme]);

  return <>{children}</>;
};

// Helper to convert Hex to RGB for Tailwind opacity modifier support
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? 
    `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : 
    '59 130 246'; // Default blue
}
