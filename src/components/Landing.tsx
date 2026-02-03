"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { loadAllGroups } from "@/lib/supabase";
import type { Group } from "@/lib/types";

export default function Landing() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllGroups().then((g) => { setGroups(g); setLoading(false); });
  }, []);

  function handleGo() {
    if (code.trim()) router.push(`/${code.trim().toLowerCase()}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-6xl animate-bounce">✈️</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-lg mx-auto px-4 py-12">
        <div className="text-center mb-12 pt-4">
          <div className="text-7xl mb-4 animate-bounce" style={{ animationDuration: "2s" }}>✈️</div>
          <h1 className="text-5xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              Fuga, SA
            </span>
          </h1>
          <p className="text-slate-400 mt-3 text-lg">Planeia viagens épicas com amigos</p>
        </div>

        {/* Enter code */}
        <div className="bg-slate-800/60 border border-slate-700/30 rounded-2xl p-6 mb-8">
          <p className="text-sm text-slate-400 mb-3">Tens um código de grupo?</p>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGo()}
              placeholder="Ex: fuga2026"
              className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-orange-500/50"
            />
            <button
              onClick={handleGo}
              disabled={!code.trim()}
              className="px-6 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-all disabled:opacity-40"
            >
              Entrar →
            </button>
          </div>
        </div>

        {/* Group list */}
        {groups.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-slate-300 mb-4">Grupos ativos</h2>
            <div className="space-y-3">
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => router.push(`/${g.slug}`)}
                  className="w-full bg-slate-800/60 border border-slate-700/30 rounded-2xl p-5 text-left hover:bg-slate-700/60 transition-all hover:ring-2 hover:ring-orange-500/30 active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">✈️</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-lg">{g.name}</p>
                      {g.description && <p className="text-sm text-slate-400 truncate">{g.description}</p>}
                      <p className="text-xs text-slate-500 mt-1">
                        📅 {new Date(g.cal_start).toLocaleDateString("pt")} — {new Date(g.cal_end).toLocaleDateString("pt")}
                      </p>
                    </div>
                    <span className="text-slate-500">→</span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
