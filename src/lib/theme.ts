export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'theme';

export function getStoredTheme(): ThemeMode | null {
  try {
    const t = localStorage.getItem(STORAGE_KEY);
    return t === 'dark' || t === 'light' ? t : null;
  } catch {
    return null;
  }
}

export function getSystemPrefersDark(): boolean {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

function startThemeTransition() {
  const root = document.documentElement;
  root.classList.add('theme-smooth');
  window.setTimeout(() => root.classList.remove('theme-smooth'), 250);
}

export function initTheme() {
  const stored = getStoredTheme();
  const mode: ThemeMode = stored ?? (getSystemPrefersDark() ? 'dark' : 'light');
  applyTheme(mode);
  return mode;
}

export function toggleTheme(): ThemeMode {
  const isDark = document.documentElement.classList.contains('dark');
  const next: ThemeMode = isDark ? 'light' : 'dark';
  startThemeTransition();
  applyTheme(next);
  try { localStorage.setItem(STORAGE_KEY, next); } catch {}
  return next;
}
