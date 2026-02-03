import { createClient } from "@supabase/supabase-js";
import type { Group, Member, Origin, Destination, QuizQuestion, QuizOption, Factor, GroupSelections } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── GROUP SELECTIONS ────────────────────────────

export async function loadGroupSelections(groupId: string): Promise<GroupSelections | null> {
  const [destRes, factRes, quizRes] = await Promise.all([
    supabase.from("group_destinations").select("destination_id").eq("group_id", groupId),
    supabase.from("group_factors").select("factor_id").eq("group_id", groupId).order("display_order"),
    supabase.from("group_quiz_questions").select("question_id").eq("group_id", groupId).order("display_order"),
  ]);

  return {
    destinations: (destRes.data || []).map((r: any) => r.destination_id),
    factors: (factRes.data || []).map((r: any) => r.factor_id),
    quizQuestions: (quizRes.data || []).map((r: any) => r.question_id),
  };
}

export async function loadDestinationsForGroup(groupId: string): Promise<Destination[]> {
  // First try to load group-specific selections
  const { data: selections } = await supabase
    .from("group_destinations")
    .select("destination_id")
    .eq("group_id", groupId);

  if (selections && selections.length > 0) {
    const destIds = selections.map((s: any) => s.destination_id);
    const { data } = await supabase
      .from("destinations")
      .select("*")
      .in("id", destIds)
      .eq("active", true)
      .order("name");
    return (data || []) as Destination[];
  }

  // Fall back to all active destinations
  return loadDestinations();
}

export async function loadQuizForGroup(groupId: string): Promise<QuizQuestion[]> {
  // First try to load group-specific selections
  const { data: selections } = await supabase
    .from("group_quiz_questions")
    .select("question_id, display_order")
    .eq("group_id", groupId)
    .order("display_order");

  if (selections && selections.length > 0) {
    const qIds = selections.map((s: any) => s.question_id);
    const { data: questions } = await supabase
      .from("quiz_questions")
      .select("*")
      .in("id", qIds);
    const { data: options } = await supabase
      .from("quiz_options")
      .select("*")
      .order("display_order");

    if (!questions || !options) return [];

    // Sort by group's display_order
    const orderMap = new Map(selections.map((s: any) => [s.question_id, s.display_order]));
    const sorted = [...questions].sort((a, b) => (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0));

    return sorted.map((q: any) => ({
      ...q,
      options: options.filter((o: any) => o.question_id === q.id),
    })) as QuizQuestion[];
  }

  // Fall back to all quiz questions
  return loadQuiz();
}

export async function loadFactorsForGroup(groupId: string): Promise<Factor[]> {
  // First try to load group-specific selections
  const { data: selections } = await supabase
    .from("group_factors")
    .select("factor_id, display_order")
    .eq("group_id", groupId)
    .order("display_order");

  if (selections && selections.length > 0) {
    const fIds = selections.map((s: any) => s.factor_id);
    const { data } = await supabase
      .from("factors")
      .select("*")
      .in("id", fIds);

    if (!data) return [];

    // Sort by group's display_order
    const orderMap = new Map(selections.map((s: any) => [s.factor_id, s.display_order]));
    return [...data].sort((a, b) => (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0)) as Factor[];
  }

  // Fall back to all factors
  return loadFactors();
}

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

// ─── ADMIN FUNCTIONS ────────────────────────────

export async function updateDestination(id: string, updates: Partial<Destination>): Promise<boolean> {
  const { error } = await supabase.from("destinations").update(updates).eq("id", id);
  return !error;
}

export async function createDestination(dest: Omit<Destination, "id"> & { id: string }): Promise<boolean> {
  const { error } = await supabase.from("destinations").insert(dest);
  return !error;
}

export async function deleteDestination(id: string): Promise<boolean> {
  const { error } = await supabase.from("destinations").delete().eq("id", id);
  return !error;
}

export async function loadAllDestinations(): Promise<Destination[]> {
  const { data } = await supabase.from("destinations").select("*").order("name");
  return (data || []) as Destination[];
}

export async function updateMember(id: string, updates: Partial<Member>): Promise<boolean> {
  const { error } = await supabase.from("members").update(updates).eq("id", id);
  return !error;
}

export async function createMember(member: Omit<Member, "id">): Promise<string | null> {
  const { data, error } = await supabase.from("members").insert(member).select("id").single();
  return error ? null : data?.id;
}

export async function deleteMember(id: string): Promise<boolean> {
  await supabase.from("member_data").delete().eq("member_id", id);
  const { error } = await supabase.from("members").delete().eq("id", id);
  return !error;
}

export async function updateGroup(id: string, updates: Partial<Group>): Promise<boolean> {
  const { error } = await supabase.from("groups").update(updates).eq("id", id);
  return !error;
}
