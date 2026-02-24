import React, { createContext, useContext, useState, useEffect } from "react";
import type { ThemeColor } from "@/types/theme";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/api";

interface ThemeContextType {
  theme: ThemeColor;
  setTheme: (theme: ThemeColor) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "blue",
  setTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setThemeState] = useState<ThemeColor>("blue");
  const { user } = useAuthStore();

  // Load from local storage initially to avoid flicker before user loads
  useEffect(() => {
    const stored = localStorage.getItem("theme") as ThemeColor;
    if (stored) setThemeState(stored);
  }, []);

  // Sync from user profile when user loads
  useEffect(() => {
    if (user && user.theme) {
      // Cast string to ThemeColor if valid
      const userTheme = user.theme as ThemeColor;
      if (userTheme !== theme) {
        setThemeState(userTheme);
        localStorage.setItem("theme", userTheme);
      }
    }
  }, [user]);

  const setTheme = async (newTheme: ThemeColor) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);

    // Save to backend if logged in
    if (user?.id) {
      // Optimistically update auth store
      useAuthStore.setState(state => ({
        user: state.user ? { ...state.user, theme: newTheme } : null
      }));

      try {
        await api.patch(`/users/${user.id}`, { theme: newTheme });
      } catch (error) {
        console.error("Failed to save theme preference", error);
        // Revert if failed (optional, but good practice)
      }
    }
  };

  useEffect(() => {
    const root = window.document.documentElement;
    const colors: Record<ThemeColor, string> = {
      blue: "221.2 83.2% 53.3%",
      green: "142.1 76.2% 36.3%",
      purple: "262.1 83.3% 57.8%",
      pink: "330.4 81.2% 60.4%",
      gray: "240 5.9% 64.9%",
      yellow: "47.9 95.8% 53.1%",
    };
    root.style.setProperty("--primary", colors[theme]);
    root.style.setProperty("--ring", colors[theme]);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
