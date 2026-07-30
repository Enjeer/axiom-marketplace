import type { ReactNode } from "react";
import { Terminal } from "lucide-react";

export function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-4" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.6 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.5c-.5 2.9-2.2 5.3-4.7 7l7.3 5.6c4.3-3.9 6.9-9.8 6.9-17.1z"
      />
      <path
        fill="#FBBC05"
        d="M10.4 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.8-6.1C1 16.4 0 20.1 0 24s1 7.6 2.6 10.8l7.8-6.1z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.5 0 11.9-2.1 15.9-5.9l-7.3-5.6c-2 1.4-4.7 2.3-8.6 2.3-6.4 0-11.7-3.7-13.6-9.1l-7.8 6.1C6.5 42.6 14.6 48 24 48z"
      />
    </svg>
  );
}

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background px-4 py-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] gradient-sheen" />
      <div className="relative mx-auto w-full max-w-md">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-ink text-ink-foreground">
              <Terminal className="size-5" />
            </span>
            <span className="font-display text-2xl font-bold tracking-tight">Nexus AI</span>
          </div>
          <p className="label-mono mt-4">Infrastructure for intelligence</p>
        </div>

        <div className="surface-card mt-10 p-8">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          {children}
        </div>

        {footer ? (
          <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
        ) : null}

        <div className="mt-8 flex justify-center gap-8">
          {["Privacy Policy", "Terms of Service", "Security"].map((item) => (
            <span key={item} className="label-mono">
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
