import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const adminClient = createClient(supabaseUrl, serviceRoleKey);

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

async function checkGroupAuth(slug: string, password: string): Promise<{ authorized: boolean; group: any }> {
  const { data: group } = await adminClient
    .from("groups")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!group) {
    return { authorized: false, group: null };
  }

  const hashedInput = hashPassword(password);
  const authorized = group.admin_password === hashedInput;

  return { authorized, group };
}

// GET - Load group config + selections
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const password = req.headers.get("x-admin-password");

  if (!password) {
    return NextResponse.json({ error: "Password necessária" }, { status: 401 });
  }

  const { authorized, group } = await checkGroupAuth(slug, password);

  if (!authorized) {
    return NextResponse.json({ error: "Password incorreta" }, { status: 401 });
  }

  // Load group selections
  const [destRes, factRes, quizRes, membersRes] = await Promise.all([
    adminClient.from("group_destinations").select("destination_id, priority").eq("group_id", group.id),
    adminClient.from("group_factors").select("factor_id, display_order").eq("group_id", group.id).order("display_order"),
    adminClient.from("group_quiz_questions").select("question_id, display_order").eq("group_id", group.id).order("display_order"),
    adminClient.from("members").select("*").eq("group_id", group.id).order("display_order"),
  ]);

  // Load all available options
  const [allDests, allFactors, allQuestions] = await Promise.all([
    adminClient.from("destinations").select("id, name, country, flag, category").order("name"),
    adminClient.from("factors").select("*").order("display_order"),
    adminClient.from("quiz_questions").select("*").order("display_order"),
  ]);

  return NextResponse.json({
    group: {
      id: group.id,
      name: group.name,
      slug: group.slug,
      description: group.description,
      cal_start: group.cal_start,
      cal_end: group.cal_end,
      admin_email: group.admin_email,
      is_public: group.is_public,
    },
    selections: {
      destinations: (destRes.data || []).map((r: any) => r.destination_id),
      factors: (factRes.data || []).map((r: any) => r.factor_id),
      quizQuestions: (quizRes.data || []).map((r: any) => r.question_id),
    },
    members: membersRes.data || [],
    catalog: {
      destinations: allDests.data || [],
      factors: allFactors.data || [],
      quizQuestions: allQuestions.data || [],
    },
  });
}

// PATCH - Update group config and/or selections
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const password = req.headers.get("x-admin-password");

  if (!password) {
    return NextResponse.json({ error: "Password necessária" }, { status: 401 });
  }

  const { authorized, group } = await checkGroupAuth(slug, password);

  if (!authorized) {
    return NextResponse.json({ error: "Password incorreta" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { updates, selections, newMember, deleteMember, updateMember } = body;

    // Update group details
    if (updates) {
      const allowedFields = ["name", "description", "cal_start", "cal_end", "admin_email", "is_public"];
      const filteredUpdates: any = {};
      for (const key of allowedFields) {
        if (updates[key] !== undefined) {
          filteredUpdates[key] = updates[key];
        }
      }

      if (Object.keys(filteredUpdates).length > 0) {
        const { error } = await adminClient.from("groups").update(filteredUpdates).eq("id", group.id);
        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
    }

    // Update selections (replace all)
    if (selections) {
      // Update destinations
      if (selections.destinations !== undefined) {
        await adminClient.from("group_destinations").delete().eq("group_id", group.id);
        if (selections.destinations.length > 0) {
          const inserts = selections.destinations.map((destId: string, i: number) => ({
            group_id: group.id,
            destination_id: destId,
            priority: selections.destinations.length - i,
          }));
          await adminClient.from("group_destinations").insert(inserts);
        }
      }

      // Update factors
      if (selections.factors !== undefined) {
        await adminClient.from("group_factors").delete().eq("group_id", group.id);
        if (selections.factors.length > 0) {
          const inserts = selections.factors.map((factorId: string, i: number) => ({
            group_id: group.id,
            factor_id: factorId,
            display_order: i,
          }));
          await adminClient.from("group_factors").insert(inserts);
        }
      }

      // Update quiz questions
      if (selections.quizQuestions !== undefined) {
        await adminClient.from("group_quiz_questions").delete().eq("group_id", group.id);
        if (selections.quizQuestions.length > 0) {
          const inserts = selections.quizQuestions.map((qId: string, i: number) => ({
            group_id: group.id,
            question_id: qId,
            display_order: i,
          }));
          await adminClient.from("group_quiz_questions").insert(inserts);
        }
      }
    }

    // Add new member
    if (newMember) {
      const { data: memberData, error: memberError } = await adminClient
        .from("members")
        .insert({
          group_id: group.id,
          name: newMember.name,
          display_order: newMember.display_order || 0,
        })
        .select()
        .single();

      if (memberError) {
        return NextResponse.json({ error: memberError.message }, { status: 500 });
      }

      // Create member_data row
      await adminClient.from("member_data").insert({ member_id: memberData.id });
    }

    // Update member
    if (updateMember) {
      const { error } = await adminClient
        .from("members")
        .update({ name: updateMember.name, display_order: updateMember.display_order })
        .eq("id", updateMember.id);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Delete member
    if (deleteMember) {
      await adminClient.from("member_data").delete().eq("member_id", deleteMember);
      const { error } = await adminClient.from("members").delete().eq("id", deleteMember);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno" }, { status: 500 });
  }
}

// POST - Verify password (login check)
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  try {
    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: "Password necessária" }, { status: 400 });
    }

    const { authorized, group } = await checkGroupAuth(slug, password);

    if (!authorized) {
      return NextResponse.json({ error: "Password incorreta", valid: false }, { status: 401 });
    }

    return NextResponse.json({
      valid: true,
      group: {
        id: group.id,
        name: group.name,
        slug: group.slug,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Erro interno" }, { status: 500 });
  }
}
