import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminPassword = process.env.ADMIN_PASSWORD || "fuga2026admin";

// Admin client with service role (bypasses RLS)
const adminClient = createClient(supabaseUrl, serviceRoleKey);

function checkAuth(req: NextRequest): boolean {
  const auth = req.headers.get("x-admin-password");
  return auth === adminPassword;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const table = searchParams.get("table");

  if (!table || !["destinations", "members", "groups", "origins", "factors", "quiz_questions", "quiz_options"].includes(table)) {
    return NextResponse.json({ error: "Invalid table" }, { status: 400 });
  }

  const { data, error } = await adminClient.from(table).select("*").order(table === "members" ? "display_order" : "id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { table, record } = body;

  if (!table || !record) {
    return NextResponse.json({ error: "Missing table or record" }, { status: 400 });
  }

  const { data, error } = await adminClient.from(table).insert(record).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { table, id, updates } = body;

  if (!table || !id || !updates) {
    return NextResponse.json({ error: "Missing table, id, or updates" }, { status: 400 });
  }

  const { data, error } = await adminClient.from(table).update(updates).eq("id", id).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const table = searchParams.get("table");
  const id = searchParams.get("id");

  if (!table || !id) {
    return NextResponse.json({ error: "Missing table or id" }, { status: 400 });
  }

  // Handle member deletion (also delete member_data)
  if (table === "members") {
    await adminClient.from("member_data").delete().eq("member_id", id);
  }

  const { error } = await adminClient.from(table).delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
