export const API_URL = __DEV__
  ? "http://192.168.1.100:3000"
  : "https://ustatop.identify.uz";

export const COLORS = {
  primary: "#ff6b2b",
  primaryDark: "#e85d20",
  background: "#f0ede8",
  card: "#ffffff",
  text: "#1a1a1a",
  textSecondary: "#3a3a3a",
  textMuted: "#8c8c8c",
  border: "#e9e9e9",
  inputBg: "#f5f3f0",
  success: "#16a34a",
  warning: "#f59e0b",
  danger: "#ef4444",
  teal: "#67d6dc",
} as const;

export const CITIES = [
  "Toshkent",
  "Samarqand",
  "Buxoro",
  "Namangan",
  "Andijon",
  "Farg'ona",
  "Qarshi",
  "Nukus",
];

export const URGENCY_OPTIONS = [
  { value: "LOW", label: "Past", emoji: "🟢", desc: "Shoshilmasdan" },
  { value: "MEDIUM", label: "O'rta", emoji: "🟡", desc: "1-2 kun ichida" },
  { value: "HIGH", label: "Muhim", emoji: "🟠", desc: "Bugun kerak" },
  { value: "URGENT", label: "Shoshilinch", emoji: "🔴", desc: "Hozir kerak" },
] as const;
