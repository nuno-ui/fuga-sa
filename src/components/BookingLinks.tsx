"use client";

import { useState, useMemo } from "react";
import type { Destination, Origin } from "@/lib/types";
import { getBookingUrls, getAirportCode, getCityNameEn } from "@/lib/affiliateLinks";

interface DestWithScore extends Destination {
  gs: number;
}

interface BookingLinksProps {
  destination: DestWithScore;
  secondDestination?: DestWithScore;
  origins: Origin[];
  calStart: string;
  calEnd: string;
  memberCount: number;
  defaultOrigin?: string;
}

export default function BookingLinks({
  destination,
  secondDestination,
  origins,
  calStart,
  calEnd,
  memberCount,
  defaultOrigin,
}: BookingLinksProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState(defaultOrigin || "");

  // Check if there's a clear winner (>10% gap to #2)
  const hasClearWinner = useMemo(() => {
    if (!secondDestination) return true;
    const gap = (destination.gs - secondDestination.gs) / destination.gs;
    return gap >= 0.1;
  }, [destination, secondDestination]);

  // Get booking URLs
  const bookingUrls = useMemo(() => {
    const origin = origins.find((o) => o.id === selectedOrigin);
    const originName = origin?.name || "Lisboa";

    return getBookingUrls(
      destination.name,
      originName,
      calStart,
      calEnd,
      memberCount
    );
  }, [destination, selectedOrigin, origins, calStart, calEnd, memberCount]);

  const destAirportCode = getAirportCode(destination.name);
  const destCityEn = getCityNameEn(destination.name);

  if (!hasClearWinner) return null;

  return (
    <div className="bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border border-emerald-700/30 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-emerald-800/20 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🎫</span>
          <span className="font-semibold text-emerald-300">Reservar esta viagem</span>
          {hasClearWinner && (
            <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-0.5 rounded-full">
              Vencedor claro!
            </span>
          )}
        </div>
        <span className={`text-emerald-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 animate-fade-in border-t border-emerald-700/30 pt-4">
          {/* Destination Summary */}
          <div className="flex items-center gap-3 bg-slate-800/50 rounded-xl p-3">
            <span className="text-3xl">{destination.flag}</span>
            <div className="flex-1">
              <p className="font-bold text-white">{destination.name}</p>
              <p className="text-sm text-slate-400">{destination.country}</p>
            </div>
            <div className="text-right">
              <p className="text-orange-400 font-bold">Score: {destination.gs.toFixed(1)}</p>
              <p className="text-xs text-slate-500">{destAirportCode || destCityEn}</p>
            </div>
          </div>

          {/* Trip Details */}
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="bg-slate-800/50 rounded-xl p-2">
              <p className="text-slate-400">📅 De</p>
              <p className="text-white font-medium">{formatDate(calStart)}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-2">
              <p className="text-slate-400">📅 Até</p>
              <p className="text-white font-medium">{formatDate(calEnd)}</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-2">
              <p className="text-slate-400">👥 Viajantes</p>
              <p className="text-white font-medium">{memberCount}</p>
            </div>
          </div>

          {/* Origin Selection */}
          <div>
            <label className="text-sm text-slate-400 block mb-2">Partida de:</label>
            <select
              value={selectedOrigin}
              onChange={(e) => setSelectedOrigin(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700/50 rounded-xl p-3 text-white outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="">Seleciona a cidade de partida...</option>
              {origins.map((origin) => (
                <option key={origin.id} value={origin.id}>
                  {origin.name}
                </option>
              ))}
            </select>
          </div>

          {/* Booking Buttons */}
          <div className="grid grid-cols-1 gap-2">
            {/* Flights */}
            <a
              href={bookingUrls.flights || "#"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!bookingUrls.flights || !selectedOrigin) {
                  e.preventDefault();
                  alert("Seleciona a cidade de partida primeiro!");
                }
              }}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                bookingUrls.flights && selectedOrigin
                  ? "bg-blue-600 hover:bg-blue-500 text-white"
                  : "bg-slate-700/50 text-slate-400 cursor-not-allowed"
              }`}
            >
              <div className="flex items-center gap-2">
                <span>✈️</span>
                <span className="font-medium">Pesquisar Voos</span>
              </div>
              <span className="text-sm opacity-75">Skyscanner →</span>
            </a>

            {/* Hotels */}
            <a
              href={bookingUrls.hotels}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white transition-all"
            >
              <div className="flex items-center gap-2">
                <span>🏨</span>
                <span className="font-medium">Pesquisar Hotéis</span>
              </div>
              <span className="text-sm opacity-75">Booking.com →</span>
            </a>

            {/* Car Rental */}
            <a
              href={bookingUrls.carRental}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all"
            >
              <div className="flex items-center gap-2">
                <span>🚗</span>
                <span className="font-medium">Alugar Carro</span>
              </div>
              <span className="text-sm opacity-75">Rentalcars →</span>
            </a>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-slate-500 text-center pt-2">
            💡 Os links abrem pesquisas pré-preenchidas. Confirma sempre os detalhes antes de reservar.
          </p>
        </div>
      )}
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const day = date.getDate();
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const month = months[date.getMonth()];
  return `${day} ${month}`;
}
