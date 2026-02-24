// config/themes.ts
import type { ThemeColor, ThemeConfig } from "../types/theme";

export const themeConfig: Record<ThemeColor, ThemeConfig> = {
  blue: {
    active: {
      text: "text-blue-600",
      border: "border-blue-600",
      icon: "text-blue-600",
    },
    hover: "hover:text-blue-600",
  },
  green: {
    active: {
      text: "text-green-600",
      border: "border-green-600",
      icon: "text-green-600",
    },
    hover: "hover:text-green-600",
  },
  purple: {
    active: {
      text: "text-purple-600",
      border: "border-purple-600",
      icon: "text-purple-600",
    },
    hover: "hover:text-purple-600",
  },
  pink: {
    active: {
      text: "text-pink-600",
      border: "border-pink-600",
      icon: "text-pink-600",
    },
    hover: "hover:text-pink-600",
  },
  gray: {
    active: {
      text: "text-gray-700",
      border: "border-gray-700",
      icon: "text-gray-700",
    },
    hover: "hover:text-gray-700",
  },
  yellow: {
    active: {
      text: "text-yellow-600",
      border: "border-yellow-600",
      icon: "text-yellow-600",
    },
    hover: "hover:text-yellow-600",
  },
};
