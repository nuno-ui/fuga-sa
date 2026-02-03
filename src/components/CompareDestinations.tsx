"use client";

import { useMemo } from "react";
import type { Destination, Factor, Member, Origin } from "@/lib/types";
import { calcScore, haversine, flightCost } from "@/lib/helpers";

interface CompareDestinationsProps {
  destinations: Destination[];
  factors: Factor[];
  members: Member[];
  allData: Record<string, any>;
  origins: Origin[];
  nights: number;
  onClose: () => void;
}

const ATTR_LABELS: Record<string, { label: string; emoji: string }> = {
  beach: { label: "Praia", emoji: "🏖️" },
  night: { label: "Vida Noturna", emoji: "🎉" },
  nature: { label: "Natureza", emoji: "🏔️" },
  culture: { label: "Cultura", emoji: "🏛️" },
  food: { label: "Gastronomia", emoji: "🍽️" },
  budget: { label: "Económico", emoji: "💰" },
  safety: { label: "Segurança", emoji: "🛡️" },
  accessibility: { label: "Acessibilidade", emoji: "✈️" },
  weather: { label: "Clima", emoji: "☀️" },
};

function ProgressBar({ value, maxValue = 1, color = "orange" }: { value: number; maxValue?: number; color?: string }) {
  const pct = Math.min(100, Math.max(0, (value / maxValue) * 100));
  const colorClass = {
    orange: "from-orange-500 to-pink-500",
    emerald: "from-emerald-500 to-teal-500",
    blue: "from-blue-500 to-indigo-500",
  }[color] || "from-orange-500 to-pink-500";

  return (
    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
      <div
        className={`h-full bg-gradient-to-r ${colorClass} transition-all duration-300`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export default function CompareDestinations({
  destinations,
  factors,
  members,
  allData,
  origins,
  nights,
  onClose,
}: CompareDestinationsProps) {
  // Calculate scores and costs for each destination
  const comparisonData = useMemo(() => {
    const uData = members.map((m) => ({ ...m, d: allData[m.id] || {} }));
    const withData = uData.filter((u) => u.d.quizAttrs && u.d.priorities);

    return destinations.map((dest) => {
      // Per-member scores
      const memberScores = withData.map((u) => ({
        memberId: u.id,
        name: u.d.nickname || u.name.split(" ")[0],
        avatar: u.d.avatar || "❓",
        score: calcScore(u.d, dest, factors),
      }));

      // Group average score
      const avgScore = memberScores.length
        ? memberScores.reduce((a, b) => a + b.score, 0) / memberScores.length
        : 0;

      // Calculate consensus (agreement percentage)
      let consensus = 100;
      if (memberScores.length > 1) {
        const scores = memberScores.map((m) => m.score);
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scores.length;
        const stdDev = Math.sqrt(variance);
        // Normalize: if stdDev is 0, consensus is 100%; max reasonable stdDev ~10 means ~0%
        consensus = Math.max(0, Math.round(100 - (stdDev / 10) * 100));
      }

      // Average cost per person
      const costsPerMember = withData
        .filter((u) => u.d.originCity)
        .map((u) => {
          const orig = origins.find((o) => o.id === u.d.originCity);
          if (!orig) return null;
          const dist = haversine(orig.lat, orig.lon, dest.lat, dest.lon);
          const fl = flightCost(dist);
          const ht = dest.cost_med * nights;
          const fd = dest.food_per_day * (nights + 1);
          const ex = (fl + ht + fd) * 0.15;
          return fl + ht + fd + ex;
        })
        .filter((c) => c !== null) as number[];

      const avgCost = costsPerMember.length
        ? Math.round(costsPerMember.reduce((a, b) => a + b, 0) / costsPerMember.length)
        : null;

      return {
        dest,
        avgScore,
        memberScores,
        consensus,
        avgCost,
        flightCost: costsPerMember.length ? Math.round(flightCost(1000)) : null, // Approximate
        hotelCost: Math.round(dest.cost_med * nights),
        foodCost: Math.round(dest.food_per_day * (nights + 1)),
      };
    });
  }, [destinations, factors, members, allData, origins, nights]);

  // Find max score for normalization
  const maxScore = Math.max(...comparisonData.map((d) => d.avgScore), 1);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-800 border border-slate-700/50 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700/30 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-white">Comparar Destinos</h2>
            <p className="text-sm text-slate-400">{destinations.length} destinos selecionados</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Destination Headers */}
            <thead>
              <tr className="border-b border-slate-700/30">
                <th className="text-left p-4 text-slate-400 text-sm font-medium w-32"></th>
                {comparisonData.map(({ dest }) => (
                  <th key={dest.id} className="p-4 text-center min-w-[180px]">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">{dest.flag}</span>
                      <span className="font-bold text-white">{dest.name}</span>
                      <span className="text-xs text-slate-400">{dest.country}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-700/30">
              {/* Group Score */}
              <tr className="bg-slate-800/50">
                <td className="p-4 text-sm text-slate-400 font-medium">🏆 Score Grupo</td>
                {comparisonData.map(({ dest, avgScore }) => (
                  <td key={dest.id} className="p-4 text-center">
                    <div className="text-2xl font-bold text-orange-400">{avgScore.toFixed(1)}</div>
                    <div className="mt-2 px-4">
                      <ProgressBar value={avgScore} maxValue={maxScore} />
                    </div>
                  </td>
                ))}
              </tr>

              {/* Consensus */}
              <tr>
                <td className="p-4 text-sm text-slate-400 font-medium">🤝 Consenso</td>
                {comparisonData.map(({ dest, consensus }) => (
                  <td key={dest.id} className="p-4 text-center">
                    <span
                      className={`text-lg font-bold ${
                        consensus >= 80
                          ? "text-emerald-400"
                          : consensus >= 50
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                    >
                      {consensus}%
                    </span>
                    {consensus >= 80 && <span className="ml-1">✅</span>}
                    {consensus < 50 && <span className="ml-1">⚠️</span>}
                  </td>
                ))}
              </tr>

              {/* Estimated Cost */}
              <tr className="bg-slate-800/50">
                <td className="p-4 text-sm text-slate-400 font-medium">💰 Custo Médio</td>
                {comparisonData.map(({ dest, avgCost, hotelCost, foodCost }) => (
                  <td key={dest.id} className="p-4 text-center">
                    {avgCost ? (
                      <>
                        <div className="text-lg font-bold text-white">€{avgCost}</div>
                        <div className="text-xs text-slate-500 mt-1">
                          🏨 €{hotelCost} · 🍽️ €{foodCost}
                        </div>
                      </>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Weather */}
              <tr>
                <td className="p-4 text-sm text-slate-400 font-medium">🌡️ Clima</td>
                {comparisonData.map(({ dest }) => (
                  <td key={dest.id} className="p-4 text-center">
                    <div className="text-lg font-bold text-white">{dest.temp_may}°C</div>
                    <div className="text-xs text-slate-500">🌧️ {dest.rain_days} dias chuva</div>
                  </td>
                ))}
              </tr>

              {/* Divider - Attributes */}
              <tr>
                <td colSpan={comparisonData.length + 1} className="bg-slate-700/30 px-4 py-2">
                  <span className="text-sm font-semibold text-slate-400">Atributos</span>
                </td>
              </tr>

              {/* All Attributes */}
              {Object.entries(ATTR_LABELS).map(([attrKey, { label, emoji }]) => (
                <tr key={attrKey}>
                  <td className="p-4 text-sm text-slate-400 font-medium">
                    {emoji} {label}
                  </td>
                  {comparisonData.map(({ dest }) => {
                    const value = (dest.attrs as Record<string, number>)[attrKey] || 0;
                    return (
                      <td key={dest.id} className="p-4">
                        <div className="px-4">
                          <ProgressBar value={value} />
                          <div className="text-center text-xs text-slate-500 mt-1">
                            {Math.round(value * 100)}%
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Divider - Per-member scores */}
              {comparisonData[0]?.memberScores.length > 0 && (
                <>
                  <tr>
                    <td colSpan={comparisonData.length + 1} className="bg-slate-700/30 px-4 py-2">
                      <span className="text-sm font-semibold text-slate-400">Scores por Membro</span>
                    </td>
                  </tr>

                  {comparisonData[0].memberScores.map((member, idx) => (
                    <tr key={member.memberId}>
                      <td className="p-4 text-sm text-slate-400 font-medium">
                        <span className="text-lg mr-2">{member.avatar}</span>
                        {member.name}
                      </td>
                      {comparisonData.map(({ dest, memberScores }) => {
                        const ms = memberScores[idx];
                        return (
                          <td key={dest.id} className="p-4 text-center">
                            <span className="text-lg font-bold text-slate-300">
                              {ms?.score.toFixed(1) || "—"}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700/30 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
