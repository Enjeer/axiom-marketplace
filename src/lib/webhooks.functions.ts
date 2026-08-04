import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { WEBHOOK_SLUGS } from "@/lib/webhooks.config.server";

type WebhookInput = {
  slug: string;
  linkedinUrl?: string;
  criteria?: string;
  fileName?: string;
  fileType?: string;
  fileBase64?: string;
};

function validate(input: WebhookInput): WebhookInput {
  if (!input || typeof input.slug !== "string" || !(WEBHOOK_SLUGS as readonly string[]).includes(input.slug)) {
    throw new Error("Unknown automation");
  }
  if (input.linkedinUrl && input.linkedinUrl.length > 500) throw new Error("URL too long");
  if (input.criteria && input.criteria.length > 5000) throw new Error("Criteria too long");
  if (input.fileBase64 && input.fileBase64.length > 28_000_000) throw new Error("File too large");
  return input;
}

/** Calls the n8n webhook for an automation and returns its raw response text. */
export const runWebhookTool = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(validate)
  .handler(async ({ data }) => {
    const { getWebhookUrl, getWebhookTimeoutMs } = await import("@/lib/webhooks.config.server");
    const url = getWebhookUrl(data.slug);
    if (!url) throw new Error("Unknown automation");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), getWebhookTimeoutMs());

    try {
      let response: Response;
      if (data.slug === "pdf-extractor") {
        if (!data.fileBase64) throw new Error("No PDF provided");
        const bytes = Uint8Array.from(atob(data.fileBase64), (c) => c.charCodeAt(0));
        const form = new FormData();
        form.append(
          "file",
          new Blob([bytes], { type: data.fileType || "application/pdf" }),
          data.fileName || "document.pdf",
        );
        response = await fetch(url, { method: "POST", body: form, signal: controller.signal });
      } else {
        response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            linkedin_url: data.linkedinUrl ?? "",
            qualification_criteria: data.criteria ?? "",
          }),
          signal: controller.signal,
        });
      }

      const text = await response.text();
      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}. ${text.slice(0, 300)}`);
      }
      return { output: text };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Webhook request failed";
      throw new Error(message === "The operation was aborted." ? "Webhook timed out" : message);
    } finally {
      clearTimeout(timer);
    }
  });
