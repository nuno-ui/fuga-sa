import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── Data Operations ────────────────────────────────────

export async function loadAllData(): Promise<Record<string, any>> {
  const { data, error } = await supabase
    .from("user_data")
    .select("user_id, pin, data");

  if (error) {
    console.error("Failed to load data:", error);
    return {};
  }

  const result: Record<string, any> = {};
  data?.forEach((row) => {
    result[row.user_id] = {
      ...(row.data || {}),
      _pin: row.pin || null,
    };
  });
  return result;
}

export async function saveUserData(
  userId: string,
  userData: any,
  pin?: string | null
): Promise<boolean> {
  // Remove internal _pin from data before saving
  const { _pin, ...cleanData } = userData;

  const payload: any = {
    user_id: userId,
    data: cleanData,
    updated_at: new Date().toISOString(),
  };

  // Only update pin if provided
  if (pin !== undefined) {
    payload.pin = pin;
  }

  const { error } = await supabase
    .from("user_data")
    .upsert(payload, { onConflict: "user_id" });

  if (error) {
    console.error("Failed to save:", error);
    return false;
  }
  return true;
}

export async function verifyPin(
  userId: string,
  pin: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_data")
    .select("pin")
    .eq("user_id", userId)
    .single();

  if (error || !data) return false;
  return data.pin === pin;
}

export async function hasPin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_data")
    .select("pin")
    .eq("user_id", userId)
    .single();

  if (error || !data) return false;
  return !!data.pin;
}

// ─── Realtime Subscription ──────────────────────────────

export function subscribeToChanges(
  callback: (payload: any) => void
) {
  return supabase
    .channel("user_data_realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "user_data",
      },
      callback
    )
    .subscribe();
}

export function unsubscribe(channel: any) {
  supabase.removeChannel(channel);
}
