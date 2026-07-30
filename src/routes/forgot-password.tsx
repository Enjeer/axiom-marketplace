import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Loader2, MailCheck } from "lucide-react";
import { toast } from "sonner";

import { AuthLayout } from "@/components/auth-layout";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset your password — Nexus AI" },
      {
        name: "description",
        content: "Request a secure password reset link for your Nexus AI account.",
      },
      { property: "og:title", content: "Reset your password — Nexus AI" },
      { property: "og:description", content: "Get a password reset link for Nexus AI." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { sendPasswordReset } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send reset link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="We'll email you a secure link to choose a new one."
      footer={
        <Link to="/login" className="font-semibold text-primary underline underline-offset-4">
          Back to log in
        </Link>
      }
    >
      {sent ? (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-border bg-surface-muted p-4">
          <MailCheck className="mt-0.5 size-5 text-success" />
          <p className="text-sm text-muted-foreground">
            If an account exists for <span className="font-semibold text-foreground">{email}</span>,
            a reset link is on its way.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="h-11"
              required
            />
          </div>
          <Button type="submit" variant="ink" size="lg" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : null}
            Send reset link
            {!loading && <ArrowRight />}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
