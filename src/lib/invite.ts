import { Invite, InviteStatus } from "@/types";

/**
 * Generate a cryptographically random 32-character URL-safe token.
 */
export function generateInviteToken(): string {
  const bytes = new Uint8Array(24); // 24 bytes → 32 base64url chars
  crypto.getRandomValues(bytes);
  let base64 = "";
  if (typeof window !== "undefined") {
    base64 = btoa(String.fromCharCode(...bytes));
  } else {
    base64 = Buffer.from(bytes).toString("base64");
  }
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Days until expiry (default 7 days).
 */
export const INVITE_EXPIRY_DAYS = 7;

export function computeExpiresAt(days: number = INVITE_EXPIRY_DAYS): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Compute effective status considering expiry.
 */
export function effectiveStatus(invite: Pick<Invite, "status" | "expiresAt">): InviteStatus {
  if (invite.status !== "pending") return invite.status;
  if (invite.expiresAt.getTime() < Date.now()) return "expired";
  return "pending";
}

/**
 * Build the full invite accept URL for the current environment.
 */
export function buildInviteLink(token: string, origin?: string): string {
  const base =
    origin ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/invite/accept?token=${encodeURIComponent(token)}`;
}

/**
 * Format remaining time until expiry in Thai.
 */
export function formatTimeRemaining(expiresAt: Date): string {
  const ms = expiresAt.getTime() - Date.now();
  if (ms <= 0) return "หมดอายุ";
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (days > 0) return `อีก ${days} วัน ${hours} ชม.`;
  return `อีก ${hours} ชม.`;
}
