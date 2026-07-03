import { requireAdmin } from "@/lib/auth";
import { addActivityLog, exportDatabase } from "@/lib/repository";
import { jsonError, jsonOk } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    requireAdmin(request);
    const data = await exportDatabase();
    await addActivityLog({ action: "Backup Triggered", user: "admin", details: "Backup JSON dibuat dari dashboard.", type: "success" });
    return jsonOk({ ok: true, backup: { filename: `tappresensi-backup-${new Date().toISOString().slice(0, 10)}.json`, exportedAt: data.exportedAt } });
  } catch (error) {
    return jsonError(error, "Backup gagal dibuat.");
  }
}
