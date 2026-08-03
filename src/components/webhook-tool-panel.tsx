import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, FileText, Loader2, Play, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useTokens } from "@/hooks/use-tokens";
import { runWebhookTool } from "@/lib/webhooks.functions";
import type { Automation } from "@/lib/catalog";

export const WEBHOOK_TOOL_SLUGS = ["sales-lead-qualifier", "pdf-extractor"] as const;

export function isWebhookTool(slug: string) {
  return (WEBHOOK_TOOL_SLUGS as readonly string[]).includes(slug);
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });
}

export function WebhookToolPanel({
  automation,
  onResult,
}: {
  automation: Automation;
  onResult: (output: string) => void;
}) {
  const { user } = useAuth();
  const { tokens, incrementUsage } = useTokens();
  const queryClient = useQueryClient();

  const isPdf = automation.slug === "pdf-extractor";
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [criteria, setCriteria] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const run = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      const started = Date.now();

      let payload: Parameters<typeof runWebhookTool>[0]["data"];
      if (isPdf) {
        if (!file) throw new Error("Select a PDF file first");
        payload = {
          slug: automation.slug,
          fileName: file.name,
          fileType: file.type || "application/pdf",
          fileBase64: await fileToBase64(file),
        };
      } else {
        if (!linkedinUrl.trim()) throw new Error("Enter a LinkedIn URL");
        if (!criteria.trim()) throw new Error("Describe your qualification criteria");
        payload = {
          slug: automation.slug,
          linkedinUrl: linkedinUrl.trim(),
          criteria: criteria.trim(),
        };
      }

      // Webhook first — tokens are only spent when it succeeds.
      const { output } = await runWebhookTool({ data: payload });

      await incrementUsage(automation.token_cost);

      await supabase.from("executions").insert({
        user_id: user.id,
        automation_id: automation.id,
        status: "success",
        tokens_used: automation.token_cost,
        duration_ms: Date.now() - started,
        config: isPdf
          ? { fileName: file?.name ?? "" }
          : { linkedinUrl: linkedinUrl.trim(), criteria: criteria.trim() },
        result: output,
      });

      return output;
    },
    onSuccess: (output) => {
      setErrorMessage(null);
      onResult(output);
      queryClient.invalidateQueries({ queryKey: ["executions"] });
      toast.success(`Run complete · ${automation.token_cost} tokens used`);
    },
    onError: (error: Error) => {
      setErrorMessage(error.message);
      toast.error(error.message);
    },
  });

  return (
    <section className="surface-card overflow-hidden">
      <div className="border-b border-border px-6 py-4">
        <h2 className="label-mono">Bot configuration</h2>
      </div>
      <div className="space-y-5 p-6">
        {isPdf ? (
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface-muted px-6 py-10 text-center transition-colors hover:border-primary/40">
            {file ? (
              <FileText className="size-5 text-primary" />
            ) : (
              <Upload className="size-5 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">
              {file ? file.name : "Drop a PDF file, or browse"}
            </span>
            <span className="label-mono">PDF up to 20 MB</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                setErrorMessage(null);
                setFile(e.target.files?.[0] ?? null);
              }}
            />
          </label>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input
                id="linkedin"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                placeholder="https://www.linkedin.com/in/jane-doe"
                maxLength={500}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="criteria">Qualification criteria</Label>
              <Textarea
                id="criteria"
                rows={6}
                value={criteria}
                onChange={(e) => setCriteria(e.target.value)}
                maxLength={5000}
                placeholder="B2B SaaS, 50+ employees, decision maker in RevOps or Sales…"
                className="bg-surface-muted text-sm"
              />
            </div>
          </>
        )}

        {errorMessage && (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div>
              <p className="text-sm font-semibold text-destructive">Run failed</p>
              <p className="mt-1 text-sm text-muted-foreground">{errorMessage}</p>
              <p className="label-mono mt-2">No tokens were deducted.</p>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t border-border pt-5">
          <Button variant="ink" size="lg" onClick={() => run.mutate()} disabled={run.isPending}>
            {run.isPending ? <Loader2 className="animate-spin" /> : <Play className="fill-current" />}
            {run.isPending ? "Running…" : "Run automation"}
          </Button>
          <Button
            variant="ghost"
            disabled={run.isPending}
            onClick={() => {
              setLinkedinUrl("");
              setCriteria("");
              setFile(null);
              setErrorMessage(null);
            }}
          >
            <RotateCcw /> Reset
          </Button>
        </div>
      </div>
    </section>
  );
}
