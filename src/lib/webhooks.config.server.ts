/**
 * n8n webhook endpoints, resolved from environment variables at call time.
 * Keyed by automation slug so clients can never pick an arbitrary URL.
 */
export const WEBHOOK_SLUGS = ["sales-lead-qualifier", "pdf-extractor"] as const;

export type WebhookSlug = (typeof WEBHOOK_SLUGS)[number];

export function getWebhookUrl(slug: string): string | undefined {
  const base = (process.env["N8N_BASE_URL"] ?? "https://n8n.aorm.online").replace(/\/+$/, "");
  const map: Record<string, string> = {
    "sales-lead-qualifier":
      process.env["N8N_WEBHOOK_SALES_LEAD_QUALIFIER"] ?? `${base}/webhook/sales-lead-qualifier`,
    "pdf-extractor":
      process.env["N8N_WEBHOOK_PDF_EXTRACTOR"] ?? `${base}/webhook-test/extract-pdf`,
  };
  return map[slug];
}

export function getWebhookTimeoutMs(): number {
  const raw = Number(process.env["N8N_WEBHOOK_TIMEOUT_MS"]);
  return Number.isFinite(raw) && raw > 0 ? raw : 120_000;
}
