import { createFileRoute, redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Nexus AI — AI Automation Marketplace" },
      {
        name: "description",
        content:
          "Nexus AI is the control layer for production-ready AI automations. Sign in to run, monitor and manage them.",
      },
      { property: "og:title", content: "Nexus AI — AI Automation Marketplace" },
      {
        property: "og:description",
        content: "Run hundreds of production-ready AI automations from one console.",
      },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    throw redirect({ to: data.session ? "/dashboard" : "/login", replace: true });
  },
  component: () => (
    <div className="grid min-h-screen place-items-center bg-background">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  ),
});
