import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Account management — Nexus AI" },
      {
        name: "description",
        content: "Manage your Nexus AI profile, plan, token consumption and security preferences.",
      },
      { property: "og:title", content: "Account management — Nexus AI" },
      {
        property: "og:description",
        content: "Profile, billing and security settings for your Nexus AI workspace.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", "settings"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", auth.user.id)
        .maybeSingle();
      return { email: auth.user.email ?? "", ...data };
    },
  });

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? "");
    setUsername(profile.username ?? "");
    setBio(profile.bio ?? "");
  }, [profile]);

  async function save() {
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, username, bio })
      .eq("id", auth.user.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Profile updated");
  }

  return (
    <AppShell>
      <div className="space-y-8 px-4 py-8 sm:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-mono">Personal settings</p>
            <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">Account management</h1>
          </div>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="animate-spin" />} Save changes
          </Button>
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-24">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <section className="surface-card p-6">
              <div className="flex items-center justify-between">
                <h2 className="label-mono">Public profile</h2>
                <ShieldCheck className="size-4 text-success" />
              </div>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullname">Full name</Label>
                  <Input
                    id="fullname"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={profile?.email ?? ""} readOnly className="h-11" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="bio">Professional bio</Label>
                  <Textarea
                    id="bio"
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Senior systems architect. Enthusiast of low-latency AI inference."
                  />
                </div>
              </div>
            </section>

            <div className="space-y-6">
              <section className="surface-card p-6">
                <h2 className="label-mono">Token consumption</h2>
                <p className="mt-4 font-display text-4xl font-extrabold">
                  {(profile?.credits ?? 0).toLocaleString()}
                </p>
                <p className="label-mono mt-1">credits remaining</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.min(100, ((profile?.credits ?? 0) / 5000) * 100)}%` }}
                  />
                </div>
              </section>

              <section className="surface-card p-6">
                <h2 className="label-mono">Subscription</h2>
                <p className="mt-3 text-lg font-semibold capitalize">{profile?.plan ?? "free"} plan</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Paid plans and credit packs are coming soon.
                </p>
                <Button className="mt-4 w-full" disabled>
                  Upgrade plan
                </Button>
              </section>

              <section className="surface-card p-6">
                <h2 className="label-mono">Security &amp; privacy</h2>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Login alerts</p>
                      <p className="text-xs text-muted-foreground">Notify me on new sign-ins</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={async () => {
                      if (!profile?.email) return;
                      const { error } = await supabase.auth.resetPasswordForEmail(profile.email, {
                        redirectTo: `${window.location.origin}/reset-password`,
                      });
                      if (error) toast.error(error.message);
                      else toast.success("Password reset link sent");
                    }}
                  >
                    Change password
                  </Button>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
