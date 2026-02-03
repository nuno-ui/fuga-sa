import { createClient } from "@supabase/supabase-js";
import type { Group, Member, Origin, Destination, QuizQuestion, QuizOption, Factor } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function loadGroup(slug: string): Promise<Group | null> {
  const { data } = await supabase.from("groups").select("*").eq("slug", slug).single();
  return data as Group | null;
}

export async function loadAllGroups(): Promise<Group[]> {
  const { data } = await supabase.from("groups").select("*").order("created_at", { ascending: false });
  return (data || []) as Group[];
}

export async function loadMembers(groupId: string): Promise<Member[]> {
  const { data } = await supabase.from("members").select("*").eq("group_id", groupId).order("display_order");
  return (data || []) as Member[];
}

export async function loadMemberData(memberIds: string[]): Promise<Record<string, any>> {
  if (!memberIds.length) return {};
  const { data } = await supabase.from("member_data").select("member_id, pin, data").in("member_id", memberIds);
  const result: Record<string, any> = {};
  (data || []).forEach((row: any) => {
    result[row.member_id] = { ...(row.data || {}), _pin: row.pin || null };
  });
  return result;
}

export async function saveMemberData(memberId: string, userData: any, pin?: string | null): Promise<boolean> {
  const { _pin, ...cleanData } = userData;
  const payload: any = { member_id: memberId, data: cleanData };
  if (pin !== undefined) payload.pin = pin;
  const { error } = await supabase.from("member_data").upsert(payload, { onConflict: "member_id" });
  return !error;
}

export async function loadOrigins(): Promise<Origin[]> {
  const { data } = await supabase.from("origins").select("*").order("display_order");
  return (data || []) as Origin[];
}

export async function loadDestinations(): Promise<Destination[]> {
  const { data } = await supabase.from("destinations").select("*").eq("active", true).order("name");
  return (data || []) as Destination[];
}

export async function loadQuiz(): Promise<QuizQuestion[]> {
  const { data: questions } = await supabase.from("quiz_questions").select("*").order("display_order");
  const { data: options } = await supabase.from("quiz_options").select("*").order("display_order");
  if (!questions || !options) return [];
  return questions.map((q: any) => ({
    ...q,
    options: options.filter((o: any) => o.question_id === q.id),
  })) as QuizQuestion[];
}

export async function loadFactors(): Promise<Factor[]> {
  const { data } = await supabase.from("factors").select("*").order("display_order");
  return (data || []) as Factor[];
}

export function subscribeToMemberData(callback: (payload: any) => void) {
  return supabase
    .channel("member_data_realtime")
    .on("postgres_changes", { event: "*", schema: "public", table: "member_data" }, callback)
    .subscribe();
}

export function unsubscribe(channel: any) {
  supabase.removeChannel(channel);
}
