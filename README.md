# Kantor Presence Dashboard

Dashboard presensi profesional untuk project RFID kantor. Stack:

- Next.js App Router
- TypeScript
- Supabase-ready database
- Supabase REST-ready without extra client dependency
- Vercel deployment
- Role karyawan/admin
- Export `.xlsx` khusus admin

## Fitur

### Karyawan

- Melihat dashboard presensi.
- Melihat rekap Senin-Minggu.
- Melihat rekap bulanan.
- Tidak bisa edit presensi manual.
- Tidak bisa download rekap bulanan.

### Admin

- Melihat seluruh dashboard.
- Koreksi/checklist presensi manual.
- Download rekap bulanan `.xlsx`.
- Monitoring device RFID.
- Nanti dapat dikembangkan untuk registrasi kartu RFID.

## Jalankan Lokal

```bash
npm install
npm run dev
```

Buka:

```text
http://localhost:3000
```

## Mode Demo

Project ini langsung bisa berjalan tanpa Supabase karena memakai data demo.

Gunakan tombol role di kanan atas:

- `Karyawan`
- `Admin`

Untuk melihat fitur export dan koreksi manual, pilih `Admin`.

## Setup Supabase

1. Buat project baru di Supabase.
2. Buka `SQL Editor`.
3. Copy isi:

```text
supabase/schema.sql
```

4. Jalankan SQL.
5. Ambil Project URL dan Publishable/Anon Key dari Supabase.
6. Buat file `.env.local`:

```bash
cp .env.example .env.local
```

Isi:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-or-anon-key
```

Catatan: versi UI demo ini sudah Supabase-ready, tetapi query live dapat ditambahkan setelah data RFID asli mulai masuk.

## Deploy ke Vercel

1. Push folder ini ke GitHub.
2. Buka Vercel.
3. Klik `Add New Project`.
4. Import repository.
5. Framework akan terdeteksi sebagai `Next.js`.
6. Tambahkan Environment Variables:

```env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

7. Klik `Deploy`.

## Struktur Data Utama

| Tabel | Fungsi |
|---|---|
| `profiles` | Role user: karyawan/admin |
| `employees` | Data karyawan |
| `rfid_cards` | Mapping UID RFID ke karyawan |
| `devices` | Status alat RFID |
| `attendance_logs` | Data presensi |
| `attendance_audit_logs` | Audit perubahan admin |

## Integrasi ESP32/Raspberry Pi

Alur alat:

```text
Tap RFID -> baca UID -> simpan lokal -> kirim ke Supabase -> dashboard update
```

Minimal payload dari alat:

```json
{
  "rfid_uid": "B3:3D:1F:D3",
  "attendance_date": "2026-07-01",
  "check_in": "08:12",
  "status": "present",
  "source": "rfid",
  "device_id": "attendance-esp32-001"
}
```

Untuk production, sebaiknya alat tidak langsung memakai service role key. Gunakan salah satu:

- Supabase Edge Function sebagai endpoint alat.
- API route Next.js dengan device token.
- RLS insert-only policy khusus device.

## Prioritas Pengembangan Berikutnya

1. Supabase Auth login asli.
2. Query live dari tabel Supabase.
3. Registrasi kartu RFID dari dashboard.
4. Device heartbeat.
5. Export detail bulanan per karyawan.
6. Audit log untuk setiap koreksi manual.
