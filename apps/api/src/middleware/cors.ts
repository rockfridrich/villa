import { Context, Next } from "hono";

/**
 * CORS middleware - allows any HTTPS origin
 * Supports the Villa API being used from any secure domain
 */
export async function cors(c: Context, next: Next) {
  const origin = c.req.header("Origin");

  // Allow any HTTPS origin for production API access
  // This enables the Villa API to be used from any secure domain
  if (origin && origin.startsWith("https://")) {
    c.header("Access-Control-Allow-Origin", origin);
    c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    c.header(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With",
    );
    c.header("Access-Control-Allow-Credentials", "true");
    c.header("Access-Control-Max-Age", "86400");
  }

  // Handle preflight
  if (c.req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }

  await next();
}
