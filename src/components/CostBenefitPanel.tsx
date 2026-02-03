"use client";

import { useMemo } from "react";
import type { Destination, Factor, Member, Origin } from "@/lib/types";
import { calcScore, haversine, flightCost } from "@/lib/helpers";

interface DestWithScore extends Destination {
  gs: number;
}

interface CostBenefitPanelProps {
  destinations: DestWithScore[];
  factors: Factor[];
  members: Member[];
  allData: Record<string, any>;
  origins: Origin[];
  nights: number;
}

export default function CostBenefitPanel({
  destinations,
  factors,
  members,
  allData,
  origins,
  nights,
}: CostBenefitPanelProps) {
  const costBenefitData = useMemo(() => {
    const uData = members
      .map((m) => ({ ...m, d: allData[m.id] || {} }))
      .filter((u) => u.d.originCity);

    if (uData.length === 0 || destinations.length === 0) return [];

    return destinations.slice(0, 3).map((dest) => {
      // Calculate average cost
      const costs = uData.map((u) => {
        const orig = origins.find((o) => o.id === u.d.originCity);
        if (!orig) return null;
        const dist = haversine(orig.lat, orig.lon, dest.lat, dest.lon);
        const fl = flightCost(dist);
        const ht = dest.cost_med * nights;
        const fd = dest.food_per_day * (nights + 1);
        const ex = (fl + ht + fd) * 0.15;
        return { flight: fl, hotel: ht, food: fd, extras: ex, total: fl + ht + fd + ex };
      }).filter((c) => c !== null) as { flight: number; hotel: number; food: number; extras: number; total: number }[];

      const avgCost = costs.length
        ? costs.reduce((a, b) => a + b.total, 0) / costs.length
        : 0;

      const avgFlight = costs.length ? costs.reduce((a, b) => a + b.flight, 0) / costs.length : 0;
      const avgHotel = costs.length ? costs.reduce((a, b) => a + b.hotel, 0) / costs.length : 0;
      const avgFood = costs.length ? costs.reduce((a, b) => a + b.food, 0) / costs.length : 0;

      // Calculate value ratio (score per euro spent)
      const valueRatio = avgCost > 0 ? dest.gs / avgCost * 100 : 0;

      return {
        dest,
        avgCost: Math.round(avgCost),
        avgFlight: Math.round(avgFlight),
        avgHotel: Math.round(avgHotel),
        avgFood: Math.round(avgFood),
        score: dest.gs,
        valueRatio,
      };
    });
  }, [destinations, members, allData, origins, nights]);

  if (costBenefitData.length === 0) return null;

  // Find best value destination
  const bestValueIdx = costBenefitData.reduce(
    (best, curr, idx) => (curr.valueRatio > costBenefitData[best].valueRatio ? idx : best),
    0
  );

  const maxScore = Math.max(...costBenefitData.map((d) => d.score), 1);
  const maxCost = Math.max(...costBenefitData.map((d) => d.avgCost), 1);

  return (
    <div className="bg-slate-800/60 border border-slate-700/30 rounded-2xl overflow-hidden mb-4">
      <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/30 flex items-center gap-2">
        <span className="text-lg">📊</span>
        <h3 className="font-semibold text-white">Custo-Benefício</h3>
        <span className="text-xs text-slate-400 ml-auto">{nights} noites</span>
      </div>

      <div className="p-4 space-y-4">
        {costBenefitData.map((item, idx) => (
          <div
            key={item.dest.id}
            className={`relative rounded-xl p-4 transition-all ${
              idx === bestValueIdx
                ? "bg-emerald-500/10 ring-1 ring-emerald-500/30"
                : "bg-slate-700/30"
            }`}
          >
            {/* Best Value Badge */}
            {idx === bestValueIdx && (
              <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-lg">
                ⭐ Melhor Valor
              </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{item.dest.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{item.dest.name}</p>
                <p className="text-xs text-slate-400">{item.dest.country}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-orange-400">€{item.avgCost}</p>
                <p className="text-xs text-slate-500">por pessoa</p>
              </div>
            </div>

            {/* Score vs Cost Bars */}
            <div className="space-y-2 mb-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Match Score</span>
                  <span className="text-orange-400 font-medium">{item.score.toFixed(1)}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-orange-500 to-pink-500 transition-all"
                    style={{ width: `${(item.score / maxScore) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Custo Relativo</span>
                  <span className="text-slate-300 font-medium">€{item.avgCost}</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all"
                    style={{ width: `${(item.avgCost / maxCost) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Cost Breakdown */}
            <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-700/30">
              <span>✈️ €{item.avgFlight}</span>
              <span>🏨 €{item.avgHotel}</span>
              <span>🍽️ €{item.avgFood}</span>
              <span className={idx === bestValueIdx ? "text-emerald-400" : "text-slate-400"}>
                📈 {item.valueRatio.toFixed(2)} pts/€
              </span>
            </div>
          </div>
        ))}

        <p className="text-xs text-slate-500 text-center pt-2">
          💡 "Melhor Valor" = melhor rácio entre score de compatibilidade e custo estimado
        </p>
      </div>
    </div>
  );
}
