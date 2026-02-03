"use client";

import { useState, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface Destination {
  id: string;
  name: string;
  country: string;
  flag: string;
  category: string;
  description: string;
  image_url: string | null;
  attrs: Record<string, number>;
  cost_low: number;
  cost_med: number;
  cost_high: number;
  food_per_day: number;
  temp_may: number;
  rain_days: number;
  lat: number;
  lon: number;
  active?: boolean;
}

interface Member {
  id: string;
  group_id: string;
  name: string;
  display_order: number;
}

interface Group {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cal_start: string;
  cal_end: string;
}

interface QuizQuestion {
  id: string;
  emoji: string;
  question: string;
  display_order: number;
}

interface QuizOption {
  id: string;
  question_id: string;
  text: string;
  attrs: Record<string, number>;
  display_order: number;
}

interface Factor {
  id: string;
  name: string;
  emoji: string;
  attr_key: string;
  display_order: number;
}

type Tab = "destinations" | "groups" | "quiz" | "factors";

const emptyDestination: Destination = {
  id: "",
  name: "",
  country: "",
  flag: "🏳️",
  category: "Outro",
  description: "",
  image_url: "",
  attrs: { beach: 0, night: 0, nature: 0, culture: 0, warm: 0, budget: 0, travel: 0, liberal: 0, food: 0 },
  cost_low: 30,
  cost_med: 70,
  cost_high: 150,
  food_per_day: 25,
  temp_may: 20,
  rain_days: 5,
  lat: 0,
  lon: 0,
};

const ATTR_KEYS = ["beach", "night", "nature", "culture", "warm", "budget", "travel", "liberal", "food"];
const ATTR_LABELS: Record<string, string> = {
  beach: "🏖️ Praia",
  night: "🎉 Nightlife",
  nature: "🌲 Natureza",
  culture: "🏛️ Cultura",
  warm: "☀️ Calor",
  budget: "💰 Budget",
  travel: "✈️ Viagem curta",
  liberal: "🌿 Liberal",
  food: "🍽️ Gastronomia",
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState("");
  const [tab, setTab] = useState<Tab>("destinations");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Data
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [options, setOptions] = useState<QuizOption[]>([]);
  const [factors, setFactors] = useState<Factor[]>([]);

  // Edit states
  const [editingDest, setEditingDest] = useState<Destination | null>(null);
  const [creatingDest, setCreatingDest] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [creatingMemberForGroup, setCreatingMemberForGroup] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [creatingQuestion, setCreatingQuestion] = useState(false);
  const [editingOption, setEditingOption] = useState<QuizOption | null>(null);
  const [creatingOptionForQuestion, setCreatingOptionForQuestion] = useState<string | null>(null);
  const [editingFactor, setEditingFactor] = useState<Factor | null>(null);
  const [creatingFactor, setCreatingFactor] = useState(false);

  // Search
  const [searchDest, setSearchDest] = useState("");

  const headers = useCallback(() => ({ "x-admin-password": password }), [password]);

  const fetchData = useCallback(async (table: string) => {
    const res = await fetch(`/api/admin?table=${table}`, { headers: headers() });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  }, [headers]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const [d, m, g, q, o, f] = await Promise.all([
      fetchData("destinations"),
      fetchData("members"),
      fetchData("groups"),
      fetchData("quiz_questions"),
      fetchData("quiz_options"),
      fetchData("factors"),
    ]);
    setDestinations(d);
    setMembers(m);
    setGroups(g);
    setQuestions(q.sort((a: QuizQuestion, b: QuizQuestion) => a.display_order - b.display_order));
    setOptions(o.sort((a: QuizOption, b: QuizOption) => a.display_order - b.display_order));
    setFactors(f.sort((a: Factor, b: Factor) => a.display_order - b.display_order));
    setLoading(false);
  }, [fetchData]);

  const handleLogin = async () => {
    setAuthError("");
    const res = await fetch("/api/admin?table=groups", { headers: headers() });
    if (res.ok) {
      setAuthenticated(true);
      loadAll();
    } else {
      setAuthError("Password incorreta");
    }
  };

  const showMessage = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // ─── GENERIC CRUD ─────────────────────────────
  const saveRecord = async (table: string, record: any, isNew: boolean, idField = "id") => {
    const method = isNew ? "POST" : "PATCH";
    const body = isNew
      ? { table, record }
      : { table, id: record[idField], updates: record };

    const res = await fetch("/api/admin", {
      method,
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      return { success: true, data: await res.json() };
    } else {
      const err = await res.json();
      return { success: false, error: err.error || "Erro ao guardar" };
    }
  };

  const deleteRecord = async (table: string, id: string) => {
    const res = await fetch(`/api/admin?table=${table}&id=${id}`, {
      method: "DELETE",
      headers: headers(),
    });
    return res.ok;
  };

  // ─── DESTINATION CRUD ─────────────────────────────
  const saveDestination = async (dest: Destination, isNew: boolean) => {
    const result = await saveRecord("destinations", dest, isNew);
    if (result.success) {
      showMessage(isNew ? "Destino criado!" : "Destino atualizado!");
      loadAll();
      setEditingDest(null);
      setCreatingDest(false);
    } else {
      showMessage(result.error!, "error");
    }
  };

  const deleteDestination = async (id: string) => {
    if (!confirm(`Apagar destino "${id}"?`)) return;
    if (await deleteRecord("destinations", id)) {
      showMessage("Destino apagado!");
      loadAll();
    } else {
      showMessage("Erro ao apagar", "error");
    }
  };

  // ─── GROUP CRUD ─────────────────────────────
  const saveGroup = async (group: Group, isNew: boolean) => {
    const result = await saveRecord("groups", group, isNew);
    if (result.success) {
      showMessage(isNew ? "Grupo criado!" : "Grupo atualizado!");
      loadAll();
      setEditingGroup(null);
      setCreatingGroup(false);
    } else {
      showMessage(result.error!, "error");
    }
  };

  const deleteGroup = async (id: string) => {
    const groupMembers = members.filter((m) => m.group_id === id);
    const msg = groupMembers.length > 0
      ? `Este grupo tem ${groupMembers.length} membros. Apagar tudo?`
      : `Apagar grupo "${id}"?`;
    if (!confirm(msg)) return;
    if (await deleteRecord("groups", id)) {
      showMessage("Grupo apagado!");
      loadAll();
    } else {
      showMessage("Erro ao apagar", "error");
    }
  };

  // ─── MEMBER CRUD ─────────────────────────────
  const saveMember = async (member: Member, isNew: boolean) => {
    const memberRecord = isNew
      ? { group_id: member.group_id, name: member.name, display_order: member.display_order }
      : member;
    const result = await saveRecord("members", memberRecord, isNew);
    if (result.success) {
      if (isNew && result.data?.data?.id) {
        await fetch("/api/admin", {
          method: "POST",
          headers: { ...headers(), "Content-Type": "application/json" },
          body: JSON.stringify({ table: "member_data", record: { member_id: result.data.data.id } }),
        });
      }
      showMessage(isNew ? "Membro adicionado!" : "Membro atualizado!");
      loadAll();
      setEditingMember(null);
      setCreatingMemberForGroup(null);
    } else {
      showMessage(result.error!, "error");
    }
  };

  const deleteMember = async (id: string, name: string) => {
    if (!confirm(`Apagar membro "${name}"?`)) return;
    if (await deleteRecord("members", id)) {
      showMessage("Membro apagado!");
      loadAll();
    } else {
      showMessage("Erro ao apagar", "error");
    }
  };

  // ─── QUESTION CRUD ─────────────────────────────
  const saveQuestion = async (question: QuizQuestion, isNew: boolean) => {
    const result = await saveRecord("quiz_questions", question, isNew);
    if (result.success) {
      showMessage(isNew ? "Pergunta criada!" : "Pergunta atualizada!");
      loadAll();
      setEditingQuestion(null);
      setCreatingQuestion(false);
    } else {
      showMessage(result.error!, "error");
    }
  };

  const deleteQuestion = async (id: string) => {
    const questionOptions = options.filter((o) => o.question_id === id);
    const msg = questionOptions.length > 0
      ? `Esta pergunta tem ${questionOptions.length} opções. Apagar tudo?`
      : `Apagar pergunta "${id}"?`;
    if (!confirm(msg)) return;
    // Delete options first
    for (const opt of questionOptions) {
      await deleteRecord("quiz_options", opt.id);
    }
    if (await deleteRecord("quiz_questions", id)) {
      showMessage("Pergunta apagada!");
      loadAll();
    } else {
      showMessage("Erro ao apagar", "error");
    }
  };

  // ─── OPTION CRUD ─────────────────────────────
  const saveOption = async (option: QuizOption, isNew: boolean) => {
    const result = await saveRecord("quiz_options", option, isNew);
    if (result.success) {
      showMessage(isNew ? "Opção criada!" : "Opção atualizada!");
      loadAll();
      setEditingOption(null);
      setCreatingOptionForQuestion(null);
    } else {
      showMessage(result.error!, "error");
    }
  };

  const deleteOption = async (id: string) => {
    if (!confirm("Apagar esta opção?")) return;
    if (await deleteRecord("quiz_options", id)) {
      showMessage("Opção apagada!");
      loadAll();
    } else {
      showMessage("Erro ao apagar", "error");
    }
  };

  // ─── FACTOR CRUD ─────────────────────────────
  const saveFactor = async (factor: Factor, isNew: boolean) => {
    const result = await saveRecord("factors", factor, isNew);
    if (result.success) {
      showMessage(isNew ? "Fator criado!" : "Fator atualizado!");
      loadAll();
      setEditingFactor(null);
      setCreatingFactor(false);
    } else {
      showMessage(result.error!, "error");
    }
  };

  const deleteFactor = async (id: string) => {
    if (!confirm(`Apagar fator "${id}"?`)) return;
    if (await deleteRecord("factors", id)) {
      showMessage("Fator apagado!");
      loadAll();
    } else {
      showMessage("Erro ao apagar", "error");
    }
  };

  // ─── FILTERS ─────────────────────────────
  const filteredDestinations = destinations.filter(
    (d) =>
      d.name.toLowerCase().includes(searchDest.toLowerCase()) ||
      d.country.toLowerCase().includes(searchDest.toLowerCase()) ||
      d.category.toLowerCase().includes(searchDest.toLowerCase())
  );

  // ─── LOGIN SCREEN ─────────────────────────────
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-900 p-8 rounded-2xl w-full max-w-sm border border-slate-800">
          <h1 className="text-2xl font-bold text-white mb-2 text-center">Admin</h1>
          <p className="text-slate-400 text-center mb-6">Fuga, SA</p>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white mb-4 focus:outline-none focus:border-orange-500"
          />
          {authError && <p className="text-red-400 text-sm mb-4">{authError}</p>}
          <button
            onClick={handleLogin}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold rounded-lg hover:opacity-90 transition"
          >
            Entrar
          </button>
        </div>
      </div>
    );
  }

  // ─── MAIN ADMIN SCREEN ─────────────────────────────
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Toast */}
      {message && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg z-50 ${message.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">Admin Fuga, SA</h1>
          <div className="flex items-center gap-4">
            <button onClick={loadAll} disabled={loading} className="px-3 py-1.5 bg-slate-700 rounded-lg text-sm hover:bg-slate-600 disabled:opacity-50">
              {loading ? "..." : "Refresh"}
            </button>
            <button onClick={() => setAuthenticated(false)} className="text-sm text-slate-400 hover:text-white">
              Logout
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-3 flex gap-2 flex-wrap">
          {([
            ["destinations", `Destinos (${destinations.length})`],
            ["groups", `Grupos (${groups.length})`],
            ["quiz", `Quiz (${questions.length})`],
            ["factors", `Fatores (${factors.length})`],
          ] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg font-medium transition ${tab === t ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {/* ═══ DESTINATIONS TAB ═══ */}
        {tab === "destinations" && (
          <div>
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                placeholder="Pesquisar destinos..."
                value={searchDest}
                onChange={(e) => setSearchDest(e.target.value)}
                className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-orange-500"
              />
              <button onClick={() => setCreatingDest(true)} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium">
                + Novo Destino
              </button>
            </div>
            <div className="grid gap-3">
              {filteredDestinations.map((d) => (
                <div key={d.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex gap-4 hover:border-slate-700 transition">
                  <div className="w-36 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-slate-800">
                    {d.image_url ? (
                      <img src={d.image_url} alt={d.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">{d.flag}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{d.flag}</span>
                      <span className="font-semibold text-lg">{d.name}</span>
                      <span className="text-slate-400">{d.country}</span>
                      <span className="text-xs px-2 py-0.5 bg-slate-700 rounded">{d.category}</span>
                    </div>
                    <p className="text-slate-400 text-sm mb-2 line-clamp-1">{d.description}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>🌡️ {d.temp_may}°C</span>
                      <span>💰 {d.cost_low}-{d.cost_high}€</span>
                      <span className="text-slate-600">ID: {d.id}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => setEditingDest(d)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm">Editar</button>
                    <button onClick={() => deleteDestination(d.id)} className="px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded text-sm">Apagar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ GROUPS TAB ═══ */}
        {tab === "groups" && (
          <div>
            <div className="mb-4">
              <button onClick={() => setCreatingGroup(true)} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium">
                + Novo Grupo
              </button>
            </div>
            <div className="space-y-6">
              {groups.map((g) => {
                const groupMembers = members.filter((m) => m.group_id === g.id).sort((a, b) => a.display_order - b.display_order);
                return (
                  <div key={g.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{g.name}</h3>
                        <p className="text-slate-400 text-sm">/{g.slug} • {g.cal_start} a {g.cal_end}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingGroup(g)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm">Editar</button>
                        <button onClick={() => deleteGroup(g.id)} className="px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded text-sm">Apagar</button>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-slate-400">{groupMembers.length} membros</span>
                        <button onClick={() => setCreatingMemberForGroup(g.id)} className="px-3 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded text-sm">
                          + Adicionar Membro
                        </button>
                      </div>
                      {groupMembers.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {groupMembers.map((m) => (
                            <div key={m.id} className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
                              <span className="truncate">{m.name}</span>
                              <div className="flex gap-1 ml-2">
                                <button onClick={() => setEditingMember(m)} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white">✏️</button>
                                <button onClick={() => deleteMember(m.id, m.name)} className="p-1 hover:bg-red-900/50 rounded text-slate-400 hover:text-red-300">🗑️</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-sm">Nenhum membro</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ QUIZ TAB ═══ */}
        {tab === "quiz" && (
          <div>
            <div className="mb-4">
              <button onClick={() => setCreatingQuestion(true)} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium">
                + Nova Pergunta
              </button>
            </div>
            <div className="space-y-4">
              {questions.map((q, idx) => {
                const questionOptions = options.filter((o) => o.question_id === q.id).sort((a, b) => a.display_order - b.display_order);
                return (
                  <div key={q.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{q.emoji}</span>
                        <div>
                          <h3 className="font-semibold">{q.question}</h3>
                          <p className="text-slate-500 text-xs">ID: {q.id} • Ordem: {q.display_order}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingQuestion(q)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm">Editar</button>
                        <button onClick={() => deleteQuestion(q.id)} className="px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded text-sm">Apagar</button>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-slate-400">{questionOptions.length} opções</span>
                        <button onClick={() => setCreatingOptionForQuestion(q.id)} className="px-3 py-1 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded text-sm">
                          + Adicionar Opção
                        </button>
                      </div>
                      {questionOptions.length > 0 ? (
                        <div className="space-y-2">
                          {questionOptions.map((o) => (
                            <div key={o.id} className="flex items-center justify-between bg-slate-800 rounded-lg px-3 py-2">
                              <div className="flex-1">
                                <span>{o.text}</span>
                                {Object.keys(o.attrs || {}).length > 0 && (
                                  <span className="ml-2 text-xs text-slate-500">
                                    {Object.entries(o.attrs).map(([k, v]) => `${k}:${v}`).join(", ")}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-1 ml-2">
                                <button onClick={() => setEditingOption(o)} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white">✏️</button>
                                <button onClick={() => deleteOption(o.id)} className="p-1 hover:bg-red-900/50 rounded text-slate-400 hover:text-red-300">🗑️</button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-sm">Nenhuma opção</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ FACTORS TAB ═══ */}
        {tab === "factors" && (
          <div>
            <div className="mb-4">
              <button onClick={() => setCreatingFactor(true)} className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg font-medium">
                + Novo Fator
              </button>
            </div>
            <p className="text-slate-400 text-sm mb-4">
              Fatores são as prioridades que os utilizadores podem ordenar (ex: Praia, Nightlife, Cultura).
              O attr_key liga ao atributo dos destinos.
            </p>
            <div className="grid gap-3">
              {factors.map((f) => (
                <div key={f.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center gap-4">
                  <span className="text-3xl">{f.emoji}</span>
                  <div className="flex-1">
                    <h3 className="font-semibold">{f.name}</h3>
                    <p className="text-slate-500 text-xs">ID: {f.id} • Attr: {f.attr_key} • Ordem: {f.display_order}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingFactor(f)} className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm">Editar</button>
                    <button onClick={() => deleteFactor(f.id)} className="px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-300 rounded text-sm">Apagar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ═══ MODALS ═══ */}
      {(editingDest || creatingDest) && (
        <DestinationModal
          dest={editingDest || emptyDestination}
          isNew={creatingDest}
          onClose={() => { setEditingDest(null); setCreatingDest(false); }}
          onSave={(d) => saveDestination(d, creatingDest)}
        />
      )}

      {(editingGroup || creatingGroup) && (
        <GroupModal
          group={editingGroup || { id: "", name: "", slug: "", description: "", cal_start: "2026-04-24", cal_end: "2026-05-08" }}
          isNew={creatingGroup}
          onClose={() => { setEditingGroup(null); setCreatingGroup(false); }}
          onSave={(g) => saveGroup(g, creatingGroup)}
        />
      )}

      {(editingMember || creatingMemberForGroup) && (
        <MemberModal
          member={editingMember || { id: "", group_id: creatingMemberForGroup || "", name: "", display_order: members.filter((m) => m.group_id === creatingMemberForGroup).length }}
          isNew={!!creatingMemberForGroup}
          onClose={() => { setEditingMember(null); setCreatingMemberForGroup(null); }}
          onSave={(m) => saveMember(m, !!creatingMemberForGroup)}
        />
      )}

      {(editingQuestion || creatingQuestion) && (
        <QuestionModal
          question={editingQuestion || { id: "", emoji: "❓", question: "", display_order: questions.length }}
          isNew={creatingQuestion}
          onClose={() => { setEditingQuestion(null); setCreatingQuestion(false); }}
          onSave={(q) => saveQuestion(q, creatingQuestion)}
        />
      )}

      {(editingOption || creatingOptionForQuestion) && (
        <OptionModal
          option={editingOption || { id: "", question_id: creatingOptionForQuestion || "", text: "", attrs: {}, display_order: options.filter((o) => o.question_id === creatingOptionForQuestion).length }}
          isNew={!!creatingOptionForQuestion}
          onClose={() => { setEditingOption(null); setCreatingOptionForQuestion(null); }}
          onSave={(o) => saveOption(o, !!creatingOptionForQuestion)}
        />
      )}

      {(editingFactor || creatingFactor) && (
        <FactorModal
          factor={editingFactor || { id: "", name: "", emoji: "⭐", attr_key: "", display_order: factors.length }}
          isNew={creatingFactor}
          onClose={() => { setEditingFactor(null); setCreatingFactor(false); }}
          onSave={(f) => saveFactor(f, creatingFactor)}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DESTINATION MODAL
// ═══════════════════════════════════════════════════════════════
function DestinationModal({ dest, isNew, onClose, onSave }: { dest: Destination; isNew: boolean; onClose: () => void; onSave: (d: Destination) => void }) {
  const [form, setForm] = useState<Destination>({ ...dest, attrs: { ...dest.attrs } });
  const [imageError, setImageError] = useState(false);

  const generateId = (name: string) => name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return (
    <div className="fixed inset-0 bg-black/80 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl w-full max-w-3xl my-8 border border-slate-700">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-bold">{isNew ? "Novo Destino" : `Editar ${form.flag} ${form.name}`}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Imagem URL</label>
            <input value={form.image_url || ""} onChange={(e) => { setForm({ ...form, image_url: e.target.value }); setImageError(false); }} placeholder="https://images.unsplash.com/..." className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white text-sm" />
            {form.image_url && !imageError && (
              <div className="mt-2 h-40 rounded-lg overflow-hidden bg-slate-800">
                <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" onError={() => setImageError(true)} />
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {isNew && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">ID</label>
                <input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} onBlur={() => { if (!form.id && form.name) setForm({ ...form, id: generateId(form.name) }); }} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" />
              </div>
            )}
            <div className={isNew ? "" : "col-span-1"}>
              <label className="text-xs text-slate-400 block mb-1">Nome</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">País</label>
              <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Bandeira</label>
              <input value={form.flag} onChange={(e) => setForm({ ...form, flag: e.target.value })} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Categoria</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white">
                <option value="Exótico">Exótico</option>
                <option value="Ilha">Ilha</option>
                <option value="Capital">Capital</option>
                <option value="Espanha">Espanha</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Descrição</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" />
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
            <div><label className="text-xs text-slate-400">Temp °C</label><input type="number" value={form.temp_may} onChange={(e) => setForm({ ...form, temp_may: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" /></div>
            <div><label className="text-xs text-slate-400">Chuva dias</label><input type="number" value={form.rain_days} onChange={(e) => setForm({ ...form, rain_days: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" /></div>
            <div><label className="text-xs text-slate-400">€ Min</label><input type="number" value={form.cost_low} onChange={(e) => setForm({ ...form, cost_low: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" /></div>
            <div><label className="text-xs text-slate-400">€ Med</label><input type="number" value={form.cost_med} onChange={(e) => setForm({ ...form, cost_med: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" /></div>
            <div><label className="text-xs text-slate-400">€ Max</label><input type="number" value={form.cost_high} onChange={(e) => setForm({ ...form, cost_high: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" /></div>
            <div><label className="text-xs text-slate-400">€ Comida</label><input type="number" value={form.food_per_day} onChange={(e) => setForm({ ...form, food_per_day: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-400">Latitude</label><input type="number" step="0.01" value={form.lat} onChange={(e) => setForm({ ...form, lat: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" /></div>
            <div><label className="text-xs text-slate-400">Longitude</label><input type="number" step="0.01" value={form.lon} onChange={(e) => setForm({ ...form, lon: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" /></div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-2">Atributos (0-5)</label>
            <div className="grid grid-cols-3 gap-2">
              {ATTR_KEYS.map((attr) => (
                <div key={attr} className="flex items-center gap-2 bg-slate-800 rounded px-2 py-1">
                  <span className="text-sm flex-1">{ATTR_LABELS[attr]}</span>
                  <input type="number" min={0} max={5} value={form.attrs[attr] || 0} onChange={(e) => setForm({ ...form, attrs: { ...form.attrs, [attr]: parseInt(e.target.value) || 0 } })} className="w-12 px-2 py-1 bg-slate-700 rounded border border-slate-600 text-white text-sm text-center" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-4 border-t border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">Cancelar</button>
          <button onClick={() => onSave(form)} disabled={!form.id || !form.name} className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg font-semibold disabled:opacity-50">
            {isNew ? "Criar" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// GROUP MODAL
// ═══════════════════════════════════════════════════════════════
function GroupModal({ group, isNew, onClose, onSave }: { group: Group; isNew: boolean; onClose: () => void; onSave: (g: Group) => void }) {
  const [form, setForm] = useState<Group>({ ...group });
  const generateSlug = (name: string) => name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-700">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-bold">{isNew ? "Novo Grupo" : "Editar Grupo"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>
        <div className="p-4 space-y-4">
          <div><label className="text-xs text-slate-400">ID</label><input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} disabled={!isNew} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white disabled:opacity-50" /></div>
          <div><label className="text-xs text-slate-400">Nome</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" /></div>
          <div><label className="text-xs text-slate-400">Slug (URL)</label><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} onBlur={() => { if (!form.slug && form.name) setForm({ ...form, slug: generateSlug(form.name) }); }} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" /></div>
          <div><label className="text-xs text-slate-400">Descrição</label><input value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-400">Data Início</label><input type="date" value={form.cal_start} onChange={(e) => setForm({ ...form, cal_start: e.target.value })} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" /></div>
            <div><label className="text-xs text-slate-400">Data Fim</label><input type="date" value={form.cal_end} onChange={(e) => setForm({ ...form, cal_end: e.target.value })} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" /></div>
          </div>
        </div>
        <div className="p-4 border-t border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">Cancelar</button>
          <button onClick={() => onSave(form)} disabled={!form.id || !form.name || !form.slug} className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg font-semibold disabled:opacity-50">{isNew ? "Criar" : "Guardar"}</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MEMBER MODAL
// ═══════════════════════════════════════════════════════════════
function MemberModal({ member, isNew, onClose, onSave }: { member: Member; isNew: boolean; onClose: () => void; onSave: (m: Member) => void }) {
  const [form, setForm] = useState<Member>({ ...member });
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-sm border border-slate-700">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-bold">{isNew ? "Novo Membro" : "Editar Membro"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>
        <div className="p-4 space-y-4">
          <div><label className="text-xs text-slate-400">Nome</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" autoFocus /></div>
          <div><label className="text-xs text-slate-400">Ordem</label><input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" /></div>
        </div>
        <div className="p-4 border-t border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">Cancelar</button>
          <button onClick={() => onSave(form)} disabled={!form.name} className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg font-semibold disabled:opacity-50">{isNew ? "Adicionar" : "Guardar"}</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// QUESTION MODAL
// ═══════════════════════════════════════════════════════════════
function QuestionModal({ question, isNew, onClose, onSave }: { question: QuizQuestion; isNew: boolean; onClose: () => void; onSave: (q: QuizQuestion) => void }) {
  const [form, setForm] = useState<QuizQuestion>({ ...question });
  const generateId = (text: string) => "q" + (text.length > 0 ? text.substring(0, 10) : Date.now()).toString().toLowerCase().replace(/[^a-z0-9]/g, "");

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-700">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-bold">{isNew ? "Nova Pergunta" : "Editar Pergunta"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>
        <div className="p-4 space-y-4">
          <div><label className="text-xs text-slate-400">ID</label><input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} disabled={!isNew} onBlur={() => { if (isNew && !form.id) setForm({ ...form, id: generateId(form.question) }); }} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white disabled:opacity-50" /></div>
          <div><label className="text-xs text-slate-400">Emoji</label><input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" /></div>
          <div><label className="text-xs text-slate-400">Pergunta</label><input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" /></div>
          <div><label className="text-xs text-slate-400">Ordem</label><input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" /></div>
        </div>
        <div className="p-4 border-t border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">Cancelar</button>
          <button onClick={() => onSave(form)} disabled={!form.id || !form.question} className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg font-semibold disabled:opacity-50">{isNew ? "Criar" : "Guardar"}</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// OPTION MODAL
// ═══════════════════════════════════════════════════════════════
function OptionModal({ option, isNew, onClose, onSave }: { option: QuizOption; isNew: boolean; onClose: () => void; onSave: (o: QuizOption) => void }) {
  const [form, setForm] = useState<QuizOption>({ ...option, attrs: { ...option.attrs } });
  const generateId = () => option.question_id + String.fromCharCode(97 + option.display_order);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 rounded-2xl w-full max-w-lg my-8 border border-slate-700">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-bold">{isNew ? "Nova Opção" : "Editar Opção"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>
        <div className="p-4 space-y-4">
          <div><label className="text-xs text-slate-400">ID</label><input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} disabled={!isNew} onBlur={() => { if (isNew && !form.id) setForm({ ...form, id: generateId() }); }} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white disabled:opacity-50" /></div>
          <div><label className="text-xs text-slate-400">Texto da opção</label><input value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" /></div>
          <div><label className="text-xs text-slate-400">Ordem</label><input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" /></div>
          <div>
            <label className="text-xs text-slate-400 block mb-2">Atributos (afetam ranking dos destinos)</label>
            <div className="grid grid-cols-3 gap-2">
              {ATTR_KEYS.map((attr) => (
                <div key={attr} className="flex items-center gap-1 bg-slate-800 rounded px-2 py-1">
                  <span className="text-xs flex-1">{ATTR_LABELS[attr].split(" ")[0]}</span>
                  <input type="number" min={-5} max={5} value={form.attrs[attr] || 0} onChange={(e) => { const v = parseInt(e.target.value) || 0; const newAttrs = { ...form.attrs }; if (v === 0) delete newAttrs[attr]; else newAttrs[attr] = v; setForm({ ...form, attrs: newAttrs }); }} className="w-10 px-1 py-0.5 bg-slate-700 rounded border border-slate-600 text-white text-xs text-center" />
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-1">Positivo = favorece destinos com esse atributo. Negativo = penaliza.</p>
          </div>
        </div>
        <div className="p-4 border-t border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">Cancelar</button>
          <button onClick={() => onSave(form)} disabled={!form.id || !form.text} className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg font-semibold disabled:opacity-50">{isNew ? "Criar" : "Guardar"}</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// FACTOR MODAL
// ═══════════════════════════════════════════════════════════════
function FactorModal({ factor, isNew, onClose, onSave }: { factor: Factor; isNew: boolean; onClose: () => void; onSave: (f: Factor) => void }) {
  const [form, setForm] = useState<Factor>({ ...factor });
  const generateId = (name: string) => name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-700">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-bold">{isNew ? "Novo Fator" : "Editar Fator"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">×</button>
        </div>
        <div className="p-4 space-y-4">
          <div><label className="text-xs text-slate-400">ID</label><input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} disabled={!isNew} onBlur={() => { if (isNew && !form.id && form.name) setForm({ ...form, id: generateId(form.name) }); }} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white disabled:opacity-50" /></div>
          <div><label className="text-xs text-slate-400">Nome</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Praia" className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" /></div>
          <div><label className="text-xs text-slate-400">Emoji</label><input value={form.emoji} onChange={(e) => setForm({ ...form, emoji: e.target.value })} placeholder="🏖️" className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" /></div>
          <div>
            <label className="text-xs text-slate-400">Attr Key (liga aos destinos)</label>
            <select value={form.attr_key} onChange={(e) => setForm({ ...form, attr_key: e.target.value })} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white">
              <option value="">-- Selecionar --</option>
              {ATTR_KEYS.map((k) => <option key={k} value={k}>{k} - {ATTR_LABELS[k]}</option>)}
            </select>
          </div>
          <div><label className="text-xs text-slate-400">Ordem</label><input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2 bg-slate-800 rounded border border-slate-700 text-white" /></div>
        </div>
        <div className="p-4 border-t border-slate-800 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg">Cancelar</button>
          <button onClick={() => onSave(form)} disabled={!form.id || !form.name || !form.attr_key} className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-pink-500 rounded-lg font-semibold disabled:opacity-50">{isNew ? "Criar" : "Guardar"}</button>
        </div>
      </div>
    </div>
  );
}
