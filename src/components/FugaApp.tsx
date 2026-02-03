"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  loadGroup, loadMembers, loadMemberData, saveMemberData,
  loadOrigins, loadDestinationsForGroup, loadQuizForGroup, loadFactorsForGroup,
  subscribeToMemberData, unsubscribe,
} from "@/lib/supabase";
import {
  haversine, flightCost, getBadge, generateCalDates,
  dayOfWeek, dayNum, monthLabel, calcScore, bestWindows,
} from "@/lib/helpers";
import type { Group, Member, Origin, Destination, QuizQuestion, Factor, AppData } from "@/lib/types";
import DestinationFilters, { FilterState, DEFAULT_FILTERS, applyFilters } from "./DestinationFilters";
import CompareDestinations from "./CompareDestinations";
import CostBenefitPanel from "./CostBenefitPanel";
import BookingLinks from "./BookingLinks";

const AVATARS = ["🎯","🔥","⚡","🎸","🏄","🎮","🍺","🦈","🐉","🎪","🚀","🌊","🎭","🏆","🎲","🌴","🦁","🐺","🎵","🍕"];
const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// ═══════════════════════════════════════════════
// UI HELPERS
// ═══════════════════════════════════════════════

function Btn({ children, onClick, disabled, variant = "primary", className = "" }: any) {
  const base = "w-full py-3.5 rounded-2xl font-bold text-base transition-all duration-200 active:scale-95 disabled:opacity-40 ";
  const s: any = { primary: "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/25", secondary: "bg-slate-700 text-slate-200 hover:bg-slate-600" };
  return <button onClick={onClick} disabled={disabled} className={base + (s[variant] || s.primary) + " " + className}>{children}</button>;
}

