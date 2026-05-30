"use client";

import * as React from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  mounted: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const THEME_STORAGE_KEY = "hcs-theme";
const THEME_CHANGE_EVENT = "hcs-theme-change";

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark";
}

function getSystemTheme(): Theme {
  if (typeof window === "undefined") {
    return "light";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getSavedTheme(): Theme | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(savedTheme) ? savedTheme : null;
  } catch {
    return null;
  }
}

function getThemeSnapshot(): Theme {
  return getSavedTheme() ?? getSystemTheme();
}

function getServerThemeSnapshot(): Theme {
  return "light";
}

function subscribeTheme(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handleStorageChange = () => {
    callback();
  };

  const handleThemeChange = () => {
    callback();
  };

  const handleSystemThemeChange = () => {
    const savedTheme = getSavedTheme();

    if (!savedTheme) {
      callback();
    }
  };

  window.addEventListener("storage", handleStorageChange);
  window.addEventListener(THEME_CHANGE_EVENT, handleThemeChange);
  mediaQuery.addEventListener("change", handleSystemThemeChange);

  return () => {
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener(THEME_CHANGE_EVENT, handleThemeChange);
    mediaQuery.removeEventListener("change", handleSystemThemeChange);
  };
}

function subscribeMounted() {
  return () => {};
}

function getMountedClientSnapshot() {
  return true;
}

function getMountedServerSnapshot() {
  return false;
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;

  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.style.colorScheme = theme;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = React.useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );

  const mounted = React.useSyncExternalStore(
    subscribeMounted,
    getMountedClientSnapshot,
    getMountedServerSnapshot,
  );

  React.useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = React.useCallback((nextTheme: Theme) => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  const toggleTheme = React.useCallback(() => {
    const currentTheme = getThemeSnapshot();
    const nextTheme: Theme = currentTheme === "dark" ? "light" : "dark";

    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    applyTheme(nextTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      mounted,
      setTheme,
      toggleTheme,
    }),
    [theme, mounted, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider.");
  }

  return context;
}