import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractResultText(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return raw;
  try {
    const parsed = JSON.parse(trimmed);
    if (typeof parsed === "string") return parsed;
    if (parsed && typeof parsed === "object") {
      const candidate = parsed.text ?? parsed.output ?? parsed.message;
      if (typeof candidate === "string") return candidate;
    }
  } catch {
    // Not valid JSON — show the raw text as-is.
  }
  return raw;
}
