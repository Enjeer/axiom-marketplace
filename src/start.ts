import * as Start from "@tanstack/react-start";
import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs CSRF protection automatically when src/start.ts is absent;
// defining this file opts out, so re-add it when the installed version exports
// it. Older/mismatched builds (e.g. on Vercel) may not, so resolve it defensively.
const maybeCreateCsrf = (Start as Record<string, unknown>)["createCsrfMiddleware"] as
  | ((opts: { filter: (ctx: { handlerType: string }) => boolean }) => unknown)
  | undefined;

const csrfMiddleware =
  typeof maybeCreateCsrf === "function"
    ? maybeCreateCsrf({ filter: (ctx) => ctx.handlerType === "serverFn" })
    : undefined;

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [errorMiddleware, ...(csrfMiddleware ? [csrfMiddleware as never] : [])],
}));
