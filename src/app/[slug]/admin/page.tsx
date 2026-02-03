"use client";

import { useState, useEffect, useCallback, use } from "react";

interface Group {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  cal_start: string;
  cal_end: string;
  admin_email: string | null;
  is_public: boolean;
}

interface Member {
  id: string;
  group_id: string;
  name: string;
  display_order: number;
}

interface Destination {
  id: string;
  name: string;
  country: string;
  flag: string;
  category: string;
}

interface Factor {
  id: string;
  name: string;
  emoji: string;
  attr_key: string;
  display_order: number;
}

interface QuizQuestion {
  id: string;
  emoji: string;
  question: string;
  display_order: number;
}

type Tab = "details" | "destinations" | "quiz" | "factors" | "members";

export default function GroupAdminPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [tab, setTab] = useState<Tab>("details");

  // Data
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [selections, setSelections] = useState<{
    destinations: string[];
    factors: string[];
    quizQuestions: string[];
  }>({ destinations: [], factors: [], quizQuestions: [] });
  const [catalog, setCatalog] = useState<{
    destinations: Destination[];
    factors: Factor[];
    quizQuestions: QuizQuestion[];
  }>({ destinations: [], factors: [], quizQuestions: [] });

  // Form state
  const [editingGroup, setEditingGroup] = useState<Partial<Group>>({});
  const [searchDest, setSearchDest] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const headers = useCallback(() => ({ "x-admin-password": password }), [password]);

  const showMessage = (text: string, type: "success" | "error" = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  // Check stored password on mount
  useEffect(() => {
    const stored = localStorage.getItem(`fuga_admin_${slug}`);
    if (stored) {
      setPassword(stored);
    }
    setLoading(false);
  }, [slug]);

  // Load data when authenticated
  const loadData = useCallback(async () => {
    if (!password) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${slug}/admin`, {
        headers: { "x-admin-password": password },
      });

      if (res.status === 401) {
        setAuthenticated(false);
        localStorage.removeItem(`fuga_admin_${slug}`);
        setError("Password incorreta");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error("Erro ao carregar dados");
      }

      const data = await res.json();
      setGroup(data.group);
      setEditingGroup(data.group);
      setSelections(data.selections);
      setMembers(data.members);
      setCatalog(data.catalog);
      setAuthenticated(true);
      localStorage.setItem(`fuga_admin_${slug}`, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [slug, password]);

  useEffect(() => {
    if (password) {
      loadData();
    }
  }, [password, loadData]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Introduz a password");
      return;
    }

    loadData();
  };

  const saveChanges = async (body: any) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/groups/${slug}/admin`, {
        method: "PATCH",
        headers: { ...headers(), "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao guardar");
      }

      showMessage("Guardado!");
      loadData();
    } catch (err: any) {
      showMessage(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Toggle destination selection
  const toggleDestination = (destId: string) => {
    const newDests = selections.destinations.includes(destId)
      ? selections.destinations.filter((id) => id !== destId)
      : [...selections.destinations, destId];
    setSelections((prev) => ({ ...prev, destinations: newDests }));
  };

  // Toggle factor selection
  const toggleFactor = (factorId: string) => {
    const newFactors = selections.factors.includes(factorId)
      ? selections.factors.filter((id) => id !== factorId)
      : [...selections.factors, factorId];
    setSelections((prev) => ({ ...prev, factors: newFactors }));
  };

  // Toggle quiz question selection
  const toggleQuiz = (qId: string) => {
    const newQuiz = selections.quizQuestions.includes(qId)
      ? selections.quizQuestions.filter((id) => id !== qId)
      : [...selections.quizQuestions, qId];
    setSelections((prev) => ({ ...prev, quizQuestions: newQuiz }));
  };

  // Add member
  const addMember = async () => {
    if (!newMemberName.trim()) return;
    await saveChanges({
      newMember: {
        name: newMemberName.trim(),
        display_order: members.length,
      },
    });
    setNewMemberName("");
  };

  // Delete member
  const deleteMember = async (id: string, name: string) => {
    if (!confirm(`Apagar ${name}?`)) return;
    await saveChanges({ deleteMember: id });
  };

  // Update member
  const updateMember = async () => {
    if (!editingMember) return;
    await saveChanges({ updateMember: editingMember });
    setEditingMember(null);
  };

  // Filter destinations
  const filteredDestinations = catalog.destinations.filter(
    (d) =>
      d.name.toLowerCase().includes(searchDest.toLowerCase()) ||
      d.country.toLowerCase().includes(searchDest.toLowerCase()) ||
      d.category.toLowerCase().includes(searchDest.toLowerCase())
  );

  // Group destinations by category
  const destByCategory = filteredDestinations.reduce((acc, d) => {
    if (!acc[d.category]) acc[d.category] = [];
    acc[d.category].push(d);
    return acc;
  }, {} as Record<string, Destination[]>);

  // Login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-3xl p-8 w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold text-white">Admin</h1>
            <p className="text-slate-400 mt-2">/{slug}</p>
          </div>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Password de admin"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-700/50 border border-slate-600 rounded-xl p-3.5 text-white mb-4 outline-none focus:ring-2 focus:ring-orange-500/50"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold disabled:opacity-50"
            >
              {loading ? "A verificar..." : "Entrar"}
            </button>
          </form>
          <a href={`/${slug}`} className="block text-center text-slate-400 hover:text-white text-sm mt-4">
            Voltar ao grupo
          </a>
        </div>
      </div>
    );
  }

  if (loading || !group) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-6xl animate-bounce">...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Toast */}
      {message && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-xl z-50 ${message.type === "success" ? "bg-emerald-500" : "bg-red-500"}`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Admin: {group.name}</h1>
            <p className="text-slate-400 text-sm">/{group.slug}</p>
          </div>
          <div className="flex items-center gap-3">
            <a href={`/${slug}`} className="text-sm text-slate-400 hover:text-white">
              Ver grupo
            </a>
            <button
              onClick={() => {
                localStorage.removeItem(`fuga_admin_${slug}`);
                setAuthenticated(false);
                setPassword("");
              }}
              className="text-sm text-slate-400 hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-4 pb-3 flex gap-2 flex-wrap">
          {([
            ["details", "Detalhes"],
            ["destinations", `Destinos (${selections.destinations.length})`],
            ["quiz", `Quiz (${selections.quizQuestions.length})`],
            ["factors", `Fatores (${selections.factors.length})`],
            ["members", `Membros (${members.length})`],
          ] as [Tab, string][]).map(([t, label]) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl font-medium text-sm transition ${
                tab === t ? "bg-orange-500 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* DETAILS TAB */}
        {tab === "details" && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-slate-800/60 border border-slate-700/30 rounded-2xl p-6">
              <h2 className="text-lg font-bold mb-4">Informações do Grupo</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Nome</label>
                  <input
                    value={editingGroup.name || ""}
                    onChange={(e) => setEditingGroup((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl p-3 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Descrição</label>
                  <textarea
                    value={editingGroup.description || ""}
                    onChange={(e) => setEditingGroup((prev) => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl p-3 text-white resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Data Início</label>
                    <input
                      type="date"
                      value={editingGroup.cal_start || ""}
                      onChange={(e) => setEditingGroup((prev) => ({ ...prev, cal_start: e.target.value }))}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl p-3 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-slate-400 block mb-1">Data Fim</label>
                    <input
                      type="date"
                      value={editingGroup.cal_end || ""}
                      onChange={(e) => setEditingGroup((prev) => ({ ...prev, cal_end: e.target.value }))}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl p-3 text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-400 block mb-1">Email Admin</label>
                  <input
                    type="email"
                    value={editingGroup.admin_email || ""}
                    onChange={(e) => setEditingGroup((prev) => ({ ...prev, admin_email: e.target.value }))}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl p-3 text-white"
                  />
                </div>
                <button
                  onClick={() => saveChanges({ updates: editingGroup })}
                  disabled={saving}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold disabled:opacity-50"
                >
                  {saving ? "A guardar..." : "Guardar Alterações"}
                </button>
              </div>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/20 rounded-2xl p-4 text-center">
              <p className="text-slate-400 text-sm">
                Link do grupo: <span className="text-orange-400 font-mono">fuga-sa.vercel.app/{group.slug}</span>
              </p>
            </div>
          </div>
        )}

        {/* DESTINATIONS TAB */}
        {tab === "destinations" && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex gap-3 items-center">
              <input
                type="text"
                placeholder="Pesquisar destinos..."
                value={searchDest}
                onChange={(e) => setSearchDest(e.target.value)}
                className="flex-1 bg-slate-800/60 border border-slate-700/50 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-orange-500/50"
              />
              <span className="text-slate-400 text-sm whitespace-nowrap">
                {selections.destinations.length} selecionados
              </span>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelections((prev) => ({ ...prev, destinations: catalog.destinations.map((d) => d.id) }))}
                className="px-3 py-1.5 rounded-lg bg-slate-700 text-sm text-slate-300 hover:bg-slate-600"
              >
                Selecionar Todos
              </button>
              <button
                onClick={() => setSelections((prev) => ({ ...prev, destinations: [] }))}
                className="px-3 py-1.5 rounded-lg bg-slate-700 text-sm text-slate-300 hover:bg-slate-600"
              >
                Limpar Todos
              </button>
            </div>

            {Object.entries(destByCategory).map(([category, dests]) => (
              <div key={category} className="bg-slate-800/60 border border-slate-700/30 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/30">
                  <h3 className="font-semibold">{category}</h3>
                </div>
                <div className="p-3 grid grid-cols-2 md:grid-cols-3 gap-2">
                  {dests.map((d) => {
                    const selected = selections.destinations.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        onClick={() => toggleDestination(d.id)}
                        className={`p-3 rounded-xl text-left text-sm transition ${
                          selected
                            ? "bg-orange-500/20 ring-1 ring-orange-500/50 text-white"
                            : "bg-slate-700/40 text-slate-300 hover:bg-slate-700/60"
                        }`}
                      >
                        <span className="mr-1">{d.flag}</span>
                        {d.name}
                        <span className="text-xs text-slate-500 block">{d.country}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              onClick={() => saveChanges({ selections: { destinations: selections.destinations } })}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold disabled:opacity-50"
            >
              {saving ? "A guardar..." : "Guardar Destinos"}
            </button>
          </div>
        )}

        {/* QUIZ TAB */}
        {tab === "quiz" && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-slate-400 text-sm">
              Seleciona as perguntas que queres incluir no quiz do teu grupo.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() =>
                  setSelections((prev) => ({ ...prev, quizQuestions: catalog.quizQuestions.map((q) => q.id) }))
                }
                className="px-3 py-1.5 rounded-lg bg-slate-700 text-sm text-slate-300 hover:bg-slate-600"
              >
                Selecionar Todas
              </button>
              <button
                onClick={() => setSelections((prev) => ({ ...prev, quizQuestions: [] }))}
                className="px-3 py-1.5 rounded-lg bg-slate-700 text-sm text-slate-300 hover:bg-slate-600"
              >
                Limpar Todas
              </button>
            </div>

            <div className="space-y-2">
              {catalog.quizQuestions.map((q) => {
                const selected = selections.quizQuestions.includes(q.id);
                return (
                  <button
                    key={q.id}
                    onClick={() => toggleQuiz(q.id)}
                    className={`w-full p-4 rounded-xl text-left transition ${
                      selected
                        ? "bg-orange-500/20 ring-1 ring-orange-500/50"
                        : "bg-slate-800/60 hover:bg-slate-800/80"
                    }`}
                  >
                    <span className="text-2xl mr-3">{q.emoji}</span>
                    <span>{q.question}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => saveChanges({ selections: { quizQuestions: selections.quizQuestions } })}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold disabled:opacity-50"
            >
              {saving ? "A guardar..." : "Guardar Quiz"}
            </button>
          </div>
        )}

        {/* FACTORS TAB */}
        {tab === "factors" && (
          <div className="space-y-4 animate-fade-in">
            <p className="text-slate-400 text-sm">
              Seleciona os fatores de prioridade que os membros podem ordenar.
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => setSelections((prev) => ({ ...prev, factors: catalog.factors.map((f) => f.id) }))}
                className="px-3 py-1.5 rounded-lg bg-slate-700 text-sm text-slate-300 hover:bg-slate-600"
              >
                Selecionar Todos
              </button>
              <button
                onClick={() => setSelections((prev) => ({ ...prev, factors: [] }))}
                className="px-3 py-1.5 rounded-lg bg-slate-700 text-sm text-slate-300 hover:bg-slate-600"
              >
                Limpar Todos
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {catalog.factors.map((f) => {
                const selected = selections.factors.includes(f.id);
                return (
                  <button
                    key={f.id}
                    onClick={() => toggleFactor(f.id)}
                    className={`p-4 rounded-xl text-left transition ${
                      selected
                        ? "bg-orange-500/20 ring-1 ring-orange-500/50"
                        : "bg-slate-800/60 hover:bg-slate-800/80"
                    }`}
                  >
                    <span className="text-2xl mr-2">{f.emoji}</span>
                    <span>{f.name}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => saveChanges({ selections: { factors: selections.factors } })}
              disabled={saving}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold disabled:opacity-50"
            >
              {saving ? "A guardar..." : "Guardar Fatores"}
            </button>
          </div>
        )}

        {/* MEMBERS TAB */}
        {tab === "members" && (
          <div className="space-y-4 animate-fade-in">
            {/* Add member form */}
            <div className="bg-slate-800/60 border border-slate-700/30 rounded-2xl p-4">
              <h3 className="font-semibold mb-3">Adicionar Membro</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nome do membro"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addMember()}
                  className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-orange-500/50"
                />
                <button
                  onClick={addMember}
                  disabled={saving || !newMemberName.trim()}
                  className="px-6 py-3 rounded-xl bg-green-600 text-white font-semibold disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Members list */}
            <div className="space-y-2">
              {members.length === 0 ? (
                <p className="text-slate-500 text-center py-8">Nenhum membro adicionado</p>
              ) : (
                members
                  .sort((a, b) => a.display_order - b.display_order)
                  .map((m) => (
                    <div
                      key={m.id}
                      className="bg-slate-800/60 border border-slate-700/30 rounded-xl p-4 flex items-center gap-3"
                    >
                      <div className="flex-1">
                        {editingMember?.id === m.id ? (
                          <input
                            type="text"
                            value={editingMember.name}
                            onChange={(e) => setEditingMember((prev) => prev && { ...prev, name: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && updateMember()}
                            className="bg-slate-700 border border-slate-600 rounded-lg p-2 text-white w-full"
                            autoFocus
                          />
                        ) : (
                          <p className="font-medium">{m.name}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {editingMember?.id === m.id ? (
                          <>
                            <button
                              onClick={updateMember}
                              className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditingMember(null)}
                              className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-sm"
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => setEditingMember(m)}
                              className="px-3 py-1.5 rounded-lg bg-slate-700 text-slate-300 text-sm hover:bg-slate-600"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => deleteMember(m.id, m.name)}
                              className="px-3 py-1.5 rounded-lg bg-red-900/30 text-red-400 text-sm hover:bg-red-900/50"
                            >
                              Apagar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
