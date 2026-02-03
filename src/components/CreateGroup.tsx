"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateGroup() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    admin_password: "",
    confirm_password: "",
    admin_email: "",
    cal_start: "2026-04-24",
    cal_end: "2026-05-08",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  function generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30);
  }

  function handleNameChange(value: string) {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: slugTouched ? prev.slug : generateSlug(value),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Nome do grupo é obrigatório");
      return;
    }
    if (!form.slug.trim()) {
      setError("URL do grupo é obrigatória");
      return;
    }
    if (form.admin_password.length < 4) {
      setError("A password deve ter pelo menos 4 caracteres");
      return;
    }
    if (form.admin_password !== form.confirm_password) {
      setError("As passwords não coincidem");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim(),
          description: form.description.trim() || null,
          admin_password: form.admin_password,
          admin_email: form.admin_email.trim() || null,
          cal_start: form.cal_start,
          cal_end: form.cal_end,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao criar grupo");
        setLoading(false);
        return;
      }

      localStorage.setItem(`fuga_admin_${form.slug}`, form.admin_password);
      router.push(`/${form.slug}/admin`);
    } catch (err: any) {
      setError(err.message || "Erro de ligação");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-10 pt-4">
          <div className="text-7xl mb-4">+</div>
          <h1 className="text-4xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              Criar Grupo
            </span>
          </h1>
          <p className="text-slate-400 mt-3 text-lg">
            Planeia a tua viagem com os amigos
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-400 block mb-2">Nome do Grupo *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Viagem Erasmus 2026"
              className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl p-3.5 text-white outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-400 block mb-2">URL do Grupo *</label>
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-sm">fuga-sa.vercel.app/</span>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setForm((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }));
                }}
                placeholder="erasmus2026"
                className="flex-1 bg-slate-800/80 border border-slate-700/50 rounded-xl p-3.5 text-white outline-none focus:ring-2 focus:ring-orange-500/50 font-mono"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5">Apenas letras minúsculas, números e hífens</p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-400 block mb-2">Descrição</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="A nossa viagem épica de formatura..."
              rows={2}
              className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl p-3.5 text-white outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-400 block mb-2">Data Início</label>
              <input
                type="date"
                value={form.cal_start}
                onChange={(e) => setForm((prev) => ({ ...prev, cal_start: e.target.value }))}
                className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl p-3.5 text-white outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-400 block mb-2">Data Fim</label>
              <input
                type="date"
                value={form.cal_end}
                onChange={(e) => setForm((prev) => ({ ...prev, cal_end: e.target.value }))}
                className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl p-3.5 text-white outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 my-6" />

          <div>
            <label className="text-sm font-medium text-slate-400 block mb-2">Password de Admin *</label>
            <input
              type="password"
              value={form.admin_password}
              onChange={(e) => setForm((prev) => ({ ...prev, admin_password: e.target.value }))}
              placeholder="Mínimo 4 caracteres"
              className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl p-3.5 text-white outline-none focus:ring-2 focus:ring-orange-500/50"
            />
            <p className="text-xs text-slate-500 mt-1.5">Vais precisar desta password para gerir o grupo</p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-400 block mb-2">Confirmar Password *</label>
            <input
              type="password"
              value={form.confirm_password}
              onChange={(e) => setForm((prev) => ({ ...prev, confirm_password: e.target.value }))}
              placeholder="Repetir password"
              className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl p-3.5 text-white outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-400 block mb-2">Email (opcional)</label>
            <input
              type="email"
              value={form.admin_email}
              onChange={(e) => setForm((prev) => ({ ...prev, admin_email: e.target.value }))}
              placeholder="teu@email.com"
              className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl p-3.5 text-white outline-none focus:ring-2 focus:ring-orange-500/50"
            />
            <p className="text-xs text-slate-500 mt-1.5">Para recuperar acesso se perderes a password</p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl font-bold text-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/25 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "A criar..." : "Criar Grupo"}
          </button>

          <a href="/" className="block text-center text-slate-400 hover:text-white text-sm py-2">
            Cancelar
          </a>
        </form>
      </div>
    </div>
  );
}
