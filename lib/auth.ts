import crypto from "crypto";
import type { AdminUser } from "./types";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;

function secret(): string {
  return process.env.AUTH_SECRET || "dev-auth-secret-change-me";
}

function base64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function validateAdminCredentials(username: string, password: string): AdminUser | null {
  const validUser = process.env.ADMIN_USERNAME || "admin";
  const validPassword = process.env.ADMIN_PASSWORD || "admin123";
  if (username !== validUser || password !== validPassword) return null;
  return { id: "admin-001", username, name: "Administrator Utama", role: "Super Admin" };
}

export function createSessionToken(user: AdminUser): string {
  const payload = base64url(JSON.stringify({ sub: user.id, username: user.username, name: user.name, role: user.role, exp: Date.now() + TOKEN_TTL_MS }));
  return `${payload}.${sign(payload)}`;
}

export function verifySessionToken(token: string | null | undefined): AdminUser | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || sign(payload) !== signature) return null;
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    if (!decoded.exp || decoded.exp < Date.now()) return null;
    return { id: decoded.sub, username: decoded.username, name: decoded.name, role: decoded.role };
  } catch {
    return null;
  }
}

export function bearerToken(request: Request): string | null {
  const header = request.headers.get("authorization") || "";
  if (!header.toLowerCase().startsWith("bearer ")) return null;
  return header.slice(7).trim();
}

export function requireAdmin(request: Request): AdminUser {
  const user = verifySessionToken(bearerToken(request));
  if (!user) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return user;
}

export function verifyDeviceSecret(value: string | null | undefined): boolean {
  const expected = process.env.DEVICE_SECRET || "DEV-SECRET-CHANGE-ME";
  if (!value) return false;
  const a = Buffer.from(value);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
