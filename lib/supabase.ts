import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Browser client — Realtime subscriptions ke liye (Client Components)
export const supabaseBrowser = createClient(supabaseUrl, supabaseAnonKey);

// Server client — sirf API routes mein use hoga, browser mein nahi jaayega
export function createServerClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceKey);
}