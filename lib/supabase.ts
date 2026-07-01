export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}

export async function supabaseRestGet<T>(table: string) {
  const config = getSupabaseConfig();
  if (!config) {
    return null;
  }

  const response = await fetch(`${config.url}/rest/v1/${table}?select=*`, {
    headers: {
      apikey: config.anonKey,
      Authorization: `Bearer ${config.anonKey}`
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Supabase REST error: ${response.status}`);
  }

  return (await response.json()) as T;
}
