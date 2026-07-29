import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Filter, Flame, Loader2, Play, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { AutomationCard } from "@/components/automation-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, formatCount, type Automation } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/marketplace")({
  head: () => ({
    meta: [
      { title: "AI Marketplace — Nexus AI" },
      {
        name: "description",
        content:
          "Discover, filter and launch production-ready AI automations across marketing, sales, data and more.",
      },
      { property: "og:title", content: "AI Marketplace — Nexus AI" },
      {
        property: "og:description",
        content: "Browse hundreds of AI automations by category, rating and runtime cost.",
      },
    ],
  }),
  component: MarketplacePage,
});

const PAGE_SIZE = 6;

function MarketplacePage() {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [tab, setTab] = useState<"trending" | "recent">("trending");
  const [sort, setSort] = useState("popular");
  const [visible, setVisible] = useState(PAGE_SIZE);

  const { data: automations, isLoading } = useQuery({
    queryKey: ["automations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("automations").select("*");
      if (error) throw error;
      return data as Automation[];
    },
  });

  const { data: favorites } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const { data, error } = await supabase.from("favorites").select("automation_id");
      if (error) throw error;
      return data.map((f) => f.automation_id);
    },
  });

  const toggleFavorite = useMutation({
    mutationFn: async (automationId: string) => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Not signed in");
      if (favorites?.includes(automationId)) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("automation_id", automationId)
          .eq("user_id", auth.user.id);
        if (error) throw error;
        return "removed";
      }
      const { error } = await supabase
        .from("favorites")
        .insert({ automation_id: automationId, user_id: auth.user.id });
      if (error) throw error;
      return "added";
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      toast.success(result === "added" ? "Added to favorites" : "Removed from favorites");
    },
    onError: (error) => toast.error(error.message),
  });

  const featured = automations?.find((a) => a.featured);

  const filtered = useMemo(() => {
    let list = (automations ?? []).filter((a) => !a.featured);
    if (category) list = list.filter((a) => a.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((a) =>
        [a.name, a.tagline, a.category, a.creator].some((v) => v.toLowerCase().includes(q)),
      );
    }
    if (tab === "recent") {
      list = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at));
    } else {
      list = [...list].sort((a, b) => Number(b.trending) - Number(a.trending));
    }
    if (sort === "popular") list = [...list].sort((a, b) => b.launches - a.launches);
    if (sort === "rating") list = [...list].sort((a, b) => b.rating - a.rating);
    if (sort === "cheapest") list = [...list].sort((a, b) => a.token_cost - b.token_cost);
    return list;
  }, [automations, category, query, tab, sort]);

  const recommended = (automations ?? []).filter((a) => a.rating >= 4.7 && !a.featured).slice(0, 3);
  const continueUsing = (automations ?? []).slice(0, 2);

  return (
    <AppShell>
      <div className="space-y-10 px-4 py-8 sm:px-8">
        {/* Featured hero */}
        {featured ? (
          <section className="relative overflow-hidden rounded-3xl gradient-hero p-8 text-ink-foreground shadow-lg sm:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.15fr_1fr] lg:items-center">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-ink-foreground/10 px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-widest">
                    New release
                  </span>
                  <span className="flex items-center gap-1 rounded-md bg-ink-foreground/10 px-2.5 py-1 font-mono text-[0.6875rem] uppercase tracking-widest">
                    <Flame className="size-3" /> Popular
                  </span>
                  <span className="font-mono text-[0.6875rem] uppercase tracking-widest opacity-70">
                    {featured.category}
                  </span>
                </div>
                <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] sm:text-5xl">
                  {featured.name}
                </h1>
                <p className="mt-4 max-w-xl text-sm leading-relaxed opacity-80">
                  {featured.description}
                </p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button asChild size="lg" variant="outline" className="border-0">
                    <Link to="/automations/$slug" params={{ slug: featured.slug }}>
                      <Play className="fill-current" /> Run now
                    </Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="ghost"
                    className="border border-ink-foreground/25 hover:bg-ink-foreground/10"
                  >
                    <Link to="/automations/$slug" params={{ slug: featured.slug }}>
                      View documentation
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="rounded-2xl border border-ink-foreground/15 bg-ink-foreground/5 p-6">
                <p className="font-mono text-[0.6875rem] uppercase tracking-widest opacity-70">
                  Live signal
                </p>
                <div className="mt-5 flex h-32 items-end gap-2">
                  {[38, 62, 44, 80, 56, 96, 70, 88].map((h, i) => (
                    <span
                      key={i}
                      style={{ height: `${h}%` }}
                      className="flex-1 rounded-t bg-primary/80"
                    />
                  ))}
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4 border-t border-ink-foreground/15 pt-4 text-center">
                  <Stat label="Launches" value={formatCount(featured.launches)} />
                  <Stat label="Runtime" value={featured.runtime} />
                  <Stat label="Rating" value={String(featured.rating)} />
                </div>
              </div>
            </div>
          </section>
        ) : null}

        {/* Search + categories */}
        <section className="space-y-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto_auto]">
            <div className="relative min-w-0">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setVisible(PAGE_SIZE);
                }}
                placeholder="Search AI models, tools, and creators…"
                className="h-11 w-full rounded-xl border border-border bg-surface pl-11 pr-4 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
              />
            </div>
            <div className="flex rounded-xl border border-border bg-surface p-1 shadow-sm">
              {(["trending", "recent"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "rounded-lg px-4 py-1.5 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors",
                    tab === t && "bg-secondary text-foreground",
                  )}
                >
                  {t === "trending" ? "Trending" : "Recently added"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="label-mono hidden sm:inline">Sort by</span>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="h-11 w-[170px] rounded-xl bg-surface">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Most popular</SelectItem>
                  <SelectItem value="rating">Highest rated</SelectItem>
                  <SelectItem value="cheapest">Lowest token cost</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 pr-1 text-muted-foreground">
              <Filter className="size-3.5" />
              <span className="label-mono">Categories</span>
            </span>
            <Chip active={category === null} onClick={() => setCategory(null)}>
              All
            </Chip>
            {CATEGORIES.map((c) => (
              <Chip
                key={c}
                active={category === c}
                onClick={() => {
                  setCategory(category === c ? null : c);
                  setVisible(PAGE_SIZE);
                }}
              >
                {c}
              </Chip>
            ))}
          </div>
        </section>

        {/* Grid */}
        <section>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                {category ?? (tab === "trending" ? "Trending automations" : "Recently added")}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {filtered.length} automations available
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid place-items-center py-20">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-20 text-center text-sm text-muted-foreground">
              No automations match your filters.
            </p>
          ) : (
            <>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.slice(0, visible).map((a) => (
                  <AutomationCard
                    key={a.id}
                    automation={a}
                    favorite={favorites?.includes(a.id)}
                    onToggleFavorite={(id) => toggleFavorite.mutate(id)}
                  />
                ))}
              </div>
              {visible < filtered.length && (
                <div className="mt-8 flex justify-center">
                  <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                    Load more automations
                  </Button>
                </div>
              )}
            </>
          )}
        </section>

        {/* Recommended + continue using */}
        <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="surface-card p-6">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h2 className="text-lg font-semibold">Recommended for you</h2>
            </div>
            <div className="mt-5 divide-y divide-border">
              {recommended.map((a) => (
                <Link
                  key={a.id}
                  to="/automations/$slug"
                  params={{ slug: a.slug }}
                  className="group flex items-center justify-between gap-4 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold group-hover:text-primary">
                      {a.name}
                    </p>
                    <p className="label-mono mt-0.5">
                      {a.category} · {a.creator}
                    </p>
                  </div>
                  <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </div>
          <div className="surface-card p-6">
            <h2 className="text-lg font-semibold">Continue using</h2>
            <div className="mt-5 space-y-3">
              {continueUsing.map((a) => (
                <Link
                  key={a.id}
                  to="/automations/$slug"
                  params={{ slug: a.slug }}
                  className="hover-lift block rounded-xl border border-border bg-surface-muted p-4"
                >
                  <p className="text-sm font-semibold">{a.name}</p>
                  <p className="label-mono mt-1">{a.token_cost} tokens per run</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[0.6875rem] uppercase tracking-widest opacity-70">{label}</p>
      <p className="mt-1 font-display text-lg font-bold">{value}</p>
    </div>
  );
}

function Chip({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/40 hover:text-foreground",
        active && "border-primary/40 bg-accent text-primary",
      )}
    >
      {children}
    </button>
  );
}
