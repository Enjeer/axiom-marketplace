import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  Copy,
  Download,
  Heart,
  Loader2,
  Play,
  RotateCcw,
  Save,
  Share2,
  Star,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isWebhookTool, WebhookToolPanel } from "@/components/webhook-tool-panel";
import { accentClass, formatCount, iconFor, type Automation } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/automations/$slug")({
  head: () => ({
    meta: [
      { title: "Automation workspace — Nexus AI" },
      {
        name: "description",
        content: "Configure inputs, review cost and runtime, then launch an AI automation.",
      },
      { property: "og:title", content: "Automation workspace — Nexus AI" },
      {
        property: "og:description",
        content: "The configure-and-run workspace for every Nexus AI automation.",
      },
    ],
  }),
  component: AutomationDetail,
});

const DEFAULT_CONFIG = {
  target: "",
  depth: "level-2",
  prompt: '{\n  "action": "extract",\n  "fields": ["name", "title", "company"]\n}',
  notify: true,
  dryRun: false,
};

function AutomationDetail() {
  const { slug } = Route.useParams();
  const queryClient = useQueryClient();
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [advanced, setAdvanced] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const { data: automation, isLoading } = useQuery({
    queryKey: ["automation", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("automations")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      return data as Automation | null;
    },
  });

  const { data: executions } = useQuery({
    queryKey: ["executions", automation?.id],
    enabled: Boolean(automation?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("executions")
        .select("*")
        .eq("automation_id", automation!.id)
        .order("created_at", { ascending: false })
        .limit(6);
      if (error) throw error;
      return data;
    },
  });

  const run = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user || !automation) throw new Error("Not signed in");
      const output = `Run completed for ${automation.name}.\n\nTarget: ${
        config.target || "(not set)"
      }\nDepth: ${config.depth}\n\n— 3 structured records returned, ready for export.`;
      const { error } = await supabase.from("executions").insert({
        user_id: auth.user.id,
        automation_id: automation.id,
        status: "success",
        tokens_used: automation.token_cost,
        duration_ms: 1400,
        config,
        result: output,
      });
      if (error) throw error;
      return output;
    },
    onSuccess: (output) => {
      setResult(output);
      queryClient.invalidateQueries({ queryKey: ["executions"] });
      toast.success("Automation executed");
    },
    onError: (error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="grid place-items-center py-32">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  if (!automation) {
    return (
      <AppShell>
        <div className="px-8 py-24 text-center">
          <h1 className="text-2xl font-bold">Automation not found</h1>
          <Button asChild className="mt-6">
            <Link to="/marketplace">Back to marketplace</Link>
          </Button>
        </div>
      </AppShell>
    );
  }

  const Icon = iconFor(automation.icon);

  return (
    <AppShell>
      <div className="space-y-8 px-4 py-8 sm:px-8">
        <p className="label-mono">
          Marketplace › {automation.category} › {automation.name}
        </p>

        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span
              className={cn(
                "grid size-14 shrink-0 place-items-center rounded-2xl border border-border bg-surface",
                accentClass(automation.accent),
              )}
            >
              <Icon className="size-6" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-3xl font-extrabold sm:text-4xl">{automation.name}</h1>
              <p className="label-mono mt-1.5">
                {automation.creator} · {automation.version} · {formatCount(automation.launches)}{" "}
                launches
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm">
              <Star className="size-3.5 fill-warning text-warning" />
              <span className="font-mono font-semibold">{automation.rating}</span>
            </span>
            <Button variant="outline" size="icon" aria-label="Favorite">
              <Heart />
            </Button>
            <Button variant="outline" size="icon" aria-label="Share">
              <Share2 />
            </Button>
            <Button
              variant="ink"
              onClick={() => run.mutate()}
              disabled={run.isPending}
              className="hidden sm:inline-flex"
            >
              {run.isPending ? <Loader2 className="animate-spin" /> : <Play className="fill-current" />}
              Run automation
            </Button>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <section className="surface-card p-6">
              <h2 className="text-lg font-semibold">About this automation</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {automation.description}
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <Mini title="Benefit" body="Removes manual work from a repeatable, high-volume task." />
                <Mini title="Use case" body={`Teams in ${automation.category} running weekly cycles.`} />
                <Mini title="Output" body="Structured records plus a human-readable summary." />
              </div>
            </section>

            <section className="surface-card overflow-hidden">
              <div className="border-b border-border px-6 py-4">
                <h2 className="label-mono">Bot configuration</h2>
              </div>
              <div className="space-y-5 p-6">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="target">Target input</Label>
                    <Input
                      id="target"
                      value={config.target}
                      onChange={(e) => setConfig({ ...config, target: e.target.value })}
                      placeholder="linkedin.com/sales"
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="depth">Processing depth</Label>
                    <Select
                      value={config.depth}
                      onValueChange={(v) => setConfig({ ...config, depth: v })}
                    >
                      <SelectTrigger id="depth" className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="level-1">Level 1 (Fast)</SelectItem>
                        <SelectItem value="level-2">Level 2 (Deep)</SelectItem>
                        <SelectItem value="level-3">Level 3 (Exhaustive)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="prompt">Initial prompt (JSON)</Label>
                    <span className="label-mono">Format: valid JSON</span>
                  </div>
                  <Textarea
                    id="prompt"
                    rows={6}
                    value={config.prompt}
                    onChange={(e) => setConfig({ ...config, prompt: e.target.value })}
                    className="bg-surface-muted font-mono text-xs"
                  />
                </div>

                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface-muted px-6 py-8 text-center transition-colors hover:border-primary/40">
                  <Upload className="size-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Drop a source file, or browse</span>
                  <span className="label-mono">CSV, PDF, JSON up to 20 MB</span>
                  <input type="file" className="hidden" />
                </label>

                <div className="space-y-3 rounded-xl border border-border p-4">
                  <ToggleRow
                    label="Notify me when the run finishes"
                    checked={config.notify}
                    onChange={(v) => setConfig({ ...config, notify: v })}
                  />
                  <ToggleRow
                    label="Dry run (validate without consuming tokens)"
                    checked={config.dryRun}
                    onChange={(v) => setConfig({ ...config, dryRun: v })}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setAdvanced((v) => !v)}
                  className="flex w-full items-center justify-between rounded-xl border border-border px-4 py-3 transition-colors hover:bg-secondary"
                >
                  <span className="label-mono">Advanced technical settings</span>
                  <ChevronDown
                    className={cn("size-4 transition-transform", advanced && "rotate-180")}
                  />
                </button>
                {advanced && (
                  <div className="grid gap-5 rounded-xl border border-border bg-surface-muted p-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="timeout">Timeout (seconds)</Label>
                      <Input id="timeout" defaultValue="120" className="h-11 bg-surface" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="retries">Max retries</Label>
                      <Input id="retries" defaultValue="3" className="h-11 bg-surface" />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="webhook">Result webhook URL</Label>
                      <Input
                        id="webhook"
                        placeholder="https://hooks.example.com/nexus"
                        className="h-11 bg-surface"
                      />
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 border-t border-border pt-5">
                  <Button
                    variant="ink"
                    size="lg"
                    onClick={() => run.mutate()}
                    disabled={run.isPending}
                  >
                    {run.isPending ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Play className="fill-current" />
                    )}
                    Run automation
                  </Button>
                  <Button variant="outline" onClick={() => toast.success("Configuration saved")}>
                    <Save /> Save configuration
                  </Button>
                  <Button variant="outline" onClick={() => toast.success("Configuration duplicated")}>
                    <Copy /> Duplicate
                  </Button>
                  <Button variant="ghost" onClick={() => setConfig(DEFAULT_CONFIG)}>
                    <RotateCcw /> Reset
                  </Button>
                </div>
              </div>
            </section>

            {result && (
              <section className="surface-card p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Result preview</h2>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(result);
                        toast.success("Copied to clipboard");
                      }}
                    >
                      <Copy /> Copy
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toast.success("Download started")}>
                      <Download /> Download
                    </Button>
                  </div>
                </div>
                <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-xl border border-border bg-surface-muted p-5 font-mono text-xs leading-relaxed">
                  {result}
                </pre>
              </section>
            )}

            <section className="surface-card overflow-hidden">
              <div className="border-b border-border px-6 py-4">
                <h2 className="label-mono">Execution history</h2>
              </div>
              {executions && executions.length > 0 ? (
                <div className="divide-y divide-border">
                  {executions.map((e) => (
                    <div
                      key={e.id}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-4 sm:flex sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-semibold text-primary">
                          #{e.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="label-mono mt-1">{new Date(e.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-5 font-mono text-xs">
                        <span
                          className={cn(
                            "font-semibold",
                            e.status === "success" ? "text-success" : "text-destructive",
                          )}
                        >
                          {e.status}
                        </span>
                        <span>{e.tokens_used} tk</span>
                        <span>{(e.duration_ms / 1000).toFixed(1)}s</span>
                        <Button size="sm" variant="ghost" onClick={() => setResult(e.result ?? "")}>
                          Quick view
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => run.mutate()}>
                          Re-run
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No runs yet for this automation.
                </p>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <div className="surface-card p-6">
              <h2 className="label-mono">Cost &amp; usage</h2>
              <p className="mt-4 font-display text-4xl font-extrabold">
                {automation.token_cost}
                <span className="ml-2 text-base font-medium text-muted-foreground">tokens/run</span>
              </p>
              <div className="mt-6 space-y-3 border-t border-border pt-5 text-sm">
                <Row label="Expected runtime" value={automation.runtime} />
                <Row label="Avg. execution" value="1.2s" />
                <Row label="Success rate" value={`${automation.success_rate}%`} />
                <Row label="Total launches" value={formatCount(automation.launches)} />
                <Row label="Tier" value={automation.tier.toUpperCase()} />
              </div>
            </div>

            <div className="surface-card p-6">
              <h2 className="label-mono">Instance metadata</h2>
              <div className="mt-4 space-y-3 text-sm">
                <Row label="Runtime" value="Node.js 20.x" />
                <Row label="Region" value="us-east-1" />
                <Row label="Memory limit" value="512 MB" />
                <Row label="Version" value={automation.version} />
              </div>
            </div>

            <div className="rounded-2xl border border-primary/20 bg-accent p-6">
              <p className="text-sm font-semibold text-primary">Developer tip</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Trigger this automation from your own stack via webhook using the deployment ID{" "}
                <span className="font-mono text-xs">dep_{automation.slug.slice(0, 6)}</span>.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="label-mono">{label}</span>
      <span className="font-mono text-xs font-semibold">{value}</span>
    </div>
  );
}

function Mini({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted p-4">
      <p className="label-mono">{title}</p>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
