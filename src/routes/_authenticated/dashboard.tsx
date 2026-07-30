import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  LogOut,
  Play,
  Zap,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { accentClass, formatCount, iconFor, type Automation } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Overview — Nexus AI Console" },
      {
        name: "description",
        content: "Track token usage, active automations and recent runs across your Nexus AI workspace.",
      },
      { property: "og:title", content: "Overview — Nexus AI Console" },
      {
        property: "og:description",
        content: "Your AI automation control room: usage, health and recent executions.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    navigate({ to: "/login", replace: true });
  }

  const { data: automations } = useQuery({
    queryKey: ["automations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("automations").select("*");
      if (error) throw error;
      return data as Automation[];
    },
  });

  const { data: executions } = useQuery({
    queryKey: ["executions", "recent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("executions")
        .select("id, status, tokens_used, duration_ms, created_at, automation_id")
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const tokens = (executions ?? []).reduce((sum, e) => sum + e.tokens_used, 0);
  const top = (automations ?? []).slice(0, 3);

  return (
    <AppShell>
      <div className="space-y-8 px-4 py-8 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-mono">Nexus AI › Project Alpha › Automations</p>
            <h1 className="mt-2 text-3xl font-extrabold">Overview</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 font-mono text-[0.6875rem] uppercase tracking-widest">
              <span className="size-2 rounded-full bg-success" /> {profile?.status ?? "active"}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut /> Log out
            </Button>
          </div>
        </div>

        <section className="surface-card flex flex-wrap items-center gap-5 p-6">
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={`${profile.display_name ?? "User"} avatar`}
              className="size-14 rounded-2xl object-cover"
            />
          ) : (
            <span className="grid size-14 place-items-center rounded-2xl bg-ink font-display text-lg font-bold text-ink-foreground">
              {(profile?.display_name ?? user?.email ?? "?").slice(0, 1).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-xl font-bold">
              {profile?.display_name ?? profile?.full_name ?? "Your account"}
            </p>
            <p className="truncate text-sm text-muted-foreground">
              {profile?.email ?? user?.email}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
            <Fact icon={CreditCard} label="Plan" value={profile?.subscription ?? "free"} />
            <Fact
              icon={CalendarClock}
              label="Member since"
              value={
                profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"
              }
            />
            <Fact
              icon={Clock}
              label="Last login"
              value={
                profile?.last_login_at
                  ? new Date(profile.last_login_at).toLocaleString()
                  : "First session"
              }
            />
          </div>
        </section>

        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            icon={Zap}
            label="Tokens remaining"
            value={(profile?.tokens ?? 0).toLocaleString()}
            hint={`Provider: ${profile?.provider ?? "email"}`}
          />
          <MetricCard
            icon={Activity}
            label="Used this month"
            value={(profile?.monthly_tokens_used ?? 0).toLocaleString()}
            hint="Resets at the start of each cycle"
          />
          <MetricCard
            icon={Activity}
            label="Used all time"
            value={(profile?.total_tokens_used ?? 0).toLocaleString()}
            hint={`${tokens.toLocaleString()} tokens across recent runs`}
          />
          <MetricCard
            icon={CheckCircle2}
            label="Success rate"
            value="99.8%"
            hint="Rolling 24 hours"
          />
        </div>

        <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="surface-card p-6">
            <h2 className="text-lg font-semibold">Your automations</h2>
            <div className="mt-5 space-y-3">
              {top.map((a) => {
                const Icon = iconFor(a.icon);
                return (
                  <div
                    key={a.id}
                    className="hover-lift flex items-center gap-4 rounded-xl border border-border bg-surface-muted p-4"
                  >
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-xl border border-border bg-surface",
                        accentClass(a.accent),
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{a.name}</p>
                      <p className="label-mono mt-0.5">
                        {a.category} · {formatCount(a.launches)} launches
                      </p>
                    </div>
                    <Button asChild size="sm" className="shrink-0">
                      <Link to="/automations/$slug" params={{ slug: a.slug }}>
                        <Play className="fill-current" /> Execute
                      </Link>
                    </Button>
                  </div>
                );
              })}
            </div>
            <Button asChild variant="ghost" className="mt-5">
              <Link to="/marketplace">
                Browse the marketplace <ArrowRight />
              </Link>
            </Button>
          </div>

          <div className="surface-card p-6">
            <h2 className="text-lg font-semibold">Recent runs</h2>
            {executions && executions.length > 0 ? (
              <div className="mt-5 divide-y divide-border">
                {executions.map((e) => (
                  <div key={e.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-mono text-xs font-semibold">
                        #{e.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="label-mono mt-0.5">
                        {new Date(e.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "font-mono text-xs font-semibold",
                        e.status === "success" ? "text-success" : "text-destructive",
                      )}
                    >
                      {e.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm text-muted-foreground">
                No runs yet. Launch an automation from the marketplace to see history here.
              </p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="surface-card p-6">
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className="size-4 text-primary" />
      </div>
      <p className="mt-3 font-display text-3xl font-extrabold">{value}</p>
      <p className="mt-3 text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="label-mono flex items-center gap-1.5">
        <Icon className="size-3" /> {label}
      </p>
      <p className="mt-1 text-sm font-semibold capitalize">{value}</p>
    </div>
  );
}
