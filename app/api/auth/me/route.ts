import { bearerToken, verifySessionToken } from "@/lib/auth";
import { jsonOk } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = verifySessionToken(bearerToken(request));
  return jsonOk({ user }, user ? 200 : 401);
}
