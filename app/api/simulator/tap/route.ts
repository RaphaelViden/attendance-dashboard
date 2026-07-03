import { requireAdmin } from "@/lib/auth";
import { processDeviceTap } from "@/lib/repository";
import { jsonError, jsonOk } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    requireAdmin(request);
    const body = await request.json();
    const result = await processDeviceTap({
      rfidUid: String(body.rfidUid || body.rfid_uid || body.card_uid || ""),
      deviceId: String(body.deviceId || body.device_id || "dashboard-simulator"),
      deviceName: "Dashboard Simulator",
      powerMode: "AC",
      battery: 100
    });
    return jsonOk(result);
  } catch (error) {
    return jsonError(error, "Simulator gagal memproses tap.");
  }
}
