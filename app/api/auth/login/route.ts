import { jsonError, jsonOk } from "@/lib/http";
import { createSessionToken, validateAdminCredentials } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = validateAdminCredentials(String(body.username || ""), String(body.password || ""));
    if (!user) return jsonOk({ error: "Username atau password admin tidak valid." }, 401);
    return jsonOk({ token: createSessionToken(user), user });
  } catch (error) {
    return jsonError(error, "Login gagal.");
  }
}
