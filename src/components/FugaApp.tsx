"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  loadAllData,
  saveUserData,
  subscribeToChanges,
  unsubscribe,
} from "@/lib/supabase";
import {
  USERS, AVATARS, ORIGINS, CAL_DATES, DAYS_PT,
  DESTINATIONS, QUIZ, FACTORS,
} from "@/lib/data";
import {
  haversine, flightCost, getBadge, dayOfWeek,
  dayNum, monthLabel, calcScore, bestWindows,
} from "@/lib/helpers";

// ═══════════════════════════════════════════════════════════
// UI Components
// ═══════════════════════════════════════════════════════════

function Btn({ children, onClick, disabled, variant = "primary", className = "" }: any) {
  const base = "w-full py-3.5 rounded-2xl font-bold text-base transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:active:scale-100 ";
  const styles: any = {
    primary: "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40",
    secondary: "bg-slate-700 text-slate-200 hover:bg-slate-600",
    ghost: "bg-transparent text-slate-400 hover:text-white",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={base + styles[variant] + " " + className}>
      {children}
    </button>
  );
}

function Toast({ message, type = "success" }: { message: string; type?: string }) {
  const bg = type === "error" ? "bg-red-500/90" : type === "info" ? "bg-blue-500/90" : "bg-emerald-500/90";
  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 ${bg} text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-fade-in`}>
      {message}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// PIN Modal
// ═══════════════════════════════════════════════════════════

function PinModal({ user, hasExistingPin, onSuccess, onCancel }: any) {
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"enter" | "create" | "confirm">(hasExistingPin ? "enter" : "create");

  function handleSubmit() {
    if (step === "create") {
      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        setError("O PIN deve ter 4 dígitos");
        return;
      }
      setStep("confirm");
      setConfirmPin("");
      setError("");
      return;
    }
    if (step === "confirm") {
      if (confirmPin !== pin) {
        setError("Os PINs não coincidem!");
        setConfirmPin("");
        return;
      }
      onSuccess(pin, true);
      return;
    }
    // step === "enter"
    if (pin.length !== 4) {
      setError("Introduz o teu PIN de 4 dígitos");
      return;
    }
    onSuccess(pin, false);
  }

  const title = step === "create" ? "Cria o teu PIN 🔐" : step === "confirm" ? "Confirma o PIN" : "Introduz o teu PIN 🔐";
  const subtitle = step === "create" ? "Escolhe 4 dígitos para proteger o teu perfil" : step === "confirm" ? "Repete o PIN para confirmar" : "Para editar o teu perfil";
  const inputVal = step === "confirm" ? confirmPin : pin;
  const setInputVal = step === "confirm" ? setConfirmPin : setPin;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700/50 rounded-3xl p-6 w-full max-w-sm animate-fade-in">
        <div className="text-center mb-6">
          <span className="text-5xl block mb-3">{user.avatar || "🔐"}</span>
          <h3 className="text-xl font-bold">{title}</h3>
          <p className="text-sm text-slate-400 mt-1">{subtitle}</p>
        </div>
        <div className="flex justify-center gap-3 mb-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${
                inputVal[i]
                  ? "border-orange-500 bg-orange-500/10 text-orange-400"
                  : "border-slate-600 bg-slate-700/50 text-slate-600"
              }`}
            >
              {inputVal[i] ? "•" : ""}
            </div>
          ))}
        </div>
        <input
          type="tel"
          maxLength={4}
          value={inputVal}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "").slice(0, 4);
            setInputVal(v);
            setError("");
          }}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="w-full bg-slate-700/50 border border-slate-600 rounded-xl p-3 text-center text-xl tracking-[1em] text-white outline-none focus:ring-2 focus:ring-orange-500/50 mb-2"
          placeholder="····"
          autoFocus
          inputMode="numeric"
          pattern="\d{4}"
        />
        {error && <p className="text-red-400 text-sm text-center mb-3">{error}</p>}
        <div className="flex gap-2 mt-4">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-slate-700 text-slate-300 font-medium hover:bg-slate-600 transition-all">
            Cancelar
          </button>
          <button onClick={handleSubmit} disabled={inputVal.length < 4} className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-all disabled:opacity-40">
            {step === "create" ? "Seguinte" : step === "confirm" ? "Criar PIN" : "Entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// HOME SCREEN
// ═══════════════════════════════════════════════════════════

function HomeScreen({ allData, onSelect, onDash }: any) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-10 pt-4">
          <div className="text-7xl mb-4 animate-bounce" style={{ animationDuration: "2s" }}>✈️</div>
          <h1 className="text-5xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">
              Fuga, SA
            </span>
          </h1>
          <p className="text-slate-400 mt-3 text-lg">Maio 2026 — A viagem épica do grupo</p>
        </div>

        <button
          onClick={onDash}
          className="w-full mb-8 py-4 rounded-2xl bg-slate-800/80 border border-slate-700/50 text-slate-200 hover:bg-slate-700/80 transition-all flex items-center justify-center gap-3 text-lg font-semibold"
        >
          📊 Dashboard do Grupo
        </button>

        <h2 className="text-xl font-bold mb-4 text-slate-300">Quem és tu?</h2>
        <div className="grid grid-cols-2 gap-3">
          {USERS.map((u) => {
            const d = allData[u.id] || {};
            const done = (d.completedSteps || []).filter(Boolean).length;
            return (
              <button
                key={u.id}
                onClick={() => onSelect(u.id)}
                className="bg-slate-800/60 backdrop-blur rounded-2xl p-5 text-center hover:bg-slate-700/60 transition-all duration-200 hover:ring-2 hover:ring-orange-500/40 hover:scale-[1.03] active:scale-95 border border-slate-700/30"
              >
                <span className="text-5xl block mb-2">{d.avatar || "❓"}</span>
                <p className="font-semibold text-sm truncate">{d.nickname || u.name}</p>
                <div className="flex gap-0.5 mt-3 justify-center">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`w-4 h-1.5 rounded-full transition-all ${
                        (d.completedSteps || [])[i] ? "bg-emerald-500" : "bg-slate-700"
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-1.5">
                  {done === 6 ? "✅ Completo" : `${done}/6 etapas`}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// WIZARD STEPS
// ═══════════════════════════════════════════════════════════

function StepProfile({ user, data, onSave }: any) {
  const [avatar, setAvatar] = useState(data.avatar || "🎯");
  const [nick, setNick] = useState(data.nickname || user.name.split(" ")[0]);
  const [city, setCity] = useState(data.originCity || "");

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-sm font-medium text-slate-400 mb-3">Escolhe o teu avatar</p>
        <div className="grid grid-cols-5 gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              onClick={() => setAvatar(a)}
              className={`text-3xl p-2.5 rounded-xl transition-all duration-150 ${
                avatar === a
                  ? "bg-orange-500/30 ring-2 ring-orange-500 scale-110"
                  : "bg-slate-800/80 hover:bg-slate-700"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-400 mb-2">Alcunha</p>
        <input
          value={nick}
          onChange={(e) => setNick(e.target.value)}
          className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl p-3.5 text-white outline-none focus:ring-2 focus:ring-orange-500/50"
          placeholder="Como te chamam?"
        />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-400 mb-2">Cidade de partida ✈️</p>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl p-3.5 text-white outline-none focus:ring-2 focus:ring-orange-500/50"
        >
          <option value="">Seleciona a tua cidade...</option>
          {ORIGINS.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>
      <Btn onClick={() => onSave({ avatar, nickname: nick, originCity: city })} disabled={!city || !nick}>
        Guardar & Continuar →
      </Btn>
    </div>
  );
}

function StepProbability({ user, data, onSave }: any) {
  const [intention, setIntention] = useState(data.intention ?? 5);
  const [possibility, setPossibility] = useState(data.possibility ?? 5);
  const [final_, setFinal] = useState(data.probability ?? 5);
  const sug = Math.round(0.55 * possibility + 0.45 * intention);
  const badge = getBadge(final_);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center text-7xl mb-2">{data.avatar || "🎯"}</div>
      {[
        { label: "🎯 Intenção de ir", val: intention, set: setIntention },
        { label: "📊 Possibilidade real", val: possibility, set: setPossibility },
      ].map(({ label, val, set }) => (
        <div key={label}>
          <div className="flex justify-between mb-1">
            <span className="text-sm text-slate-300">{label}</span>
            <span className="text-orange-400 font-bold text-lg">{val}</span>
          </div>
          <input type="range" min="0" max="10" value={val} onChange={(e) => set(+e.target.value)} className="w-full" />
        </div>
      ))}
      <div className="bg-slate-800/80 border border-slate-700/30 rounded-2xl p-4">
        <p className="text-sm text-slate-400 mb-1">
          Sugestão automática: <span className="text-white font-bold">{sug}/10</span>
        </p>
        <div className="flex justify-between mb-1">
          <span className="text-sm text-slate-300">🎲 Probabilidade final</span>
          <span className="text-orange-400 font-bold text-lg">{final_}</span>
        </div>
        <input type="range" min="0" max="10" value={final_} onChange={(e) => setFinal(+e.target.value)} className="w-full" />
        {final_ !== sug && (
          <button onClick={() => setFinal(sug)} className="mt-2 text-sm text-orange-400 underline">
            Usar sugestão ({sug})
          </button>
        )}
      </div>
      <div className="text-center py-3">
        <span className={`text-2xl font-bold ${badge.cl}`}>{badge.text}</span>
      </div>
      <Btn onClick={() => onSave({ intention, possibility, probability: final_ })}>Guardar & Continuar →</Btn>
    </div>
  );
}

function StepCalendar({ user, data, onSave }: any) {
  const [cal, setCal] = useState<Record<string, string>>(data.calendar || {});

  function toggle(d: string) {
    setCal((p) => {
      const c = p[d];
      const nxt = !c ? "tentative" : c === "tentative" ? "available" : undefined;
      const u = { ...p };
      if (nxt) u[d] = nxt;
      else delete u[d];
      return u;
    });
  }

  const avail = Object.values(cal).filter((v) => v === "available").length;
  const tent = Object.values(cal).filter((v) => v === "tentative").length;
  const pad = dayOfWeek("2026-04-24");

  return (
    <div className="space-y-5 animate-fade-in">
      <p className="text-sm text-slate-400 text-center">
        Clica: <span className="text-slate-300">vazio</span> →{" "}
        <span className="text-amber-400">🟡 talvez</span> →{" "}
        <span className="text-emerald-400">✅ certo</span> →{" "}
        <span className="text-slate-300">vazio</span>
      </p>
      <div className="grid grid-cols-7 gap-1.5">
        {DAYS_PT.map((d) => (
          <div key={d} className="text-center text-xs text-slate-500 font-medium py-1">{d}</div>
        ))}
        {Array(pad).fill(null).map((_, i) => (<div key={`p${i}`} />))}
        {CAL_DATES.map((date) => {
          const st = cal[date];
          const bg =
            st === "available"
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
              : st === "tentative"
              ? "bg-amber-500/90 text-white shadow-lg shadow-amber-500/20"
              : "bg-slate-800/80 text-slate-300 hover:bg-slate-700";
          return (
            <button key={date} onClick={() => toggle(date)} className={`py-2.5 px-1 rounded-xl text-center transition-all duration-150 active:scale-90 ${bg}`}>
              <div className="text-[10px] opacity-60 leading-none mb-0.5">{monthLabel(date)}</div>
              <div className="text-sm font-bold">{dayNum(date)}</div>
            </button>
          );
        })}
      </div>
      <div className="flex gap-6 justify-center text-sm">
        <span className="text-emerald-400">✅ {avail} certos</span>
        <span className="text-amber-400">🟡 {tent} talvez</span>
      </div>
      <Btn onClick={() => onSave({ calendar: cal })}>Guardar & Continuar →</Btn>
    </div>
  );
}

function StepQuiz({ user, data, onSave }: any) {
  const [qi, setQi] = useState(0);
  const [ans, setAns] = useState<Record<string, string>>(data.quizAnswers || {});
  const q = QUIZ[qi];
  const tot = QUIZ.length;
  const sel = ans[q.id];
  const allDone = Object.keys(ans).length === tot;

  function pick(oid: string) {
    setAns((p) => ({ ...p, [q.id]: oid }));
    if (qi < tot - 1) setTimeout(() => setQi(qi + 1), 250);
  }

  function finish() {
    const attrs: Record<string, number> = {};
    Object.entries(ans).forEach(([qid, oid]) => {
      const question = QUIZ.find((x) => x.id === qid);
      const opt = question?.opts.find((o) => o.id === oid);
      if (opt?.a) Object.entries(opt.a).forEach(([k, v]) => { attrs[k] = (attrs[k] || 0) + (v as number); });
    });
    onSave({ quizAnswers: ans, quizAttrs: attrs });
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex gap-1 justify-center flex-wrap">
        {QUIZ.map((_, i) => (
          <button
            key={i}
            onClick={() => setQi(i)}
            className={`h-2 rounded-full transition-all duration-200 ${
              i === qi ? "w-7 bg-orange-500" : ans[QUIZ[i].id] ? "w-2 bg-emerald-500" : "w-2 bg-slate-700"
            }`}
          />
        ))}
      </div>
      <div className="text-center pt-2">
        <span className="text-6xl block mb-3">{q.emoji}</span>
        <h3 className="text-xl font-bold">{q.q}</h3>
        <p className="text-sm text-slate-500 mt-1">{qi + 1} de {tot}</p>
      </div>
      <div className="space-y-2.5">
        {q.opts.map((o) => (
          <button
            key={o.id}
            onClick={() => pick(o.id)}
            className={`w-full p-4 rounded-xl text-left transition-all duration-150 active:scale-95 ${
              sel === o.id
                ? "bg-orange-500/25 ring-2 ring-orange-500 text-white"
                : "bg-slate-800/80 text-slate-200 hover:bg-slate-700/80"
            }`}
          >
            {o.t}
          </button>
        ))}
      </div>
      <div className="flex justify-between pt-2">
        <button
          onClick={() => qi > 0 && setQi(qi - 1)}
          className={`px-4 py-2 rounded-lg text-sm ${qi > 0 ? "bg-slate-700 text-slate-300" : "opacity-0 pointer-events-none"}`}
        >
          ← Anterior
        </button>
        {qi < tot - 1 ? (
          <button onClick={() => setQi(qi + 1)} className="px-4 py-2 rounded-lg text-sm bg-slate-700 text-slate-300">
            Seguinte →
          </button>
        ) : allDone ? (
          <button onClick={finish} className="px-8 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold">
            Continuar →
          </button>
        ) : (
          <span className="text-xs text-slate-500 self-center">Responde a todas</span>
        )}
      </div>
    </div>
  );
}

function StepPriorities({ user, data, onSave }: any) {
  const [sel, setSel] = useState<string[]>(data.priorities || []);

  function toggle(id: string) {
    setSel((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length >= 5 ? p : [...p, id]));
  }

  function moveUp(i: number) {
    if (i === 0) return;
    setSel((p) => {
      const n = [...p];
      [n[i - 1], n[i]] = [n[i], n[i - 1]];
      return n;
    });
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <p className="text-slate-400 text-sm">
        Escolhe os <span className="text-orange-400 font-bold">Top 5</span> fatores mais importantes (por ordem).
      </p>
      {sel.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/30 rounded-2xl p-3 space-y-2">
          <p className="text-xs text-slate-500 mb-1">As tuas prioridades:</p>
          {sel.map((fid, idx) => {
            const f = FACTORS.find((x) => x.id === fid);
            return (
              <div key={fid} className="flex items-center gap-2 bg-slate-700/60 rounded-xl p-2.5">
                <span className="text-orange-400 font-bold text-sm w-6">#{idx + 1}</span>
                <span className="flex-1 text-sm">{f?.name}</span>
                {idx > 0 && (
                  <button onClick={() => moveUp(idx)} className="text-xs bg-slate-600 px-2 py-1 rounded-lg hover:bg-slate-500">↑</button>
                )}
                <button onClick={() => toggle(fid)} className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-lg hover:bg-red-500/30">✕</button>
              </div>
            );
          })}
        </div>
      )}
      <div className="space-y-2">
        {FACTORS.filter((f) => !sel.includes(f.id)).map((f) => (
          <button
            key={f.id}
            onClick={() => toggle(f.id)}
            disabled={sel.length >= 5}
            className={`w-full p-3.5 rounded-xl text-left text-sm transition-all bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/30 ${
              sel.length >= 5 ? "opacity-40" : ""
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>
      <Btn onClick={() => onSave({ priorities: sel })} disabled={sel.length < 3}>
        Guardar & Continuar →
      </Btn>
    </div>
  );
}

function StepBattles({ user, data, onSave }: any) {
  const [pairs] = useState(() => {
    const s = [...DESTINATIONS].sort(() => Math.random() - 0.5);
    const p: any[][] = [];
    for (let i = 0; i < s.length - 1; i += 2) p.push([s[i], s[i + 1]]);
    return p.slice(0, 12);
  });
  const [round, setRound] = useState(0);
  const [elo, setElo] = useState<Record<string, number>>(() => {
    const e: Record<string, number> = {};
    DESTINATIONS.forEach((d) => (e[d.id] = data.elo?.[d.id] || 1500));
    return e;
  });
  const [done, setDone] = useState(false);

  function choose(wid: string, lid: string) {
    setElo((p) => {
      const wE = p[wid] || 1500;
      const lE = p[lid] || 1500;
      const ex = 1 / (1 + 10 ** ((lE - wE) / 400));
      return {
        ...p,
        [wid]: Math.round(wE + 32 * (1 - ex)),
        [lid]: Math.round(lE + 32 * (0 - (1 - ex))),
      };
    });
    if (round < pairs.length - 1) setRound(round + 1);
    else setDone(true);
  }

  if (done) {
    const ranked = DESTINATIONS.map((d) => ({ ...d, e: elo[d.id] || 1500 }))
      .sort((a, b) => b.e - a.e)
      .slice(0, 10);
    return (
      <div className="space-y-4 animate-fade-in">
        <h3 className="text-2xl font-bold text-center">🏆 O teu ranking!</h3>
        {ranked.map((d, i) => (
          <div
            key={d.id}
            className={`flex items-center gap-3 rounded-2xl p-3.5 ${
              i === 0
                ? "bg-orange-500/20 ring-1 ring-orange-500/40"
                : i < 3
                ? "bg-slate-800/80"
                : "bg-slate-800/40"
            }`}
          >
            <span className="text-lg font-extrabold text-orange-400 w-8">#{i + 1}</span>
            <span className="text-2xl">{d.flag}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold truncate">{d.name}</p>
              <p className="text-xs text-slate-400">{d.country}</p>
            </div>
            <span className="text-sm text-slate-400 font-mono">{d.e}</span>
          </div>
        ))}
        <Btn onClick={() => onSave({ elo })}>Concluir! 🎉</Btn>
      </div>
    );
  }

  const [a, b] = pairs[round];

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center">
        <p className="text-sm text-slate-400">Ronda {round + 1} de {pairs.length}</p>
        <h3 className="text-xl font-bold mt-1">Onde preferes ir? ⚔️</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[a, b].map((d: any) => (
          <button
            key={d.id}
            onClick={() => choose(d.id, d === a ? b.id : a.id)}
            className="bg-slate-800/80 border border-slate-700/30 rounded-2xl p-4 text-center hover:bg-slate-700/60 transition-all duration-150 hover:ring-2 hover:ring-orange-500/40 hover:scale-[1.03] active:scale-95"
          >
            <span className="text-5xl block mb-2">{d.flag}</span>
            <p className="font-bold text-sm">{d.name}</p>
            <p className="text-xs text-slate-400 mt-0.5">{d.country}</p>
            <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{d.desc}</p>
            <div className="mt-3 flex justify-center gap-2 text-xs text-slate-400">
              <span>🌡️{d.temp}°</span>
              <span>{"€".repeat(Math.min(Math.max(Math.ceil(d.cost[1] / 35), 1), 4))}</span>
            </div>
          </button>
        ))}
      </div>
      <div className="flex gap-1">
        {pairs.map((_: any, i: number) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-all ${
              i < round ? "bg-emerald-500" : i === round ? "bg-orange-500" : "bg-slate-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// WIZARD
// ═══════════════════════════════════════════════════════════

function Wizard({ userId, allData, onSave, onBack }: any) {
  const [step, setStep] = useState(() => {
    const d = allData[userId]?.completedSteps || [];
    const first = d.indexOf(false);
    if (first >= 0) return first;
    return d.length < 6 ? d.length : 0;
  });
  const [saving, setSaving] = useState(false);
  const userData = allData[userId] || {};
  const user = USERS.find((u) => u.id === userId);

  const STEPS = [
    { title: "Quem és tu?", icon: "👤", comp: StepProfile },
    { title: "Vais ou não?", icon: "🎲", comp: StepProbability },
    { title: "Quando podes?", icon: "📅", comp: StepCalendar },
    { title: "O que preferes?", icon: "🎮", comp: StepQuiz },
    { title: "Prioridades", icon: "⭐", comp: StepPriorities },
    { title: "Batalha de Cidades", icon: "⚔️", comp: StepBattles },
  ];

  async function handleSave(data: any) {
    setSaving(true);
    const cs = [...(userData.completedSteps || [false, false, false, false, false, false])];
    cs[step] = true;
    await onSave(userId, { ...data, completedSteps: cs });
    setSaving(false);
    if (step < 5) setStep(step + 1);
    else onBack();
  }

  const Comp = STEPS[step].comp;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="text-slate-400 hover:text-white transition-colors text-sm">← Sair</button>
          <div className="flex-1 text-center">
            <span className="text-sm text-slate-400">{step + 1}/6</span>
            <h2 className="text-lg font-bold">{STEPS[step].icon} {STEPS[step].title}</h2>
          </div>
          <div className="w-12" />
        </div>
        <div className="flex gap-1 mb-8">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                i === step ? "bg-orange-500" : (userData.completedSteps || [])[i] ? "bg-emerald-500" : "bg-slate-700"
              }`}
            />
          ))}
        </div>
        {saving && (
          <div className="text-center py-2 text-sm text-orange-400 animate-pulse mb-4">💾 A guardar...</div>
        )}
        <Comp user={user} data={userData} onSave={handleSave} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════

function Dashboard({ allData, onBack }: any) {
  const [tab, setTab] = useState("who");
  const [nights, setNights] = useState(4);

  const uData = USERS.map((u) => ({ ...u, d: allData[u.id] || {} }));

  const destScores = useMemo(() => {
    const withData = uData.filter((u) => u.d.quizAttrs && u.d.priorities);
    return DESTINATIONS.map((dest) => {
      const scores = withData.map((u) => calcScore(u.d, dest));
      const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      return { ...dest, gs: avg, scores };
    }).sort((a, b) => b.gs - a.gs);
  }, [allData]);

  const dateSc = useMemo(() => {
    return CAL_DATES.map((date) => {
      let av = 0, te = 0;
      Object.values(allData).forEach((u: any) => {
        if (u?.calendar?.[date] === "available") av++;
        else if (u?.calendar?.[date] === "tentative") te++;
      });
      return { date, av, te, sc: av * 2 + te };
    });
  }, [allData]);

  const bw = useMemo(() => bestWindows(allData, nights), [allData, nights]);

  const tabs = [
    { id: "who", l: "👥 Quem" },
    { id: "when", l: "📅 Quando" },
    { id: "where", l: "📍 Onde" },
    { id: "money", l: "💰 Quanto" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={onBack} className="text-slate-400 hover:text-white text-sm">← Voltar</button>
          <h1 className="flex-1 text-center text-2xl font-extrabold">📊 Dashboard</h1>
          <div className="w-12" />
        </div>

        <div className="flex gap-1 bg-slate-800/60 rounded-2xl p-1 mb-6 border border-slate-700/30">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                tab === t.id ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>

        {/* WHO TAB */}
        {tab === "who" && (
          <div className="space-y-3 animate-fade-in">
            {uData.map((u) => {
              const p = u.d.probability;
              const b = p != null ? getBadge(p) : null;
              return (
                <div key={u.id} className="bg-slate-800/60 border border-slate-700/30 rounded-2xl p-4 flex items-center gap-3">
                  <span className="text-4xl">{u.d.avatar || "❓"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{u.d.nickname || u.name}</p>
                    {p != null ? (
                      <>
                        <p className={`text-sm ${b!.cl}`}>{b!.text}</p>
                        <div className="flex gap-3 mt-1 text-xs text-slate-400">
                          <span>🎯{u.d.intention}</span>
                          <span>📊{u.d.possibility}</span>
                          <span>🎲{p}</span>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-slate-500">⏳ Pendente...</p>
                    )}
                  </div>
                  {p != null && <div className="text-3xl font-extrabold text-orange-400">{p}</div>}
                </div>
              );
            })}
            {(() => {
              const ps = uData.filter((u) => u.d.probability != null).map((u) => u.d.probability);
              if (!ps.length) return null;
              const avg = (ps.reduce((a: number, b: number) => a + b, 0) / ps.length).toFixed(1);
              const likely = ps.filter((p: number) => p >= 6).length;
              return (
                <div className="bg-slate-800/40 border border-slate-700/20 rounded-2xl p-5 mt-2">
                  <h3 className="font-bold mb-3 text-center">📈 Resumo do Grupo</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div><p className="text-3xl font-extrabold text-orange-400">{avg}</p><p className="text-xs text-slate-400 mt-1">Média</p></div>
                    <div><p className="text-3xl font-extrabold text-emerald-400">{likely}</p><p className="text-xs text-slate-400 mt-1">Prováveis</p></div>
                    <div><p className="text-3xl font-extrabold text-slate-400">{ps.length}/8</p><p className="text-xs text-slate-400 mt-1">Responderam</p></div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* WHEN TAB */}
        {tab === "when" && (
          <div className="space-y-5 animate-fade-in">
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS_PT.map((d) => (
                <div key={d} className="text-center text-xs text-slate-500 font-medium py-1">{d}</div>
              ))}
              {Array(dayOfWeek("2026-04-24")).fill(null).map((_, i) => (<div key={`p${i}`} />))}
              {dateSc.map(({ date, av, te, sc }) => {
                const mx = uData.length * 2;
                const int = mx > 0 ? sc / mx : 0;
                const bg =
                  int > 0.6 ? "bg-emerald-500 text-white"
                  : int > 0.3 ? "bg-emerald-700/80 text-emerald-100"
                  : int > 0.05 ? "bg-emerald-900/60 text-emerald-200"
                  : "bg-slate-800/80 text-slate-400";
                return (
                  <div key={date} className={`py-2 px-0.5 rounded-xl text-center ${bg} transition-all`}>
                    <div className="text-[10px] opacity-60 leading-none mb-0.5">{monthLabel(date)}</div>
                    <div className="text-sm font-bold">{dayNum(date)}</div>
                    <div className="text-[9px] mt-0.5 leading-none">
                      {av > 0 && <span className="text-emerald-200">{av}✓</span>}
                      {te > 0 && <span className="text-amber-300 ml-0.5">{te}?</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4 justify-center text-xs text-slate-400">
              <span>✓ disponível</span><span>? talvez</span><span>Cor = overlap</span>
            </div>
            <div>
              <h3 className="font-bold mb-3">🏆 Melhores janelas</h3>
              <div className="flex gap-2 mb-3">
                {[3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setNights(n)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      nights === n ? "bg-orange-500 text-white" : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {n} noites
                  </button>
                ))}
              </div>
              {bw.map((w, i) => (
                <div key={i} className={`p-4 rounded-2xl mb-2 ${i === 0 ? "bg-orange-500/15 ring-1 ring-orange-500/40" : "bg-slate-800/60"}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{i === 0 && "⭐ "}{dayNum(w.start)} {monthLabel(w.start)} — {dayNum(w.end)} {monthLabel(w.end)}</span>
                    <span className="text-orange-400 font-bold">Score: {w.score}</span>
                  </div>
                </div>
              ))}
              {bw.length === 0 && <p className="text-slate-500 text-sm text-center">Ninguém preencheu o calendário ainda.</p>}
            </div>
          </div>
        )}

        {/* WHERE TAB */}
        {tab === "where" && (
          <div className="space-y-3 animate-fade-in">
            {destScores[0]?.gs > 0 ? (
              <>
                <p className="text-sm text-slate-400 text-center mb-2">Top destinos baseado nas preferências do grupo</p>
                {destScores.slice(0, 10).map((dest, i) => {
                  const mx = destScores[0]?.gs || 1;
                  const pct = mx > 0 ? (dest.gs / mx) * 100 : 0;
                  const topA = Object.entries(dest.attrs)
                    .sort(([, a], [, b]) => (b as number) - (a as number))
                    .slice(0, 3)
                    .map(([k]) => FACTORS.find((f) => f.key === k)?.name || k)
                    .join(" · ");
                  return (
                    <div key={dest.id} className={`bg-slate-800/60 border border-slate-700/30 rounded-2xl p-4 ${i === 0 ? "ring-2 ring-orange-500/30" : ""}`}>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-extrabold text-orange-400 w-8">#{i + 1}</span>
                        <span className="text-2xl">{dest.flag}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{dest.name}</p>
                          <p className="text-xs text-slate-400">{dest.country} · {dest.cat}</p>
                        </div>
                        <span className="text-lg font-bold text-orange-400">{dest.gs.toFixed(1)}</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full mb-2">
                        <div className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-slate-400">{topA}</p>
                      <p className="text-xs text-slate-500 mt-1">🌡️ {dest.temp}°C · {dest.desc}</p>
                    </div>
                  );
                })}
              </>
            ) : (
              <p className="text-slate-500 text-center py-8">Ainda ninguém completou o quiz e prioridades.</p>
            )}
          </div>
        )}

        {/* MONEY TAB */}
        {tab === "money" && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex gap-2 justify-center">
              {[3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setNights(n)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    nights === n ? "bg-orange-500 text-white" : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {n} noites
                </button>
              ))}
            </div>
            {destScores.slice(0, 3).map((dest, di) => {
              const withCity = uData.filter((u) => u.d.originCity);
              return (
                <div key={dest.id} className="bg-slate-800/60 border border-slate-700/30 rounded-2xl p-4">
                  <h3 className="font-bold mb-3">{dest.flag} {dest.name} <span className="text-slate-400 font-normal text-sm">— #{di + 1}</span></h3>
                  <div className="space-y-2">
                    {withCity.map((u) => {
                      const orig = ORIGINS.find((o) => o.id === u.d.originCity);
                      if (!orig) return null;
                      const dist = haversine(orig.lat, orig.lon, dest.lat, dest.lon);
                      const fl = Math.round(flightCost(dist));
                      const ht = Math.round(dest.cost[1] * nights);
                      const fd = Math.round(dest.food * (nights + 1));
                      const ex = Math.round((fl + ht + fd) * 0.15);
                      const tot = fl + ht + fd + ex;
                      return (
                        <div key={u.id} className="flex items-center gap-2 bg-slate-700/40 rounded-xl p-2.5">
                          <span className="text-lg">{u.d.avatar || "❓"}</span>
                          <span className="flex-1 text-sm truncate">{u.d.nickname || u.name.split(" ")[0]}</span>
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400 space-x-1">
                              <span>✈{fl}€</span><span>🏨{ht}€</span><span>🍽{fd}€</span>
                            </div>
                            <p className="text-orange-400 font-bold">{tot}€</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {(() => {
                    const tots = withCity.map((u) => {
                      const orig = ORIGINS.find((o) => o.id === u.d.originCity);
                      if (!orig) return 0;
                      const dist = haversine(orig.lat, orig.lon, dest.lat, dest.lon);
                      const fl = flightCost(dist);
                      return fl + dest.cost[1] * nights + dest.food * (nights + 1) + (fl + dest.cost[1] * nights + dest.food * (nights + 1)) * 0.15;
                    });
                    if (!tots.length) return null;
                    const avg = tots.reduce((a, b) => a + b, 0) / tots.length;
                    const mn = Math.min(...tots);
                    const mx = Math.max(...tots);
                    return (
                      <div className="mt-3 pt-3 border-t border-slate-700/50 grid grid-cols-3 text-center text-sm">
                        <div><p className="text-emerald-400 font-bold">€{Math.round(mn)}</p><p className="text-[10px] text-slate-500">Min/pessoa</p></div>
                        <div><p className="text-orange-400 font-bold">€{Math.round(avg)}</p><p className="text-[10px] text-slate-500">Média</p></div>
                        <div><p className="text-red-400 font-bold">€{Math.round(mx)}</p><p className="text-[10px] text-slate-500">Max/pessoa</p></div>
                      </div>
                    );
                  })()}
                </div>
              );
            })}
            {destScores[0]?.gs <= 0 && (
              <p className="text-slate-500 text-center">Completa o quiz para ver estimativas de orçamento.</p>
            )}
            <p className="text-xs text-slate-500 text-center">💡 Estimativas: voo por distância, hotel médio, comida local + 15% extras</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN APP (with Supabase + Realtime + PIN Auth)
// ═══════════════════════════════════════════════════════════

export default function FugaApp() {
  const [view, setView] = useState<"home" | "wizard" | "dashboard" | "pin">("home");
  const [userId, setUserId] = useState<string | null>(null);
  const [allData, setAllData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [pinHasExisting, setPinHasExisting] = useState(false);

  // Show toast notification
  const showToast = useCallback((msg: string, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Load data from Supabase on mount
  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await loadAllData();
        if (mounted) {
          setAllData(data);
          setLoading(false);
        }
      } catch (e) {
        console.error("Failed to load:", e);
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  // Subscribe to realtime changes
  useEffect(() => {
    const channel = subscribeToChanges((payload: any) => {
      const row = payload.new;
      if (row?.user_id) {
        setAllData((prev) => ({
          ...prev,
          [row.user_id]: {
            ...(row.data || {}),
            _pin: row.pin || null,
          },
        }));
      }
    });

    return () => { unsubscribe(channel); };
  }, []);

  // Handle user selection (show PIN modal)
  function handleSelectUser(uid: string) {
    const userData = allData[uid] || {};
    const existingPin = userData._pin;
    setPendingUserId(uid);
    setPinHasExisting(!!existingPin);
    setView("pin");
  }

  // Handle PIN submission
  async function handlePinSubmit(pin: string, isNew: boolean) {
    if (!pendingUserId) return;

    if (!isNew) {
      // Verify existing PIN
      const userData = allData[pendingUserId] || {};
      if (userData._pin !== pin) {
        showToast("PIN incorreto! Tenta novamente.", "error");
        return;
      }
    } else {
      // Save new PIN
      const userData = allData[pendingUserId] || {};
      await saveUserData(pendingUserId, userData, pin);
      setAllData((prev) => ({
        ...prev,
        [pendingUserId!]: { ...(prev[pendingUserId!] || {}), _pin: pin },
      }));
    }

    setUserId(pendingUserId);
    setPendingUserId(null);
    setView("wizard");
    showToast(`Bem-vindo, ${USERS.find((u) => u.id === pendingUserId)?.name?.split(" ")[0]}! 🎉`);
  }

  // Save user data to Supabase
  async function handleSave(uid: string, data: any) {
    const merged = { ...(allData[uid] || {}), ...data };
    // Keep _pin in local state but don't send to data column
    setAllData((prev) => ({ ...prev, [uid]: merged }));

    const success = await saveUserData(uid, merged);
    if (success) {
      showToast("Guardado! 💾");
    } else {
      showToast("Erro ao guardar. Tenta novamente.", "error");
    }
  }

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-bounce mb-4">✈️</div>
          <p className="text-slate-400 text-lg">A carregar Fuga, SA...</p>
          <div className="mt-4 w-32 h-1 bg-slate-800 rounded-full mx-auto overflow-hidden">
            <div className="h-full w-1/2 bg-orange-500 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {view === "pin" && pendingUserId && (
        <PinModal
          user={{
            ...(USERS.find((u) => u.id === pendingUserId) || {}),
            avatar: allData[pendingUserId]?.avatar,
          }}
          hasExistingPin={pinHasExisting}
          onSuccess={handlePinSubmit}
          onCancel={() => { setPendingUserId(null); setView("home"); }}
        />
      )}

      {view === "dashboard" && (
        <Dashboard allData={allData} onBack={() => setView("home")} />
      )}

      {view === "wizard" && userId && (
        <Wizard
          userId={userId}
          allData={allData}
          onSave={handleSave}
          onBack={() => setView("home")}
        />
      )}

      {(view === "home" || view === "pin") && (
        <HomeScreen
          allData={allData}
          onSelect={handleSelectUser}
          onDash={() => setView("dashboard")}
        />
      )}
    </>
  );
}
