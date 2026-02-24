// types/theme.ts
export type ThemeColor = "blue" | "green" | "purple" | "pink" | "gray" | "yellow";

export interface ThemeConfig {
  active: {
    text: string;
    border: string;
    icon: string;
  };
  hover: string;
}
