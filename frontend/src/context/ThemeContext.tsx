import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type RadiusType = 'sharp' | 'soft' | 'round';

export interface AccentPreset {
  name: string;
  value: string | null; // null = monochrome (black/white)
  previewColor: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { name: 'Monochrome', value: null, previewColor: '#0a0a0a' },
  { name: 'Indigo', value: '#4f46e5', previewColor: '#4f46e5' },
  { name: 'Emerald', value: '#10b981', previewColor: '#10b981' },
  { name: 'Sky', value: '#0284c7', previewColor: '#0284c7' },
  { name: 'Amber', value: '#d97706', previewColor: '#d97706' },
  { name: 'Rose', value: '#e11d48', previewColor: '#e11d48' },
  { name: 'Violet', value: '#7c3aed', previewColor: '#7c3aed' },
];

interface ThemeContextType {
  mode: ThemeMode;
  resolvedMode: 'light' | 'dark';
  accent: string | null;
  radius: RadiusType;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: string | null) => void;
  setRadius: (radius: RadiusType) => void;
  toggleMode: () => void;
}

const STORAGE_KEY = 'omnibudget_theme_prefs_v1';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.mode) return parsed.mode;
      }
    } catch {}
    return 'dark'; // default calm dark
  });

  const [accent, setAccentState] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.accent !== undefined) return parsed.accent;
      }
    } catch {}
    return null;
  });

  const [radius, setRadiusState] = useState<RadiusType>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.radius) return parsed.radius;
      }
    } catch {}
    return 'soft';
  });

  // Calculate resolved mode
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  };

  const [systemMode, setSystemMode] = useState<'light' | 'dark'>(getSystemTheme);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = (e: MediaQueryListEvent) => setSystemMode(e.matches ? 'dark' : 'light');
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, []);

  const resolvedMode = mode === 'system' ? systemMode : mode;

  // Apply theme to DOM
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', resolvedMode);
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedMode);

    // Apply corner radius
    const radiusPx = radius === 'sharp' ? '6px' : radius === 'round' ? '20px' : '14px';
    const radiusSmPx = radius === 'sharp' ? '4px' : radius === 'round' ? '12px' : '8px';
    root.style.setProperty('--radius', radiusPx);
    root.style.setProperty('--radius-sm', radiusSmPx);

    // Apply accent
    if (accent) {
      root.style.setProperty('--accent', accent);
      root.style.setProperty('--accent-fg', '#ffffff');
      root.style.setProperty('--accent-soft', `${accent}18`);
    } else {
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-fg');
      root.style.removeProperty('--accent-soft');
    }

    // Persist
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, accent, radius }));
    } catch {}
  }, [mode, resolvedMode, accent, radius]);

  const setMode = (newMode: ThemeMode) => setModeState(newMode);
  const setAccent = (newAccent: string | null) => setAccentState(newAccent);
  const setRadius = (newRadius: RadiusType) => setRadiusState(newRadius);

  const toggleMode = () => {
    setModeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      return next;
    });
  };

  return (
    <ThemeContext.Provider
      value={{
        mode,
        resolvedMode,
        accent,
        radius,
        setMode,
        setAccent,
        setRadius,
        toggleMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
