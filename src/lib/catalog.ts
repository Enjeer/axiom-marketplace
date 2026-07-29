import {
  Activity,
  Database,
  FileText,
  Image as ImageIcon,
  LifeBuoy,
  LineChart,
  Mail,
  Newspaper,
  NotebookPen,
  PenTool,
  Receipt,
  Search,
  Send,
  Share2,
  Sparkles,
  TrendingDown,
  Users,
  Video,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export type Automation = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  creator: string;
  icon: string;
  accent: string;
  version: string;
  rating: number;
  launches: number;
  runtime: string;
  token_cost: number;
  success_rate: number;
  tier: string;
  featured: boolean;
  trending: boolean;
  created_at: string;
};

const ICONS: Record<string, LucideIcon> = {
  "line-chart": LineChart,
  users: Users,
  mail: Mail,
  database: Database,
  activity: Activity,
  "file-text": FileText,
  search: Search,
  "share-2": Share2,
  receipt: Receipt,
  image: ImageIcon,
  video: Video,
  "notebook-pen": NotebookPen,
  send: Send,
  "pen-tool": PenTool,
  "trending-down": TrendingDown,
  "life-buoy": LifeBuoy,
  newspaper: Newspaper,
  workflow: Workflow,
  sparkles: Sparkles,
};

export function iconFor(name: string): LucideIcon {
  return ICONS[name] ?? Sparkles;
}

/** Accent tone -> chart token class. Literal strings so Tailwind keeps them. */
export function accentClass(accent: string): string {
  switch (accent) {
    case "emerald":
      return "text-chart-2";
    case "violet":
      return "text-chart-3";
    case "amber":
      return "text-chart-4";
    case "pink":
      return "text-chart-5";
    case "slate":
      return "text-muted-foreground";
    default:
      return "text-chart-1";
  }
}

export const CATEGORIES = [
  "Marketing",
  "Sales",
  "Content",
  "Customer Support",
  "Social Media",
  "Development",
  "Productivity",
  "Image Generation",
  "Video",
  "Documents",
  "Finance",
  "Data Analysis",
  "Email",
  "Lead Generation",
  "SEO",
  "Automation",
] as const;

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function tierLabel(tier: string): string {
  return tier.toUpperCase();
}
