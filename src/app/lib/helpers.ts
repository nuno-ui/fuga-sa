import type { Factor, Destination } from "./types";

export function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function flightCost(km: number): number {
  if (km < 500) return 60;
  if (km < 1500) return 50 + km * 0.05;
  if (km < 3000) return 80 + km * 0.05;
  return 120 + km * 0.04;
}

export function getBadge(p: number) {
  if (p >= 8) return { text: "🔥 Confirmadíssimo!", cl: "text-emerald-400" };
  if (p >= 6) return { text: "💪 Muito provável", cl: "text-green-400" };
  if (p >= 4) return { text: "🤞 Talvez...", cl: "text-amber-400" };
  if (p >= 2) return { text: "😬 Improvável", cl: "text-orange-400" };
  return { text: "❌ Não vai dar", cl: "text-red-400" };
}

export function generateCalDates(start: string, end: string): string[] {
  const dates: string[] = [];
  const d = new Date(start + "T12:00:00");
  const endD = new Date(end + "T12:00:00");
  while (d <= endD) {
    dates.push(d.toISOString().split("T")[0]);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

export function dayOfWeek(ds: string): number {
  return new Date(ds + "T12:00:00").getDay();
}

export function dayNum(ds: string): number {
  return parseInt(ds.split("-")[2]);
}

export function monthLabel(ds: string): string {
  const m = parseInt(ds.split("-")[1]);
  const names = ["", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return names[m] || "";
}

export function calcScore(ud: any, dest: Destination, factors: Factor[]): number {
  if (!ud?.priorities?.length) return 0;
  let s = 0;
  ud.priorities.forEach((fid: string, idx: number) => {
    const f = factors.find((x) => x.id === fid);
    if (!f) return;
    const w = 5 - idx;
    const dv = (dest.attrs as any)[f.attr_key] || 0;
    const up = ud.quizAttrs?.[f.attr_key] || 0;
    const m = up > 0 ? 1.5 : up < 0 ? 0.5 : 1;
    s += w * dv * m;
  });
  if (ud.elo?.[dest.id]) s += (ud.elo[dest.id] - 1500) / 50;
  return s;
}

export function bestWindows(allData: Record<string, any>, calDates: string[], size: number) {
  const wins: { start: string; end: string; score: number }[] = [];
  for (let i = 0; i <= calDates.length - size; i++) {
    const dates = calDates.slice(i, i + size);
    let sc = 0;
    dates.forEach((d) => {
      Object.values(allData).forEach((u: any) => {
        if (u?.calendar?.[d] === "available") sc += 2;
        else if (u?.calendar?.[d] === "tentative") sc += 1;
      });
    });
    wins.push({ start: dates[0], end: dates[dates.length - 1], score: sc });
  }
  wins.sort((a, b) => b.score - a.score);
  return wins.slice(0, 3);
}
