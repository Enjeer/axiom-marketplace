import { Link } from "@tanstack/react-router";
import { Heart, Play, Star, Timer, Zap } from "lucide-react";

import { accentClass, formatCount, iconFor, tierLabel, type Automation } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  automation: Automation;
  favorite?: boolean;
  onToggleFavorite?: (id: string) => void;
};

export function AutomationCard({ automation, favorite, onToggleFavorite }: Props) {
  const Icon = iconFor(automation.icon);

  return (
    <article className="surface-card hover-lift group relative flex flex-col p-5">
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "grid size-11 place-items-center rounded-xl border border-border bg-surface-muted",
            accentClass(automation.accent),
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
            onClick={() => onToggleFavorite?.(automation.id)}
            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
          >
            <Heart className={cn("size-4", favorite && "fill-destructive text-destructive")} />
          </button>
          <div className="text-right">
            <p className="font-mono text-[0.6875rem] font-semibold tracking-wider text-primary">
              {tierLabel(automation.tier)}
            </p>
            <p className="label-mono">{automation.token_cost} tk</p>
          </div>
        </div>
      </div>

      <Link
        to="/automations/$slug"
        params={{ slug: automation.slug }}
        className="mt-4 block focus:outline-none"
      >
        <h3 className="text-base font-semibold tracking-tight group-hover:text-primary">
          {automation.name}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{automation.tagline}</p>
      </Link>

      <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
        <Row label="Category" value={automation.category} />
        <Row label="Creator" value={automation.creator} />
        <Row label="Launches" value={formatCount(automation.launches)} />
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Star className="size-3.5 fill-warning text-warning" />
          <span className="font-mono font-semibold text-foreground">{automation.rating}</span>
        </span>
        <span className="flex items-center gap-1 font-mono">
          <Timer className="size-3.5" /> {automation.runtime}
        </span>
        <span className="flex items-center gap-1 font-mono">
          <Zap className="size-3.5" /> {automation.success_rate}%
        </span>
      </div>

      <Button asChild variant="ink" className="mt-5 w-full">
        <Link to="/automations/$slug" params={{ slug: automation.slug }}>
          <Play className="fill-current" /> Run
        </Link>
      </Button>
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="label-mono">{label}</span>
      <span className="truncate font-mono text-xs font-medium">{value}</span>
    </div>
  );
}
