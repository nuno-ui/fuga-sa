"use client";

import { useState } from "react";
import type { Destination } from "@/lib/types";

export interface FilterState {
  experienceTypes: string[];
  budget: string;
  regions: string[];
}

export const DEFAULT_FILTERS: FilterState = {
  experienceTypes: [],
  budget: "any",
  regions: [],
};

export const EXPERIENCE_TYPES = [
  { id: "beach", label: "Praia & Relax", emoji: "🏖️", attrKey: "beach", threshold: 0.7 },
  { id: "night", label: "Vida Noturna", emoji: "🎉", attrKey: "night", threshold: 0.7 },
  { id: "nature", label: "Natureza & Aventura", emoji: "🏔️", attrKey: "nature", threshold: 0.7 },
  { id: "culture", label: "Cultura & História", emoji: "🏛️", attrKey: "culture", threshold: 0.7 },
  { id: "food", label: "Gastronomia", emoji: "🍽️", attrKey: "food", threshold: 0.7 },
];

export const BUDGET_OPTIONS = [
  { id: "budget", label: "Económico", emoji: "💰", description: "budget >= 0.7" },
  { id: "mid", label: "Médio", emoji: "💵", description: "budget 0.4-0.7" },
  { id: "premium", label: "Premium", emoji: "💎", description: "budget < 0.4" },
  { id: "any", label: "Qualquer", emoji: "🌍", description: "Todos os preços" },
];

export const REGIONS = [
  { id: "portugal", label: "Portugal", countries: ["Portugal"] },
  { id: "spain", label: "Espanha", countries: ["Espanha", "Spain"] },
  { id: "italy", label: "Itália", countries: ["Itália", "Italy"] },
  { id: "france", label: "França", countries: ["França", "France"] },
  { id: "greece", label: "Grécia", countries: ["Grécia", "Greece"] },
  { id: "central", label: "Europa Central", countries: ["Alemanha", "Germany", "Áustria", "Austria", "Suíça", "Switzerland"] },
  { id: "northern", label: "Europa do Norte", countries: ["Dinamarca", "Denmark", "Suécia", "Sweden", "Noruega", "Norway", "Finlândia", "Finland", "Reino Unido", "UK", "Irlanda", "Ireland"] },
  { id: "eastern", label: "Europa de Leste", countries: ["Polónia", "Poland", "Chéquia", "Czech", "Hungria", "Hungary", "Roménia", "Romania"] },
  { id: "balkans", label: "Balcãs", countries: ["Croácia", "Croatia", "Eslovénia", "Slovenia", "Sérvia", "Serbia", "Montenegro", "Bósnia", "Bosnia", "Albânia", "Albania"] },
  { id: "mediterranean", label: "Ilhas Mediterrânicas", countries: ["Malta", "Chipre", "Cyprus"] },
  { id: "outside", label: "Fora da Europa", countries: ["Marrocos", "Morocco", "Turquia", "Turkey", "EAU", "UAE"] },
];

interface DestinationFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  destinations: Destination[];
  filteredCount: number;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  showQuickSelect?: boolean;
  onQuickSelect?: (type: "beach" | "budget" | "clear") => void;
}

export function applyFilters<T extends Destination>(destinations: T[], filters: FilterState): T[] {
  return destinations.filter((dest) => {
    // Experience type filters (OR logic - match any selected)
    if (filters.experienceTypes.length > 0) {
      const matchesExperience = filters.experienceTypes.some((typeId) => {
        const type = EXPERIENCE_TYPES.find((t) => t.id === typeId);
        if (!type) return false;
        const attrValue = (dest.attrs as Record<string, number>)[type.attrKey] || 0;
        return attrValue >= type.threshold;
      });
      if (!matchesExperience) return false;
    }

    // Budget filter
    if (filters.budget !== "any") {
      const budgetValue = (dest.attrs as Record<string, number>)["budget"] || 0.5;
      switch (filters.budget) {
        case "budget":
          if (budgetValue < 0.7) return false;
          break;
        case "mid":
          if (budgetValue < 0.4 || budgetValue >= 0.7) return false;
          break;
        case "premium":
          if (budgetValue >= 0.4) return false;
          break;
      }
    }

    // Region filters (OR logic - match any selected)
    if (filters.regions.length > 0) {
      const matchesRegion = filters.regions.some((regionId) => {
        const region = REGIONS.find((r) => r.id === regionId);
        if (!region) return false;
        return region.countries.some((country) =>
          dest.country.toLowerCase().includes(country.toLowerCase())
        );
      });
      if (!matchesRegion) return false;
    }

    return true;
  });
}

