import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Reads the Cloudflare tunnel URL from .cloudflare-url file at repo root.
 *
 * Returns null if file doesn't exist or is empty.
 */
function readTunnelUrl(): string | null {
  const tunnelFile = resolve(import.meta.dir, "../../../.cloudflare-url");

  if (existsSync(tunnelFile)) {
    const url = readFileSync(tunnelFile, "utf-8").trim();
    return url || null;
  }

  return null;
}

/**
 * Get the publicly accessible frontend URL.
 *
 * Used for:
 * - Clickable links in WhatsApp notifications (agent assignments, contract uploads)
 * - CORS origin validation in backend
 *
 * Priority: .cloudflare-url > http://localhost:5173
 *
 * In development, this returns the Cloudflare tunnel URL that exposes the frontend.
 */
export function getFrontendUrl(): string {
  return readTunnelUrl() ?? "http://localhost:5173";
}

/**
 * Get the backend URL for server-to-server communication.
 *
 * Used for:
 * - Notifier forwarding messages to backend /webhook endpoint
 * - Frontend SSR calling backend API endpoints
 * - Frontend webhook proxy calling backend
 *
 * Constructs URL from PORT environment variable.
 */
export function getBackendUrl(): string {
  const port = process.env.PORT ?? "3000";
  return `http://localhost:${port}`;
}

/**
 * Get the public URL for static assets accessible from external services.
 *
 * Used for:
 * - WhatsApp Cloud API image URLs (images sent to users)
 *
 * Priority: .cloudflare-url > http://localhost:{PORT}
 *
 * In development, this returns the Cloudflare tunnel URL. Vite proxies
 * /static/* requests to the backend, making images accessible to WhatsApp.
 * In production, this should be explicitly set via PUBLIC_URL env var.
 */
export function getPublicUrl(): string {
  const tunnelUrl = readTunnelUrl();
  if (tunnelUrl) return tunnelUrl;

  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL;

  const port = process.env.PORT ?? "3000";
  return `http://localhost:${port}`;
}

/**
 * Get the notifier service URL for backend-to-notifier communication.
 *
 * Used for:
 * - Backend sending direct messages via notifier
 * - Backend notifying teams via notifier
 *
 * Constructs URL from NOTIFIER_PORT environment variable.
 */
export function getNotifierUrl(): string {
  const port = process.env.NOTIFIER_PORT ?? "3001";
  return `http://localhost:${port}`;
}
