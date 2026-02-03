import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(supabaseUrl, serviceRoleKey);

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

// GET - List all public groups
export async function GET() {
  const { data, error } = await adminClient
    .from("groups")
    .select("id, name, slug, description, cal_start, cal_end, is_public, created_at")
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST - Create a new group
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, slug, description, admin_password, admin_email, cal_start, cal_end } = body;

    // Validation
    if (!name || !slug || !admin_password) {
      return NextResponse.json(
        { error: "Nome, slug e password são obrigatórios" },
        { status: 400 }
      );
    }

    // Validate slug format (lowercase, alphanumeric, hyphens)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: "Slug inválido. Use apenas letras minúsculas, números e hífens." },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const { data: existing } = await adminClient
      .from("groups")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Este slug já está em uso. Escolha outro." },
        { status: 400 }
      );
    }

    // Create the group
    const groupId = slug; // Use slug as ID for simplicity
    const hashedPassword = hashPassword(admin_password);

    const { data: newGroup, error: createError } = await adminClient
      .from("groups")
      .insert({
        id: groupId,
        name,
        slug,
        description: description || null,
        admin_password: hashedPassword,
        admin_email: admin_email || null,
        is_public: true,
        cal_start: cal_start || "2026-04-24",
        cal_end: cal_end || "2026-05-08",
      })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // Copy default selections from global catalog
    // Default destinations: popular European destinations
    const defaultDestinations = [
      "barcelona", "madrid-d", "sevilla", "valencia", "ibiza", "mallorca",
      "lisbon-d", "porto-d", "algarve", "paris-d", "london-d", "amsterdam-d",
      "berlin-d", "rome", "florence", "venice", "prague", "budapest",
      "vienna", "athens", "santorini", "mykonos", "creta", "dubrovnik",
      "split", "copenhagen-d", "stockholm", "dublin"
    ];

    // Insert default destinations for the group
    const destInserts = defaultDestinations.map((destId) => ({
      group_id: groupId,
      destination_id: destId,
      priority: 0,
    }));

    await adminClient.from("group_destinations").insert(destInserts);

    // Insert all factors by default
    const { data: allFactors } = await adminClient.from("factors").select("id, display_order");
    if (allFactors) {
      const factorInserts = allFactors.map((f: any) => ({
        group_id: groupId,
        factor_id: f.id,
        display_order: f.display_order,
      }));
      await adminClient.from("group_factors").insert(factorInserts);
    }

    // Insert all quiz questions by default
    const { data: allQuestions } = await adminClient.from("quiz_questions").select("id, display_order");
    if (allQuestions) {
      const quizInserts = allQuestions.map((q: any) => ({
        group_id: groupId,
        question_id: q.id,
        display_order: q.display_order,
      }));
      await adminClient.from("group_quiz_questions").insert(quizInserts);
    }

    return NextResponse.json({
      success: true,
      group: {
        id: newGroup.id,
        name: newGroup.name,
        slug: newGroup.slug,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno" }, { status: 500 });
  }
}