export default function DestinationFilters({
  filters,
  onChange,
  destinations,
  filteredCount,
  collapsed = false,
  onToggleCollapse,
  showQuickSelect = false,
  onQuickSelect,
}: DestinationFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsed);

  const toggleExperience = (id: string) => {
    const newTypes = filters.experienceTypes.includes(id)
      ? filters.experienceTypes.filter((t) => t !== id)
      : [...filters.experienceTypes, id];
    onChange({ ...filters, experienceTypes: newTypes });
  };

  const toggleRegion = (id: string) => {
    const newRegions = filters.regions.includes(id)
      ? filters.regions.filter((r) => r !== id)
      : [...filters.regions, id];
    onChange({ ...filters, regions: newRegions });
  };

  const setBudget = (id: string) => {
    onChange({ ...filters, budget: id });
  };

  const clearFilters = () => {
    onChange(DEFAULT_FILTERS);
  };

  const hasActiveFilters =
    filters.experienceTypes.length > 0 ||
    filters.budget !== "any" ||
    filters.regions.length > 0;

  return (
    <div className="bg-slate-800/60 border border-slate-700/30 rounded-2xl overflow-hidden mb-4">
      {/* Header */}
      <button
        onClick={() => {
          setIsExpanded(!isExpanded);
          onToggleCollapse?.();
        }}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🔍</span>
          <span className="font-semibold">Filtros</span>
          {hasActiveFilters && (
            <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-0.5 rounded-full">
              {filters.experienceTypes.length + (filters.budget !== "any" ? 1 : 0) + filters.regions.length} ativos
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">
            {filteredCount} de {destinations.length} destinos
          </span>
          <span className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}>▼</span>
        </div>
      </button>

      {/* Filter Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 animate-fade-in border-t border-slate-700/30">
          {/* Quick Select Buttons (for admin) */}
          {showQuickSelect && onQuickSelect && (
            <div className="pt-3 flex gap-2 flex-wrap">
              <button
                onClick={() => onQuickSelect("beach")}
                className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-400 text-sm hover:bg-blue-600/30 transition"
              >
                🏖️ Selecionar Praias
              </button>
              <button
                onClick={() => onQuickSelect("budget")}
                className="px-3 py-1.5 rounded-lg bg-green-600/20 text-green-400 text-sm hover:bg-green-600/30 transition"
              >
                💰 Selecionar Económicos
              </button>
            </div>
          )}

          {/* Experience Types */}
          <div className="pt-3">
            <p className="text-sm text-slate-400 mb-2">Tipo de Experiência</p>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCE_TYPES.map((type) => {
                const isActive = filters.experienceTypes.includes(type.id);
                return (
                  <button
                    key={type.id}
                    onClick={() => toggleExperience(type.id)}
                    className={`px-3 py-1.5 rounded-xl text-sm transition-all ${
                      isActive
                        ? "bg-orange-500/20 ring-1 ring-orange-500/50 text-orange-300"
                        : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {type.emoji} {type.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget */}
          <div>
            <p className="text-sm text-slate-400 mb-2">Orçamento</p>
            <div className="flex flex-wrap gap-2">
              {BUDGET_OPTIONS.map((opt) => {
                const isActive = filters.budget === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setBudget(opt.id)}
                    className={`px-3 py-1.5 rounded-xl text-sm transition-all ${
                      isActive
                        ? "bg-orange-500/20 ring-1 ring-orange-500/50 text-orange-300"
                        : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {opt.emoji} {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Regions */}
          <div>
            <p className="text-sm text-slate-400 mb-2">Região</p>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((region) => {
                const isActive = filters.regions.includes(region.id);
                return (
                  <button
                    key={region.id}
                    onClick={() => toggleRegion(region.id)}
                    className={`px-3 py-1.5 rounded-xl text-sm transition-all ${
                      isActive
                        ? "bg-orange-500/20 ring-1 ring-orange-500/50 text-orange-300"
                        : "bg-slate-700/50 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {region.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clear All */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-full py-2 rounded-xl bg-slate-700/50 text-slate-300 text-sm hover:bg-slate-700 transition"
            >
              Limpar todos os filtros
            </button>
          )}
        </div>
      )}
    </div>
  );
}
