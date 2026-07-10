# Attendify HRIS Next.js 4-Tap RFID

Dashboard presensi RFID berbasis Next.js yang UI/UX-nya disesuaikan dari `attendance-rfid-main.zip`, tetapi sudah dimigrasikan dari Vite/TanStack menjadi Next.js App Router untuk Vercel.

## Fitur Utama

- Login page modern seperti referensi dengan pilihan email/password, create account, dan Google OAuth via Supabase.
- Dashboard admin responsif untuk desktop, tablet, dan HP.
- Logic presensi 4 tap:
  - Masuk
  - Mulai Istirahat
  - Selesai Istirahat
  - Pulang
- Perhitungan jam kerja:
  - Masuk sampai Mulai Istirahat
  - Selesai Istirahat sampai Pulang
- Divisi:
  - Casier
  - Kitchen
  - Produksi
  - Part-time
- Shift:
  - Pagi: 08.00-16.00
  - Siang: 14.00-22.00
  - Middle: 12.00-20.00
  - Middle Closing: 12.00-22.00
  - Pagi Middle: 08.00-20.00
  - Fullday: 08.00-22.00
- Endpoint RFID:
  - `POST /api/device/tap`
  - `POST /api/rfid/tap`
- Export `.xlsx` berdasarkan rentang tanggal.
- Tanpa Tailwind/PostCSS, sehingga lebih aman dijalankan lokal di Windows.
- Struktur Supabase mengikuti referensi: `profiles`, `user_roles`, `devices`, `rfid_cards`, `attendance_taps`.

## Jalankan Lokal

```bash
npm install
npm run dev
```

Buka:

```text
http://localhost:3000
```

Kalau Supabase belum disetting, gunakan tombol `Demo Admin`.

## Environment Variables Wajib

Buat file `.env.local` dari `.env.example`.

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=isi_anon_key
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=isi_service_role_key
DEVICE_SECRET=DEV-SECRET-CHANGE-ME
ADMIN_EMAIL=admin@kantor.local
ADMIN_PASSWORD=admin123
```

Catatan:

- `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` dipakai browser untuk login Google dan membaca data.
- `SUPABASE_SERVICE_ROLE_KEY` dipakai API `/api/device/tap` agar ESP32 bisa menulis attendance tanpa login user.
- Jangan tampilkan `SUPABASE_SERVICE_ROLE_KEY` di frontend.

## Setup Database Supabase

1. Buka Supabase Dashboard.
2. Masuk ke `SQL Editor`.
3. Copy isi file:

```text
supabase/schema.sql
```

4. Jalankan SQL tersebut.
5. Setelah user pertama login/register, user pertama otomatis menjadi `administrator`.

## Setup Google OAuth Supabase

1. Buka Supabase Dashboard.
2. Masuk ke `Authentication`.
3. Buka `Providers`.
4. Aktifkan `Google`.
5. Isi `Client ID` dan `Client Secret` dari Google Cloud Console.
6. Tambahkan Authorized Redirect URLs:

```text
http://localhost:3000
https://domain-vercel-kamu.vercel.app
```

7. Di Supabase `Authentication > URL Configuration`, set:

```text
Site URL:
https://domain-vercel-kamu.vercel.app

Redirect URLs:
http://localhost:3000
https://domain-vercel-kamu.vercel.app
```

## Setup Vercel

Pilih preset:

```text
Next.js
```

Root directory:

```text
./
```

Build Command:

```text
npm run build
```

Output Directory:

```text
Next.js default
```

Install Command:

```text
npm install
```

Environment Variables di Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=isi_anon_key
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=isi_service_role_key
DEVICE_SECRET=DEV-SECRET-CHANGE-ME
```

## Test Endpoint RFID

```bash
curl -X POST http://localhost:3000/api/device/tap \
  -H "Content-Type: application/json" \
  -d "{\"rfid_uid\":\"B3:3D:1F:D3\",\"device_id\":\"ESP32-ENTRANCE-01\",\"device_secret\":\"DEV-SECRET-CHANGE-ME\"}"
```

Urutan tap otomatis:

1. Tap pertama: `masuk`
2. Tap kedua: `mulai_istirahat`
3. Tap ketiga: `selesai_istirahat`
4. Tap keempat: `pulang`
5. Tap kelima: `extra_tap`

## Catatan Production

Versi ini punya demo-memory store agar langsung bisa dicoba lokal dan di Vercel. Untuk production kantor, data sebaiknya dipindah penuh ke Supabase menggunakan schema di `supabase/schema.sql`, lalu API route diarahkan ke Supabase database.

## Catatan Email Verification

Flow aktivasi akun sudah dibuat defensif:

- Setelah `Activate Account`, user tidak langsung masuk ke dashboard.
- Jika Supabase meminta email confirmation, modal akan menampilkan instruksi verifikasi email dan tombol `Resend verification email`.
- Jika Supabase tidak meminta email confirmation, modal tidak lagi menyuruh user menunggu email yang memang tidak dikirim.
- Setelah verifikasi atau setelah akun dibuat, user tetap harus masuk ulang melalui tab `Sign In`.

Jika email tetap tidak masuk setelah tombol resend digunakan, periksa pengaturan Supabase Auth:

1. Authentication > Providers > Email.
2. Pastikan email signup dan confirmation sesuai kebutuhan.
3. Authentication > URL Configuration.
4. Pastikan Site URL dan Redirect URLs berisi domain Vercel production serta localhost untuk testing.
5. Periksa folder Spam/Promotions di Gmail.
6. Untuk penggunaan production, gunakan SMTP custom agar pengiriman email lebih stabil.
