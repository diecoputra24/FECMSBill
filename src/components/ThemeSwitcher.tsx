"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import type { ThemeColor } from "@/types/theme";

const themeOptions: ThemeColor[] = ["blue", "green", "purple", "pink", "gray"];

const ThemeSwitcher: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value as ThemeColor)}
      className="border px-2 py-1 rounded text-sm"
    >
      {themeOptions.map((color) => (
        <option key={color} value={color}>
          {color.charAt(0).toUpperCase() + color.slice(1)}
        </option>
      ))}
    </select>
  );
};

export default ThemeSwitcher;
