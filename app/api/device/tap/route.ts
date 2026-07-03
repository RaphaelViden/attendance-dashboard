import { verifyDeviceSecret } from "@/lib/auth";
import { processDeviceTap } from "@/lib/repository";
import { jsonError, jsonOk } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const secret = request.headers.get("x-device-secret") || body.device_secret;
    if (!verifyDeviceSecret(secret)) return jsonOk({ error: "Device secret tidak valid." }, 401);
    const result = await processDeviceTap({
      rfidUid: String(body.rfid_uid || body.card_uid || body.uid || ""),
      deviceId: String(body.device_id || body.device_name || "attendance-esp32-001"),
      deviceName: body.device_name ? String(body.device_name) : undefined,
      powerMode: body.power_mode === "Battery" ? "Battery" : "AC",
      battery: Number.isFinite(Number(body.battery)) ? Number(body.battery) : 100
    });
    return jsonOk(result);
  } catch (error) {
    return jsonError(error, "Tap RFID gagal diproses.");
  }
}
