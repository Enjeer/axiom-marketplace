import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CreditCard,
  Gauge,
  KeyRound,
  LayoutGrid,
  LifeBuoy,
  LogOut,
  MessageSquare,
  Search,
  Settings,
  Store,
  Terminal,
  Users,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const TOP_NAV = [
  { label: "Marketplace", to: "/marketplace" },
  { label: "Overview", to: "/dashboard" },
  { label: "Settings", to: "/settings" },
] as const;

const SIDE_NAV = [
  { label: "Overview", to: "/dashboard", icon: LayoutGrid },
  { label: "Marketplace", to: "/marketplace", icon: Store },
  { label: "Settings", to: "/settings", icon: Settings },
] as const;

const SIDE_STATIC = [
  { label: "Usage", icon: Gauge },
  { label: "API Keys", icon: KeyRound },
  { label: "Team", icon: Users },
  { label: "Billing", icon: CreditCard },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("full_name, display_name, username, tokens, subscription, avatar_url")
        .eq("id", auth.user.id)
        .maybeSingle();
      return { email: auth.user.email ?? "", ...data };
    },
  });

  const initials = (profile?.full_name || profile?.email || "N")
    .split(" ")
    .map((p: string) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/85 backdrop-blur-xl">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6 lg:grid-cols-[auto_1fr_auto]">
          <div className="flex min-w-0 items-center gap-8">
            <Link to="/marketplace" className="flex shrink-0 items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-ink text-ink-foreground">
                <Terminal className="size-4" />
              </span>
              <span className="font-display text-lg font-bold tracking-tight">Nexus AI</span>
            </Link>
            <nav className="hidden items-center gap-6 lg:flex">
              {TOP_NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "border-b-2 border-transparent pb-0.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                    pathname.startsWith(item.to) && "border-primary text-primary",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="hidden justify-self-center lg:block lg:w-full lg:max-w-sm">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                readOnly
                onFocus={() => navigate({ to: "/marketplace" })}
                placeholder="Search resources…"
                className="h-9 w-full rounded-full border border-border bg-surface-muted pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/40"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 justify-self-end">
            <div className="hidden items-center gap-1.5 rounded-full border border-border bg-surface-muted px-3 py-1.5 sm:flex">
              <span className="label-mono">Tokens</span>
              <span className="font-mono text-xs font-semibold">
                {(profile?.tokens ?? 0).toLocaleString()}
              </span>
            </div>
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  aria-label="Account menu"
                  className="rounded-full ring-offset-background transition-opacity hover:opacity-80"
                >
                  <Avatar className="size-8 border border-border">
                    <AvatarFallback className="bg-ink text-xs text-ink-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">
                  {profile?.full_name || profile?.email || "Account"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/settings">
                    <Settings className="mr-2 size-4" /> Account settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={signOut}>
                  <LogOut className="mr-2 size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1600px]">
        <aside className="sticky top-[61px] hidden h-[calc(100vh-61px)] w-64 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-6 lg:flex">
          <div className="flex items-center gap-3 px-2">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl gradient-accent text-primary">
              <LayoutGrid className="size-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-mono text-sm font-semibold">Project Alpha</p>
              <p className="label-mono">Production v1.2.0</p>
            </div>
          </div>

          <nav className="mt-8 space-y-1">
            {SIDE_NAV.map((item) => {
              const active = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border border-transparent px-3 py-2 font-mono text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                    active && "border-primary/25 bg-accent text-primary",
                  )}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
            {SIDE_STATIC.map((item) => (
              <span
                key={item.label}
                className="flex cursor-not-allowed items-center gap-3 rounded-xl px-3 py-2 font-mono text-sm text-muted-foreground/60"
              >
                <item.icon className="size-4" />
                {item.label}
              </span>
            ))}
          </nav>

          <div className="mt-auto space-y-4">
            <div className="rounded-2xl border border-primary/20 bg-accent p-4">
              <p className="label-mono text-primary">Current plan: {profile?.subscription ?? "free"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Unlock enterprise automations and higher token limits.
              </p>
              <Button className="mt-3 w-full" size="sm">
                Upgrade plan
              </Button>
            </div>
            <div className="space-y-1 border-t border-border pt-4">
              <span className="flex items-center gap-3 px-3 py-1.5 text-sm text-muted-foreground">
                <LifeBuoy className="size-4" /> Support
              </span>
              <span className="flex items-center gap-3 px-3 py-1.5 text-sm text-muted-foreground">
                <MessageSquare className="size-4" /> Feedback
              </span>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-6 py-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs">NEXUS AI INC. © 2026</p>
          <p className="flex items-center gap-2 text-xs">
            <span className="size-2 rounded-full bg-success" /> All systems operational
          </p>
        </div>
      </footer>
    </div>
  );
}