function Toast({ message, type = "success" }: any) {
  const bg = type === "error" ? "bg-red-500/90" : "bg-emerald-500/90";
  return <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 ${bg} text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-fade-in`}>{message}</div>;
}

function DestImg({ dest, className = "" }: { dest: Destination; className?: string }) {
  const [err, setErr] = useState(false);
  if (!dest.image_url || err) {
    return <div className={`bg-slate-700/50 flex items-center justify-center text-4xl ${className}`}>{dest.flag}</div>;
  }
  return <img src={dest.image_url} alt={dest.name} onError={() => setErr(true)} className={`object-cover ${className}`} loading="lazy" />;
}

// ═══════════════════════════════════════════════
// PIN MODAL
// ═══════════════════════════════════════════════

function PinModal({ member, hasExistingPin, onSuccess, onCancel }: any) {
  const [pin, setPin] = useState(""); const [confirmPin, setConfirmPin] = useState(""); const [error, setError] = useState("");
  const [step, setStep] = useState<"enter"|"create"|"confirm">(hasExistingPin ? "enter" : "create");

  function submit() {
    if (step === "create") {
      if (pin.length !== 4 || !/^\d{4}$/.test(pin)) { setError("PIN: 4 dígitos"); return; }
      setStep("confirm"); setConfirmPin(""); setError(""); return;
    }
    if (step === "confirm") {
      if (confirmPin !== pin) { setError("PINs não coincidem!"); setConfirmPin(""); return; }
      onSuccess(pin, true); return;
    }
    if (pin.length !== 4) { setError("Introduz 4 dígitos"); return; }
    onSuccess(pin, false);
  }

  const title = step === "create" ? "Cria o teu PIN 🔐" : step === "confirm" ? "Confirma o PIN" : "O teu PIN 🔐";
  const v = step === "confirm" ? confirmPin : pin;
  const sv = step === "confirm" ? setConfirmPin : setPin;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700/50 rounded-3xl p-6 w-full max-w-sm animate-fade-in">
        <div className="text-center mb-6">
          <span className="text-5xl block mb-3">{member?.avatar || "🔐"}</span>
          <h3 className="text-xl font-bold">{title}</h3>
        </div>
        <div className="flex justify-center gap-3 mb-4">
          {[0,1,2,3].map((i) => (
            <div key={i} className={`w-12 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold transition-all ${v[i] ? "border-orange-500 bg-orange-500/10 text-orange-400" : "border-slate-600 bg-slate-700/50"}`}>
              {v[i] ? "•" : ""}
            </div>
          ))}
        </div>
        <input type="tel" maxLength={4} value={v} onChange={(e) => { sv(e.target.value.replace(/\D/g, "").slice(0, 4)); setError(""); }}
          onKeyDown={(e) => e.key === "Enter" && submit()} className="w-full bg-slate-700/50 border border-slate-600 rounded-xl p-3 text-center text-xl tracking-[1em] text-white outline-none focus:ring-2 focus:ring-orange-500/50 mb-2"
          autoFocus inputMode="numeric" />
        {error && <p className="text-red-400 text-sm text-center mb-3">{error}</p>}
        <div className="flex gap-2 mt-4">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-slate-700 text-slate-300 font-medium">Cancelar</button>
          <button onClick={submit} disabled={v.length < 4} className="flex-1 py-3 rounded-xl bg-orange-500 text-white font-bold disabled:opacity-40">
            {step === "confirm" ? "Criar" : "Entrar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// HOME SCREEN
// ═══════════════════════════════════════════════

function HomeScreen({ group, members, allData, onSelect, onDash }: { group: Group; members: Member[]; allData: Record<string, any>; onSelect: (id: string) => void; onDash: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-10 pt-4">
          <div className="text-7xl mb-4 animate-bounce" style={{ animationDuration: "2s" }}>✈️</div>
          <h1 className="text-5xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500 bg-clip-text text-transparent">{group.name}</span>
          </h1>
          {group.description && <p className="text-slate-400 mt-3 text-lg">{group.description}</p>}
        </div>
        <button onClick={onDash} className="w-full mb-8 py-4 rounded-2xl bg-slate-800/80 border border-slate-700/50 text-slate-200 hover:bg-slate-700/80 transition-all flex items-center justify-center gap-3 text-lg font-semibold">
          📊 Dashboard do Grupo
        </button>
        <h2 className="text-xl font-bold mb-4 text-slate-300">Quem és tu?</h2>
        <div className="grid grid-cols-2 gap-3">
          {members.map((m) => {
            const d = allData[m.id] || {};
            const done = (d.completedSteps || []).filter(Boolean).length;
            return (
              <button key={m.id} onClick={() => onSelect(m.id)} className="bg-slate-800/60 backdrop-blur rounded-2xl p-5 text-center hover:bg-slate-700/60 transition-all duration-200 hover:ring-2 hover:ring-orange-500/40 hover:scale-[1.03] active:scale-95 border border-slate-700/30">
                <span className="text-5xl block mb-2">{d.avatar || "❓"}</span>
                <p className="font-semibold text-sm truncate">{d.nickname || m.name}</p>
                <div className="flex gap-0.5 mt-3 justify-center">
                  {[0,1,2,3,4,5].map((i) => (<div key={i} className={`w-4 h-1.5 rounded-full ${(d.completedSteps||[])[i] ? "bg-emerald-500" : "bg-slate-700"}`} />))}
                </div>
                <p className="text-xs text-slate-500 mt-1.5">{done === 6 ? "✅ Completo" : `${done}/6 etapas`}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// WIZARD STEPS
// ═══════════════════════════════════════════════

function StepProfile({ member, data, origins, onSave }: { member: Member; data: any; origins: Origin[]; onSave: (d: any) => void }) {
  const [avatar, setAvatar] = useState(data.avatar || "🎯");
  const [nick, setNick] = useState(data.nickname || member.name.split(" ")[0]);
  const [city, setCity] = useState(data.originCity || "");
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-sm font-medium text-slate-400 mb-3">Escolhe o teu avatar</p>
        <div className="grid grid-cols-5 gap-2">
          {AVATARS.map((a) => (<button key={a} onClick={() => setAvatar(a)} className={`text-3xl p-2.5 rounded-xl transition-all ${avatar === a ? "bg-orange-500/30 ring-2 ring-orange-500 scale-110" : "bg-slate-800/80 hover:bg-slate-700"}`}>{a}</button>))}
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-400 mb-2">Alcunha</p>
        <input value={nick} onChange={(e) => setNick(e.target.value)} className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl p-3.5 text-white outline-none focus:ring-2 focus:ring-orange-500/50" />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-400 mb-2">Cidade de partida ✈️</p>
        <select value={city} onChange={(e) => setCity(e.target.value)} className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl p-3.5 text-white outline-none focus:ring-2 focus:ring-orange-500/50">
          <option value="">Seleciona...</option>
          {origins.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
      </div>
      <Btn onClick={() => onSave({ avatar, nickname: nick, originCity: city })} disabled={!city || !nick}>Guardar & Continuar →</Btn>
    </div>
  );
}

function StepProbability({ data, onSave }: any) {
  const [intention, setIntention] = useState(data.intention ?? 5);
  const [possibility, setPossibility] = useState(data.possibility ?? 5);
  const [final_, setFinal] = useState(data.probability ?? 5);
  const sug = Math.round(0.55 * possibility + 0.45 * intention);
  const badge = getBadge(final_);
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center text-7xl mb-2">{data.avatar || "🎯"}</div>
      {[{ label: "🎯 Intenção de ir", val: intention, set: setIntention }, { label: "📊 Possibilidade real", val: possibility, set: setPossibility }].map(({ label, val, set }) => (
        <div key={label}><div className="flex justify-between mb-1"><span className="text-sm text-slate-300">{label}</span><span className="text-orange-400 font-bold text-lg">{val}</span></div>
        <input type="range" min="0" max="10" value={val} onChange={(e) => set(+e.target.value)} className="w-full" /></div>
      ))}
      <div className="bg-slate-800/80 border border-slate-700/30 rounded-2xl p-4">
        <p className="text-sm text-slate-400 mb-1">Sugestão: <span className="text-white font-bold">{sug}/10</span></p>
        <div className="flex justify-between mb-1"><span className="text-sm text-slate-300">🎲 Probabilidade final</span><span className="text-orange-400 font-bold text-lg">{final_}</span></div>
        <input type="range" min="0" max="10" value={final_} onChange={(e) => setFinal(+e.target.value)} className="w-full" />
        {final_ !== sug && <button onClick={() => setFinal(sug)} className="mt-2 text-sm text-orange-400 underline">Usar sugestão ({sug})</button>}
      </div>
      <div className="text-center py-3"><span className={`text-2xl font-bold ${badge.cl}`}>{badge.text}</span></div>
      <Btn onClick={() => onSave({ intention, possibility, probability: final_ })}>Guardar & Continuar →</Btn>
    </div>
  );
}

function StepCalendar({ data, calDates, onSave }: { data: any; calDates: string[]; onSave: (d: any) => void }) {
  const [cal, setCal] = useState<Record<string, string>>(data.calendar || {});
  function toggle(d: string) { setCal((p) => { const c = p[d]; const nxt = !c ? "tentative" : c === "tentative" ? "available" : undefined; const u = { ...p }; if (nxt) u[d] = nxt; else delete u[d]; return u; }); }
  const avail = Object.values(cal).filter((v) => v === "available").length;
  const tent = Object.values(cal).filter((v) => v === "tentative").length;
  const pad = calDates.length ? dayOfWeek(calDates[0]) : 0;
  return (
    <div className="space-y-5 animate-fade-in">
      <p className="text-sm text-slate-400 text-center">Clica: <span className="text-slate-300">vazio</span> → <span className="text-amber-400">🟡 talvez</span> → <span className="text-emerald-400">✅ certo</span> → <span className="text-slate-300">vazio</span></p>
      <div className="grid grid-cols-7 gap-1.5">
        {DAYS_PT.map((d) => (<div key={d} className="text-center text-xs text-slate-500 font-medium py-1">{d}</div>))}
        {Array(pad).fill(null).map((_, i) => (<div key={`p${i}`} />))}
        {calDates.map((date) => {
          const st = cal[date];
          const bg = st === "available" ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" : st === "tentative" ? "bg-amber-500/90 text-white shadow-lg shadow-amber-500/20" : "bg-slate-800/80 text-slate-300 hover:bg-slate-700";
          return (<button key={date} onClick={() => toggle(date)} className={`py-2.5 px-1 rounded-xl text-center transition-all active:scale-90 ${bg}`}><div className="text-[10px] opacity-60 leading-none mb-0.5">{monthLabel(date)}</div><div className="text-sm font-bold">{dayNum(date)}</div></button>);
        })}
      </div>
      <div className="flex gap-6 justify-center text-sm"><span className="text-emerald-400">✅ {avail} certos</span><span className="text-amber-400">🟡 {tent} talvez</span></div>
      <Btn onClick={() => onSave({ calendar: cal })}>Guardar & Continuar →</Btn>
    </div>
  );
}

function StepQuiz({ data, quiz, onSave }: { data: any; quiz: QuizQuestion[]; onSave: (d: any) => void }) {
  const [qi, setQi] = useState(0);
  const [ans, setAns] = useState<Record<string, string>>(data.quizAnswers || {});
  if (!quiz.length) return <p className="text-slate-500 text-center">Sem perguntas configuradas.</p>;
  const q = quiz[qi]; const tot = quiz.length; const sel = ans[q.id]; const allDone = Object.keys(ans).length === tot;
  function pick(oid: string) { setAns((p) => ({ ...p, [q.id]: oid })); if (qi < tot - 1) setTimeout(() => setQi(qi + 1), 250); }
  function finish() {
    const attrs: Record<string, number> = {};
    Object.entries(ans).forEach(([qid, oid]) => { const question = quiz.find((x) => x.id === qid); const opt = question?.options.find((o) => o.id === oid); if (opt?.attrs) Object.entries(opt.attrs).forEach(([k, v]) => { attrs[k] = (attrs[k] || 0) + (v as number); }); });
    onSave({ quizAnswers: ans, quizAttrs: attrs });
  }
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex gap-1 justify-center flex-wrap">
        {quiz.map((_, i) => (<button key={i} onClick={() => setQi(i)} className={`h-2 rounded-full transition-all ${i === qi ? "w-7 bg-orange-500" : ans[quiz[i].id] ? "w-2 bg-emerald-500" : "w-2 bg-slate-700"}`} />))}
      </div>
      <div className="text-center pt-2"><span className="text-6xl block mb-3">{q.emoji}</span><h3 className="text-xl font-bold">{q.question}</h3><p className="text-sm text-slate-500 mt-1">{qi+1} de {tot}</p></div>
      <div className="space-y-2.5">
        {q.options.map((o) => (<button key={o.id} onClick={() => pick(o.id)} className={`w-full p-4 rounded-xl text-left transition-all active:scale-95 ${sel === o.id ? "bg-orange-500/25 ring-2 ring-orange-500 text-white" : "bg-slate-800/80 text-slate-200 hover:bg-slate-700/80"}`}>{o.text}</button>))}
      </div>
      <div className="flex justify-between pt-2">
        <button onClick={() => qi > 0 && setQi(qi-1)} className={`px-4 py-2 rounded-lg text-sm ${qi > 0 ? "bg-slate-700 text-slate-300" : "opacity-0 pointer-events-none"}`}>← Anterior</button>
        {qi < tot - 1 ? <button onClick={() => setQi(qi+1)} className="px-4 py-2 rounded-lg text-sm bg-slate-700 text-slate-300">Seguinte →</button>
        : allDone ? <button onClick={finish} className="px-8 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold">Continuar →</button>
        : <span className="text-xs text-slate-500 self-center">Responde a todas</span>}
      </div>
    </div>
  );
}

function StepPriorities({ data, factors, onSave }: { data: any; factors: Factor[]; onSave: (d: any) => void }) {
  const [sel, setSel] = useState<string[]>(data.priorities || []);
  function toggle(id: string) { setSel((p) => p.includes(id) ? p.filter((x) => x !== id) : p.length >= 5 ? p : [...p, id]); }
  function moveUp(i: number) { if (i === 0) return; setSel((p) => { const n = [...p]; [n[i-1], n[i]] = [n[i], n[i-1]]; return n; }); }
  return (
    <div className="space-y-5 animate-fade-in">
      <p className="text-slate-400 text-sm">Escolhe os <span className="text-orange-400 font-bold">Top 5</span> fatores (por ordem).</p>
      {sel.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/30 rounded-2xl p-3 space-y-2">
          {sel.map((fid, idx) => { const f = factors.find((x) => x.id === fid); return (
            <div key={fid} className="flex items-center gap-2 bg-slate-700/60 rounded-xl p-2.5">
              <span className="text-orange-400 font-bold text-sm w-6">#{idx+1}</span><span className="flex-1 text-sm">{f?.emoji} {f?.name}</span>
              {idx > 0 && <button onClick={() => moveUp(idx)} className="text-xs bg-slate-600 px-2 py-1 rounded-lg">↑</button>}
              <button onClick={() => toggle(fid)} className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-lg">✕</button>
            </div>); })}
        </div>
      )}
      <div className="space-y-2">
        {factors.filter((f) => !sel.includes(f.id)).map((f) => (
          <button key={f.id} onClick={() => toggle(f.id)} disabled={sel.length >= 5} className={`w-full p-3.5 rounded-xl text-left text-sm bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/30 ${sel.length >= 5 ? "opacity-40" : ""}`}>{f.emoji} {f.name}</button>
        ))}
      </div>
      <Btn onClick={() => onSave({ priorities: sel })} disabled={sel.length < 3}>Guardar & Continuar →</Btn>
    </div>
  );
}

function StepBattles({ data, destinations, onSave }: { data: any; destinations: Destination[]; onSave: (d: any) => void }) {
  const [pairs] = useState(() => { const s = [...destinations].sort(() => Math.random() - 0.5); const p: Destination[][] = []; for (let i = 0; i < s.length - 1; i += 2) p.push([s[i], s[i + 1]]); return p.slice(0, 12); });
  const [round, setRound] = useState(0);
  const [elo, setElo] = useState<Record<string, number>>(() => { const e: Record<string, number> = {}; destinations.forEach((d) => (e[d.id] = data.elo?.[d.id] || 1500)); return e; });
  const [done, setDone] = useState(false);
  function choose(wid: string, lid: string) {
    setElo((p) => { const wE = p[wid] || 1500, lE = p[lid] || 1500; const ex = 1 / (1 + 10 ** ((lE - wE) / 400)); return { ...p, [wid]: Math.round(wE + 32 * (1 - ex)), [lid]: Math.round(lE + 32 * (0 - (1 - ex))) }; });
    if (round < pairs.length - 1) setRound(round + 1); else setDone(true);
  }
  if (done) {
    const ranked = destinations.map((d) => ({ ...d, e: elo[d.id] || 1500 })).sort((a, b) => b.e - a.e).slice(0, 10);
    return (
      <div className="space-y-3 animate-fade-in">
        <h3 className="text-2xl font-bold text-center">🏆 O teu ranking!</h3>
        {ranked.map((d, i) => (
          <div key={d.id} className={`flex items-center gap-3 rounded-2xl overflow-hidden ${i === 0 ? "bg-orange-500/20 ring-1 ring-orange-500/40" : "bg-slate-800/60"}`}>
            {d.image_url && <img src={d.image_url} alt="" className="w-16 h-16 object-cover" />}
            <span className="text-lg font-extrabold text-orange-400 w-8">#{i+1}</span>
            <div className="flex-1 min-w-0"><p className="font-semibold truncate">{d.flag} {d.name}</p><p className="text-xs text-slate-400">{d.country}</p></div>
            <span className="text-sm text-slate-400 font-mono pr-3">{d.e}</span>
          </div>
        ))}
        <Btn onClick={() => onSave({ elo })}>Concluir! 🎉</Btn>
      </div>
    );
  }
  if (!pairs.length) return <p className="text-slate-500 text-center">Sem destinos configurados.</p>;
  const [a, b] = pairs[round];
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="text-center"><p className="text-sm text-slate-400">Ronda {round+1} de {pairs.length}</p><h3 className="text-xl font-bold mt-1">Onde preferes ir? ⚔️</h3></div>
      <div className="grid grid-cols-2 gap-3">
        {[a, b].map((d) => (
          <button key={d.id} onClick={() => choose(d.id, d === a ? b.id : a.id)} className="bg-slate-800/80 border border-slate-700/30 rounded-2xl overflow-hidden text-center hover:bg-slate-700/60 transition-all hover:ring-2 hover:ring-orange-500/40 hover:scale-[1.03] active:scale-95">
            <DestImg dest={d} className="w-full h-28" />
            <div className="p-3">
              <p className="font-bold text-sm">{d.flag} {d.name}</p>
              <p className="text-xs text-slate-400">{d.country}</p>
              <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">{d.description}</p>
              <div className="mt-2 flex justify-center gap-2 text-xs text-slate-400"><span>🌡️{d.temp_may}°</span><span>{"€".repeat(Math.min(Math.max(Math.ceil(d.cost_med / 35), 1), 4))}</span></div>
            </div>
          </button>
        ))}
      </div>
      <div className="flex gap-1">{pairs.map((_, i) => (<div key={i} className={`h-1.5 flex-1 rounded-full ${i < round ? "bg-emerald-500" : i === round ? "bg-orange-500" : "bg-slate-700"}`} />))}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// WIZARD
// ═══════════════════════════════════════════════

function Wizard({ memberId, members, allData, appData, calDates, onSave, onBack }: { memberId: string; members: Member[]; allData: Record<string, any>; appData: AppData; calDates: string[]; onSave: (mid: string, d: any) => Promise<void>; onBack: () => void }) {
  const [step, setStep] = useState(() => { const d = allData[memberId]?.completedSteps || []; const f = d.indexOf(false); return f >= 0 ? f : d.length < 6 ? d.length : 0; });
  const [saving, setSaving] = useState(false);
  const userData = allData[memberId] || {};
  const member = members.find((m) => m.id === memberId)!;
  const STEPS = [
    { title: "Quem és tu?", icon: "👤" }, { title: "Vais ou não?", icon: "🎲" }, { title: "Quando podes?", icon: "📅" },
    { title: "O que preferes?", icon: "🎮" }, { title: "Prioridades", icon: "⭐" }, { title: "Batalha de Cidades", icon: "⚔️" },
  ];
  async function handleSave(data: any) {
    setSaving(true);
    const cs = [...(userData.completedSteps || [false,false,false,false,false,false])]; cs[step] = true;
    await onSave(memberId, { ...data, completedSteps: cs }); setSaving(false);
    if (step < 5) setStep(step + 1); else onBack();
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="text-slate-400 hover:text-white text-sm">← Sair</button>
          <div className="flex-1 text-center"><span className="text-sm text-slate-400">{step+1}/6</span><h2 className="text-lg font-bold">{STEPS[step].icon} {STEPS[step].title}</h2></div>
          <div className="w-12" />
        </div>
        <div className="flex gap-1 mb-8">{STEPS.map((_, i) => (<button key={i} onClick={() => setStep(i)} className={`h-2 flex-1 rounded-full transition-all ${i === step ? "bg-orange-500" : (userData.completedSteps||[])[i] ? "bg-emerald-500" : "bg-slate-700"}`} />))}</div>
        {saving && <div className="text-center py-2 text-sm text-orange-400 animate-pulse mb-4">💾 A guardar...</div>}
        {step === 0 && <StepProfile member={member} data={userData} origins={appData.origins} onSave={handleSave} />}
        {step === 1 && <StepProbability data={userData} onSave={handleSave} />}
        {step === 2 && <StepCalendar data={userData} calDates={calDates} onSave={handleSave} />}
        {step === 3 && <StepQuiz data={userData} quiz={appData.quiz} onSave={handleSave} />}
        {step === 4 && <StepPriorities data={userData} factors={appData.factors} onSave={handleSave} />}
        {step === 5 && <StepBattles data={userData} destinations={appData.destinations} onSave={handleSave} />}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════

// ═══════════════════════════════════════════════
// DESTINATION DETAIL MODAL
// ═══════════════════════════════════════════════

function DestinationDetail({ dest, rank, factors, origins, members, allData, group, nights, onClose, onCompare, isInCompare }: any) {
  const topAttrs = Object.entries(dest.attrs).sort(([,a],[,b]) => (b as number) - (a as number)).slice(0, 5);
  const uData = members.map((m: Member) => ({ ...m, d: allData[m.id] || {} })).filter((u: any) => u.d.originCity);

  // Calculate costs
  const costs = uData.map((u: any) => {
    const orig = origins.find((o: Origin) => o.id === u.d.originCity);
    if (!orig) return null;
    const dist = haversine(orig.lat, orig.lon, dest.lat, dest.lon);
    const fl = flightCost(dist);
    const ht = dest.cost_med * nights;
    const fd = dest.food_per_day * (nights + 1);
    return { member: u, flight: fl, hotel: ht, food: fd, total: fl + ht + fd + (fl + ht + fd) * 0.15 };
  }).filter(Boolean);

  const avgCost = costs.length ? Math.round(costs.reduce((a: number, b: any) => a + b.total, 0) / costs.length) : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-slate-900 w-full max-w-lg max-h-[90vh] rounded-t-3xl sm:rounded-3xl overflow-hidden animate-slide-up">
        {/* Header Image */}
        <div className="relative h-48">
          {dest.image_url ? (
            <img src={dest.image_url} alt={dest.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-6xl">{dest.flag}</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
          <button onClick={onClose} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70">✕</button>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-orange-400">#{rank}</span>
              <div>
                <h2 className="text-2xl font-bold text-white">{dest.flag} {dest.name}</h2>
                <p className="text-slate-300">{dest.country}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-12rem)]">
          {/* Score & Consensus */}
          <div className="flex gap-3">
            <div className="flex-1 bg-slate-800/80 rounded-2xl p-4 text-center">
              <p className="text-3xl font-black text-orange-400">{dest.gs.toFixed(1)}</p>
              <p className="text-xs text-slate-400 mt-1">Match Score</p>
            </div>
            <div className="flex-1 bg-slate-800/80 rounded-2xl p-4 text-center">
              <p className={`text-3xl font-black ${dest.consensus >= 80 ? "text-emerald-400" : dest.consensus >= 50 ? "text-amber-400" : "text-red-400"}`}>
                {dest.consensus}%
              </p>
              <p className="text-xs text-slate-400 mt-1">Consenso</p>
            </div>
            {avgCost && (
              <div className="flex-1 bg-slate-800/80 rounded-2xl p-4 text-center">
                <p className="text-3xl font-black text-white">€{avgCost}</p>
                <p className="text-xs text-slate-400 mt-1">Custo Médio</p>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-slate-300 text-sm">{dest.description}</p>

          {/* Quick Info */}
          <div className="flex gap-4 text-sm text-slate-400">
            <span>🌡️ {dest.temp_may}°C</span>
            <span>🌧️ {dest.rain_days} dias chuva</span>
            <span>{"€".repeat(Math.min(Math.max(Math.ceil(dest.cost_med / 35), 1), 4))}</span>
          </div>

          {/* Attributes */}
          <div className="bg-slate-800/60 rounded-2xl p-4">
            <h3 className="font-semibold text-sm text-slate-300 mb-3">Pontos Fortes</h3>
            <div className="space-y-2">
              {topAttrs.map(([key, value]) => {
                const factor = factors.find((f: Factor) => f.attr_key === key);
                if (!factor) return null;
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-lg">{factor.emoji}</span>
                    <span className="flex-1 text-sm text-slate-300">{factor.name}</span>
                    <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-500 to-pink-500" style={{ width: `${(value as number) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => onCompare(dest.id)}
              className={`flex-1 py-3 rounded-xl font-semibold transition-all ${isInCompare ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-300 hover:bg-slate-600"}`}
            >
              {isInCompare ? "✓ A comparar" : "Comparar"}
            </button>
          </div>

          {/* Booking Links - Only show for top destination */}
          {rank === 1 && (
            <BookingLinks
              destination={dest}
              origins={origins}
              calStart={group.cal_start}
              calEnd={group.cal_end}
              memberCount={members.length}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Dashboard({ group, members, allData, appData, calDates, onBack }: { group: Group; members: Member[]; allData: Record<string, any>; appData: AppData; calDates: string[]; onBack: () => void }) {
  const [tab, setTab] = useState("who"); const [nights, setNights] = useState(4);
  const [whereSubTab, setWhereSubTab] = useState<"ranking" | "insights">("ranking");
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [selectedDest, setSelectedDest] = useState<any>(null);
  const { destinations, factors, origins } = appData;
  const uData = members.map((m) => ({ ...m, d: allData[m.id] || {} }));

  const destScores = useMemo(() => {
    const wd = uData.filter((u) => u.d.quizAttrs && u.d.priorities);
    return destinations.map((dest) => {
      const scores = wd.map((u) => calcScore(u.d, dest, factors));
      const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
      let consensus = 100;
      if (scores.length > 1) {
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
        const stdDev = Math.sqrt(variance);
        consensus = Math.max(0, Math.round(100 - (stdDev / 10) * 100));
      }
      return { ...dest, gs: avg, consensus };
    }).sort((a, b) => b.gs - a.gs);
  }, [allData, destinations, factors]);

  const filteredDestScores = useMemo(() => {
    return applyFilters(destScores, filters).sort((a: any, b: any) => b.gs - a.gs);
  }, [destScores, filters]);

  const dateSc = useMemo(() => calDates.map((date) => {
    let av = 0, te = 0;
    Object.values(allData).forEach((u: any) => { if (u?.calendar?.[date] === "available") av++; else if (u?.calendar?.[date] === "tentative") te++; });
    return { date, av, te, sc: av * 2 + te };
  }), [allData, calDates]);

  const bw = useMemo(() => bestWindows(allData, calDates, nights), [allData, calDates, nights]);
  const tabs = [{ id: "who", l: "👥 Quem" }, { id: "when", l: "📅 Quando" }, { id: "where", l: "📍 Onde" }, { id: "money", l: "💰 Quanto" }];

  const toggleCompare = (destId: string) => {
    setCompareIds((prev) => {
      if (prev.includes(destId)) return prev.filter((id) => id !== destId);
      if (prev.length >= 4) return prev;
      return [...prev, destId];
    });
  };

  const compareDestinations = useMemo(() => {
    return compareIds.map((id) => destScores.find((d) => d.id === id)).filter(Boolean) as (Destination & { gs: number })[];
  }, [compareIds, destScores]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={onBack} className="text-slate-400 hover:text-white text-sm">← Voltar</button>
          <h1 className="flex-1 text-center text-2xl font-extrabold">📊 Dashboard</h1><div className="w-12" />
        </div>
        <div className="flex gap-1 bg-slate-800/60 rounded-2xl p-1 mb-6 border border-slate-700/30">
          {tabs.map((t) => (<button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${tab === t.id ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30" : "text-slate-400"}`}>{t.l}</button>))}
        </div>

        {tab === "who" && (
          <div className="space-y-3 animate-fade-in">
            {uData.map((u) => { const p = u.d.probability; const b = p != null ? getBadge(p) : null; return (
              <div key={u.id} className="bg-slate-800/60 border border-slate-700/30 rounded-2xl p-4 flex items-center gap-3">
                <span className="text-4xl">{u.d.avatar || "❓"}</span>
                <div className="flex-1 min-w-0"><p className="font-semibold truncate">{u.d.nickname || u.name}</p>
                  {p != null ? <><p className={`text-sm ${b!.cl}`}>{b!.text}</p><div className="flex gap-3 mt-1 text-xs text-slate-400"><span>🎯{u.d.intention}</span><span>📊{u.d.possibility}</span><span>🎲{p}</span></div></> : <p className="text-sm text-slate-500">⏳ Pendente...</p>}
                </div>{p != null && <div className="text-3xl font-extrabold text-orange-400">{p}</div>}
              </div>); })}
            {(() => { const ps = uData.filter((u) => u.d.probability != null).map((u) => u.d.probability); if (!ps.length) return null;
              const avg = (ps.reduce((a: number, b: number) => a + b, 0) / ps.length).toFixed(1); const likely = ps.filter((p: number) => p >= 6).length;
              return (<div className="bg-slate-800/40 border border-slate-700/20 rounded-2xl p-5 mt-2"><h3 className="font-bold mb-3 text-center">📈 Resumo</h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div><p className="text-3xl font-extrabold text-orange-400">{avg}</p><p className="text-xs text-slate-400 mt-1">Média</p></div>
                  <div><p className="text-3xl font-extrabold text-emerald-400">{likely}</p><p className="text-xs text-slate-400 mt-1">Prováveis</p></div>
                  <div><p className="text-3xl font-extrabold text-slate-400">{ps.length}/{members.length}</p><p className="text-xs text-slate-400 mt-1">Responderam</p></div>
                </div></div>); })()}
          </div>
        )}

        {tab === "when" && (
          <div className="space-y-5 animate-fade-in">
            <div className="grid grid-cols-7 gap-1.5">
              {DAYS_PT.map((d) => (<div key={d} className="text-center text-xs text-slate-500 font-medium py-1">{d}</div>))}
              {calDates.length > 0 && Array(dayOfWeek(calDates[0])).fill(null).map((_, i) => (<div key={`p${i}`} />))}
              {dateSc.map(({ date, av, te, sc }) => { const mx = members.length * 2; const int = mx > 0 ? sc / mx : 0;
                const bg = int > 0.6 ? "bg-emerald-500 text-white" : int > 0.3 ? "bg-emerald-700/80 text-emerald-100" : int > 0.05 ? "bg-emerald-900/60 text-emerald-200" : "bg-slate-800/80 text-slate-400";
                return (<div key={date} className={`py-2 px-0.5 rounded-xl text-center ${bg}`}><div className="text-[10px] opacity-60 leading-none mb-0.5">{monthLabel(date)}</div><div className="text-sm font-bold">{dayNum(date)}</div>
                  <div className="text-[9px] mt-0.5 leading-none">{av > 0 && <span className="text-emerald-200">{av}✓</span>}{te > 0 && <span className="text-amber-300 ml-0.5">{te}?</span>}</div></div>); })}
            </div>
            <div><h3 className="font-bold mb-3">🏆 Melhores janelas</h3>
              <div className="flex gap-2 mb-3">{[3,4,5].map((n) => (<button key={n} onClick={() => setNights(n)} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${nights === n ? "bg-orange-500 text-white" : "bg-slate-700 text-slate-300"}`}>{n} noites</button>))}</div>
              {bw.map((w, i) => (<div key={i} className={`p-4 rounded-2xl mb-2 ${i === 0 ? "bg-orange-500/15 ring-1 ring-orange-500/40" : "bg-slate-800/60"}`}>
                <div className="flex justify-between items-center"><span className="font-semibold">{i === 0 && "⭐ "}{dayNum(w.start)} {monthLabel(w.start)} — {dayNum(w.end)} {monthLabel(w.end)}</span><span className="text-orange-400 font-bold">Score: {w.score}</span></div></div>))}
              {bw.length === 0 && <p className="text-slate-500 text-sm text-center">Ninguém preencheu o calendário ainda.</p>}
            </div>
          </div>
        )}

        {tab === "where" && (
          <div className="space-y-3 animate-fade-in">
            {/* Sub-tabs for Where */}
            <div className="flex gap-1 bg-slate-800/40 rounded-xl p-1">
              <button
                onClick={() => setWhereSubTab("ranking")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${whereSubTab === "ranking" ? "bg-slate-700 text-white" : "text-slate-400"}`}
              >
                🏆 Ranking
              </button>
              <button
                onClick={() => setWhereSubTab("insights")}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${whereSubTab === "insights" ? "bg-slate-700 text-white" : "text-slate-400"}`}
              >
                📊 Análise
              </button>
            </div>

            {/* RANKING SUB-TAB */}
            {whereSubTab === "ranking" && (
              <>
                {/* Winner Card */}
                {filteredDestScores[0]?.gs > 0 && (
                  <button
                    onClick={() => setSelectedDest({ dest: filteredDestScores[0], rank: 1 })}
                    className="w-full bg-gradient-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/30 rounded-2xl overflow-hidden text-left hover:from-orange-500/30 hover:to-pink-500/30 transition-all"
                  >
                    <div className="relative h-32">
                      {filteredDestScores[0].image_url ? (
                        <img src={filteredDestScores[0].image_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center text-5xl">{filteredDestScores[0].flag}</div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-lg">🏆 #1</div>
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-xl font-bold text-white">{filteredDestScores[0].flag} {filteredDestScores[0].name}</h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-orange-400 font-bold">{filteredDestScores[0].gs.toFixed(1)} pts</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${filteredDestScores[0].consensus >= 80 ? "bg-emerald-500/30 text-emerald-300" : filteredDestScores[0].consensus >= 50 ? "bg-amber-500/30 text-amber-300" : "bg-red-500/30 text-red-300"}`}>
                            {filteredDestScores[0].consensus}% consenso
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                )}

                {/* Rest of Rankings */}
                {filteredDestScores[0]?.gs > 0 ? (
                  <div className="space-y-2">
                    {filteredDestScores.slice(1, 10).map((dest: any, i: number) => {
                      const rank = i + 2;
                      const mx = filteredDestScores[0]?.gs || 1;
                      const pct = (dest.gs / mx) * 100;
                      return (
                        <button
                          key={dest.id}
                          onClick={() => setSelectedDest({ dest, rank })}
                          className="w-full bg-slate-800/60 border border-slate-700/30 rounded-xl p-3 flex items-center gap-3 hover:bg-slate-800/80 transition-all text-left"
                        >
                          <span className="text-lg font-bold text-slate-400 w-7">#{rank}</span>
                          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                            {dest.image_url ? (
                              <img src={dest.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-slate-700 flex items-center justify-center text-xl">{dest.flag}</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-white truncate">{dest.name}</p>
                            <p className="text-xs text-slate-400">{dest.country}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-orange-400">{dest.gs.toFixed(1)}</p>
                            <div className="w-16 h-1.5 bg-slate-700 rounded-full mt-1">
                              <div className="h-full bg-gradient-to-r from-orange-500 to-pink-500 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="text-5xl mb-4">🗺️</div>
                    <p className="text-slate-400">Completa o quiz e prioridades para ver o ranking.</p>
                  </div>
                )}
              </>
            )}

            {/* INSIGHTS SUB-TAB */}
            {whereSubTab === "insights" && (
              <>
                {/* Filters */}
                <DestinationFilters
                  filters={filters}
                  onChange={setFilters}
                  destinations={destinations}
                  filteredCount={filteredDestScores.length}
                />

                {/* Compare Tool */}
                <div className="bg-slate-800/60 border border-slate-700/30 rounded-2xl p-4">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <span>📊</span> Comparar Destinos
                  </h3>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {filteredDestScores.slice(0, 6).map((dest: any, i: number) => {
                      const isSelected = compareIds.includes(dest.id);
                      return (
                        <button
                          key={dest.id}
                          onClick={() => toggleCompare(dest.id)}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${isSelected ? "bg-blue-500 text-white" : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"}`}
                        >
                          {dest.flag} {dest.name}
                        </button>
                      );
                    })}
                  </div>
                  {compareIds.length >= 2 ? (
                    <button
                      onClick={() => setShowCompare(true)}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold"
                    >
                      Comparar {compareIds.length} destinos →
                    </button>
                  ) : (
                    <p className="text-xs text-slate-500 text-center">Seleciona pelo menos 2 destinos para comparar</p>
                  )}
                </div>

                {/* Cost-Benefit */}
                {filteredDestScores[0]?.gs > 0 && (
                  <CostBenefitPanel
                    destinations={filteredDestScores.slice(0, 3) as any}
                    factors={factors}
                    members={members}
                    allData={allData}
                    origins={origins}
                    nights={nights}
                  />
                )}
              </>
            )}
          </div>
        )}

        {/* Destination Detail Modal */}
        {selectedDest && (
          <DestinationDetail
            dest={selectedDest.dest}
            rank={selectedDest.rank}
            factors={factors}
            origins={origins}
            members={members}
            allData={allData}
            group={group}
            nights={nights}
            onClose={() => setSelectedDest(null)}
            onCompare={toggleCompare}
            isInCompare={compareIds.includes(selectedDest.dest.id)}
          />
        )}

        {/* Compare Modal */}
        {showCompare && compareDestinations.length >= 2 && (
          <CompareDestinations
            destinations={compareDestinations}
            factors={factors}
            members={members}
            allData={allData}
            origins={origins}
            nights={nights}
            onClose={() => setShowCompare(false)}
          />
        )}

        {tab === "money" && (
          <div className="space-y-5 animate-fade-in">
            <div className="flex gap-2 justify-center">{[3,4,5].map((n) => (<button key={n} onClick={() => setNights(n)} className={`px-4 py-1.5 rounded-lg text-sm font-medium ${nights === n ? "bg-orange-500 text-white" : "bg-slate-700 text-slate-300"}`}>{n} noites</button>))}</div>
            {destScores.slice(0, 3).map((dest, di) => { const withCity = uData.filter((u) => u.d.originCity); return (
              <div key={dest.id} className="bg-slate-800/60 border border-slate-700/30 rounded-2xl overflow-hidden">
                {dest.image_url && <img src={dest.image_url} alt="" className="w-full h-24 object-cover" />}
                <div className="p-4"><h3 className="font-bold mb-3">{dest.flag} {dest.name} <span className="text-slate-400 font-normal text-sm">— #{di+1}</span></h3>
                  <div className="space-y-2">
                    {withCity.map((u) => { const orig = origins.find((o) => o.id === u.d.originCity); if (!orig) return null;
                      const dist = haversine(orig.lat, orig.lon, dest.lat, dest.lon); const fl = Math.round(flightCost(dist));
                      const ht = Math.round(dest.cost_med * nights); const fd = Math.round(dest.food_per_day * (nights + 1)); const ex = Math.round((fl + ht + fd) * 0.15); const tot = fl + ht + fd + ex;
                      return (<div key={u.id} className="flex items-center gap-2 bg-slate-700/40 rounded-xl p-2.5"><span className="text-lg">{u.d.avatar || "❓"}</span><span className="flex-1 text-sm truncate">{u.d.nickname || u.name.split(" ")[0]}</span>
                        <div className="text-right"><div className="text-[10px] text-slate-400 space-x-1"><span>✈{fl}€</span><span>🏨{ht}€</span><span>🍽{fd}€</span></div><p className="text-orange-400 font-bold">{tot}€</p></div></div>); })}
                  </div>
                  {(() => { const tots = withCity.map((u) => { const orig = origins.find((o) => o.id === u.d.originCity); if (!orig) return 0; const d = haversine(orig.lat, orig.lon, dest.lat, dest.lon); const fl = flightCost(d); return fl + dest.cost_med * nights + dest.food_per_day * (nights + 1) + (fl + dest.cost_med * nights + dest.food_per_day * (nights + 1)) * 0.15; }); if (!tots.length) return null;
                    return (<div className="mt-3 pt-3 border-t border-slate-700/50 grid grid-cols-3 text-center text-sm">
                      <div><p className="text-emerald-400 font-bold">€{Math.round(Math.min(...tots))}</p><p className="text-[10px] text-slate-500">Min</p></div>
                      <div><p className="text-orange-400 font-bold">€{Math.round(tots.reduce((a,b) => a+b, 0) / tots.length)}</p><p className="text-[10px] text-slate-500">Média</p></div>
                      <div><p className="text-red-400 font-bold">€{Math.round(Math.max(...tots))}</p><p className="text-[10px] text-slate-500">Max</p></div></div>); })()}
                </div></div>); })}
            {destScores[0]?.gs <= 0 && <p className="text-slate-500 text-center">Completa o quiz para ver orçamentos.</p>}
            <p className="text-xs text-slate-500 text-center">💡 Estimativas: voo por distância, hotel médio, comida + 15% extras</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════

export default function FugaApp({ slug }: { slug: string }) {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [allData, setAllData] = useState<Record<string, any>>({});
  const [calDates, setCalDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [view, setView] = useState<"home"|"wizard"|"dashboard"|"pin">("home");
  const [memberId, setMemberId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pinHasExisting, setPinHasExisting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: string } | null>(null);

  const showToast = useCallback((msg: string, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); }, []);

  // Load all data on mount
  useEffect(() => {
    let mounted = true;
    async function load() {
      const group = await loadGroup(slug);
      if (!group) { if (mounted) { setNotFound(true); setLoading(false); } return; }

      const [mems, dests, quiz, facts, origs] = await Promise.all([
        loadMembers(group.id),
        loadDestinationsForGroup(group.id),
        loadQuizForGroup(group.id),
        loadFactorsForGroup(group.id),
        loadOrigins(),
      ]);

      const md = await loadMemberData(mems.map((m) => m.id));
      const dates = generateCalDates(group.cal_start, group.cal_end);

      if (mounted) {
        setAppData({ group, members: mems, destinations: dests, quiz, factors: facts, origins: origs });
        setMembers(mems); setAllData(md); setCalDates(dates); setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, [slug]);

  // Realtime subscription
  useEffect(() => {
    const channel = subscribeToMemberData((payload: any) => {
      const row = payload.new;
      if (row?.member_id) {
        setAllData((prev) => ({ ...prev, [row.member_id]: { ...(row.data || {}), _pin: row.pin || null } }));
      }
    });
    return () => { unsubscribe(channel); };
  }, []);

  function handleSelectMember(mid: string) {
    const d = allData[mid] || {};
    setPendingId(mid); setPinHasExisting(!!d._pin); setView("pin");
  }

  async function handlePinSubmit(pin: string, isNew: boolean) {
    if (!pendingId) return;
    if (!isNew && allData[pendingId]?._pin !== pin) { showToast("PIN incorreto!", "error"); return; }
    if (isNew) {
      await saveMemberData(pendingId, allData[pendingId] || {}, pin);
      setAllData((p) => ({ ...p, [pendingId!]: { ...(p[pendingId!] || {}), _pin: pin } }));
    }
    setMemberId(pendingId); setPendingId(null); setView("wizard");
    const m = members.find((x) => x.id === pendingId);
    showToast(`Bem-vindo, ${m?.name.split(" ")[0]}! 🎉`);
  }

  async function handleSave(mid: string, data: any) {
    const merged = { ...(allData[mid] || {}), ...data };
    setAllData((p) => ({ ...p, [mid]: merged }));
    const ok = await saveMemberData(mid, merged);
    showToast(ok ? "Guardado! 💾" : "Erro ao guardar", ok ? "success" : "error");
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center"><div className="text-6xl animate-bounce mb-4">✈️</div><p className="text-slate-400 text-lg">A carregar...</p></div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center"><div className="text-6xl mb-4">🤷</div><h1 className="text-2xl font-bold mb-2">Grupo não encontrado</h1>
        <p className="text-slate-400 mb-6">O código <span className="text-orange-400 font-mono">{slug}</span> não existe.</p>
        <a href="/" className="px-6 py-3 rounded-xl bg-orange-500 text-white font-bold">← Voltar ao início</a></div>
    </div>
  );

  if (!appData) return null;

  return (
    <>
      {toast && <Toast message={toast.msg} type={toast.type} />}
      {view === "pin" && pendingId && <PinModal member={{ ...members.find((m) => m.id === pendingId), avatar: allData[pendingId]?.avatar }} hasExistingPin={pinHasExisting} onSuccess={handlePinSubmit} onCancel={() => { setPendingId(null); setView("home"); }} />}
      {view === "dashboard" && <Dashboard group={appData.group} members={members} allData={allData} appData={appData} calDates={calDates} onBack={() => setView("home")} />}
      {view === "wizard" && memberId && <Wizard memberId={memberId} members={members} allData={allData} appData={appData} calDates={calDates} onSave={handleSave} onBack={() => setView("home")} />}
      {(view === "home" || view === "pin") && <HomeScreen group={appData.group} members={members} allData={allData} onSelect={handleSelectMember} onDash={() => setView("dashboard")} />}
    </>
  );
}
