import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-server";
import { recordTap } from "@/lib/store";

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => ({}));
  if (!payload.rfid_uid && !payload.card_uid) {
    return NextResponse.json({ ok: false, message: "rfid_uid wajib diisi." }, { status: 400 });
  }

  const configuredSecret = process.env.DEVICE_SECRET || "DEV-SECRET-CHANGE-ME";
  if (payload.device_secret && payload.device_secret !== configuredSecret) {
    return NextResponse.json({ ok: false, message: "Device secret tidak valid." }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const uid = String(payload.rfid_uid || payload.card_uid).trim().replace(/\s+/g, ":").replace(/-/g, ":").toUpperCase();
    const deviceName = payload.device_id || payload.device_name || "ESP32-ENTRANCE-01";
    const tappedAt = payload.tapped_at || new Date().toISOString();
    const dayStart = new Date(tappedAt);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(tappedAt);
    dayEnd.setHours(23, 59, 59, 999);

    const { data: card, error: cardError } = await supabase
      .from("rfid_cards")
      .select("uid, employee_id, status, employee:profiles(id, full_name, email, department, shift)")
      .eq("uid", uid)
      .maybeSingle();

    if (cardError) return NextResponse.json({ ok: false, message: cardError.message }, { status: 500 });
    if (!card || card.status !== "active" || !card.employee_id) {
      return NextResponse.json({ ok: false, message: "Kartu RFID belum terdaftar atau tidak aktif.", rfid_uid: uid }, { status: 404 });
    }

    let deviceId: string | null = null;
    const { data: device } = await supabase
      .from("devices")
      .select("id")
      .eq("name", deviceName)
      .maybeSingle();

    if (device?.id) {
      deviceId = device.id;
      await supabase.from("devices").update({ status: "online", last_seen_at: new Date().toISOString() }).eq("id", device.id);
    } else {
      const { data: inserted } = await supabase
        .from("devices")
        .insert({ name: deviceName, location: "Kantor Utama", status: "online", last_seen_at: new Date().toISOString() })
        .select("id")
        .single();
      deviceId = inserted?.id ?? null;
    }

    const { data: taps } = await supabase
      .from("attendance_taps")
      .select("tap_type, tapped_at")
      .eq("employee_id", card.employee_id)
      .gte("tapped_at", dayStart.toISOString())
      .lte("tapped_at", dayEnd.toISOString())
      .order("tapped_at", { ascending: true });

    const count = taps?.length ?? 0;
    const eventType = count === 0 ? "MASUK" : count === 1 ? "MULAI_ISTIRAHAT" : count === 2 ? "SELESAI_ISTIRAHAT" : count === 3 ? "PULANG" : "EXTRA_TAP";

    const { data: tap, error: insertError } = await supabase
      .from("attendance_taps")
      .insert({
        uid,
        employee_id: card.employee_id,
        device_id: deviceId,
        tapped_at: tappedAt,
        tap_type: eventType,
        notes: eventType === "EXTRA_TAP" ? "Tap tambahan setelah 4 event utama" : null
      })
      .select("id, tapped_at, tap_type")
      .single();

    if (insertError) return NextResponse.json({ ok: false, message: insertError.message }, { status: 500 });
    return NextResponse.json({ ok: true, event_type: eventType, tap, employee: card.employee });
  }

  const result = recordTap({
    rfid_uid: payload.rfid_uid || payload.card_uid,
    device_id: payload.device_id || payload.device_name,
    device_secret: payload.device_secret,
    tapped_at: payload.tapped_at
  });

  return NextResponse.json(result, { status: result.status });
}
