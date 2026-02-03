// ═══════════════════════════════════════════════════════════
// Fuga, SA — All Data Constants
// ═══════════════════════════════════════════════════════════

export const USERS = [
  { id: "nuno", name: "Nuno Santos" },
  { id: "pedro-r", name: "Pedro Ribeiro" },
  { id: "pedro-c", name: "Pedro Correia" },
  { id: "filipe", name: "Filipe Robalo" },
  { id: "bruno", name: "Bruno Lionel" },
  { id: "albano", name: "Albano Carvalhal" },
  { id: "joao", name: "João Pinhas" },
  { id: "henrique", name: "Henrique Nunes" },
];

export const AVATARS = [
  "🎯", "🔥", "⚡", "🎸", "🏄", "🎮", "🍺", "🦈",
  "🐉", "🎪", "🚀", "🌊", "🎭", "🏆", "🎲", "🌴",
  "🦁", "🐺", "🎵", "🍕",
];

export const ORIGINS = [
  { id: "lisboa", name: "Lisboa", lat: 38.72, lon: -9.14 },
  { id: "evora", name: "Évora", lat: 38.57, lon: -7.91 },
  { id: "porto", name: "Porto", lat: 41.16, lon: -8.63 },
  { id: "amsterdam", name: "Amesterdão", lat: 52.37, lon: 4.9 },
  { id: "rotterdam", name: "Roterdão", lat: 51.92, lon: 4.48 },
  { id: "haia", name: "Haia", lat: 52.07, lon: 4.3 },
  { id: "utrecht", name: "Utrecht", lat: 52.09, lon: 5.12 },
  { id: "eindhoven", name: "Eindhoven", lat: 51.44, lon: 5.47 },
  { id: "groningen", name: "Groningen", lat: 53.22, lon: 6.57 },
  { id: "copenhagen", name: "Copenhaga", lat: 55.68, lon: 12.57 },
  { id: "bangkok", name: "Bangkok", lat: 13.76, lon: 100.5 },
  { id: "london", name: "Londres", lat: 51.51, lon: -0.13 },
  { id: "paris", name: "Paris", lat: 48.86, lon: 2.35 },
  { id: "berlin", name: "Berlim", lat: 52.52, lon: 13.41 },
  { id: "madrid", name: "Madrid", lat: 40.42, lon: -3.7 },
];

export const CAL_DATES = (() => {
  const d: string[] = [];
  for (let i = 24; i <= 30; i++) d.push(`2026-04-${String(i).padStart(2, "0")}`);
  for (let i = 1; i <= 8; i++) d.push(`2026-05-${String(i).padStart(2, "0")}`);
  return d;
})();

export const DAYS_PT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const DESTINATIONS = [
  { id: "cancun", name: "Cancún", country: "México", flag: "🇲🇽", cat: "Exótico", desc: "Praias de sonho, tequila e ruínas maias", attrs: { beach: 5, night: 5, nature: 2, culture: 2, warm: 5, budget: 2, travel: 1, liberal: 4, food: 3 }, cost: [50, 100, 200], food: 30, temp: 29, rain: 5, lat: 21.16, lon: -86.85 },
  { id: "sal", name: "Sal", country: "Cabo Verde", flag: "🇨🇻", cat: "Exótico", desc: "Santa Maria, kitesurf e morabeza pura", attrs: { beach: 5, night: 2, nature: 2, culture: 1, warm: 5, budget: 3, travel: 3, liberal: 2, food: 2 }, cost: [35, 70, 130], food: 20, temp: 25, rain: 0, lat: 16.73, lon: -22.93 },
  { id: "istanbul", name: "Istambul", country: "Turquia", flag: "🇹🇷", cat: "Exótico", desc: "Europa encontra Ásia — bazares, kebabs e mesquitas", attrs: { beach: 1, night: 3, nature: 1, culture: 5, warm: 3, budget: 4, travel: 3, liberal: 2, food: 5 }, cost: [25, 60, 120], food: 15, temp: 17, rain: 6, lat: 41.01, lon: 28.98 },
  { id: "havana", name: "Havana", country: "Cuba", flag: "🇨🇺", cat: "Exótico", desc: "Carros antigos, mojitos, salsa e vibes retro", attrs: { beach: 3, night: 4, nature: 1, culture: 4, warm: 5, budget: 3, travel: 1, liberal: 3, food: 3 }, cost: [30, 60, 100], food: 15, temp: 28, rain: 7, lat: 23.11, lon: -82.37 },
  { id: "marrakech", name: "Marrakech", country: "Marrocos", flag: "🇲🇦", cat: "Exótico", desc: "Souks loucos, riads de sonho e tajine", attrs: { beach: 0, night: 2, nature: 2, culture: 5, warm: 4, budget: 4, travel: 4, liberal: 1, food: 4 }, cost: [20, 50, 120], food: 12, temp: 26, rain: 3, lat: 31.63, lon: -8.0 },
  { id: "bangkok-d", name: "Bangkok", country: "Tailândia", flag: "🇹🇭", cat: "Exótico", desc: "Street food épica, templos e noites loucas", attrs: { beach: 1, night: 5, nature: 1, culture: 4, warm: 5, budget: 5, travel: 0, liberal: 4, food: 5 }, cost: [15, 40, 100], food: 10, temp: 35, rain: 10, lat: 13.76, lon: 100.5 },
  { id: "cdmx", name: "Cidade do México", country: "México", flag: "🇲🇽", cat: "Exótico", desc: "Tacos al pastor, cultura insana e altitude", attrs: { beach: 0, night: 4, nature: 1, culture: 5, warm: 3, budget: 4, travel: 1, liberal: 3, food: 5 }, cost: [30, 70, 150], food: 20, temp: 22, rain: 5, lat: 19.43, lon: -99.13 },
  { id: "spb", name: "S. Petersburgo", country: "Rússia", flag: "🇷🇺", cat: "Exótico", desc: "Palácios imperiais e noites brancas", attrs: { beach: 0, night: 3, nature: 1, culture: 5, warm: 1, budget: 3, travel: 2, liberal: 1, food: 3 }, cost: [30, 70, 150], food: 20, temp: 12, rain: 8, lat: 59.93, lon: 30.32 },
  { id: "madeira", name: "Madeira", country: "Portugal", flag: "🇵🇹", cat: "Ilha", desc: "Levadas, poncha e vistas de tirar o fôlego", attrs: { beach: 2, night: 1, nature: 5, culture: 2, warm: 3, budget: 3, travel: 4, liberal: 2, food: 4 }, cost: [30, 60, 120], food: 20, temp: 19, rain: 5, lat: 32.65, lon: -16.91 },
  { id: "acores", name: "Açores", country: "Portugal", flag: "🇵🇹", cat: "Ilha", desc: "Lagoas vulcânicas e cozido das furnas", attrs: { beach: 2, night: 0, nature: 5, culture: 1, warm: 2, budget: 3, travel: 4, liberal: 1, food: 3 }, cost: [25, 55, 110], food: 18, temp: 17, rain: 10, lat: 37.74, lon: -25.68 },
  { id: "tenerife", name: "Tenerife", country: "Espanha", flag: "🇪🇸", cat: "Ilha", desc: "Teide, praias negras e sol garantido", attrs: { beach: 4, night: 3, nature: 3, culture: 1, warm: 5, budget: 3, travel: 4, liberal: 3, food: 2 }, cost: [35, 70, 140], food: 22, temp: 22, rain: 2, lat: 28.29, lon: -16.63 },
  { id: "creta", name: "Creta", country: "Grécia", flag: "🇬🇷", cat: "Ilha", desc: "Praias turquesa, ruínas minoicas e souvlaki", attrs: { beach: 5, night: 2, nature: 3, culture: 4, warm: 4, budget: 3, travel: 3, liberal: 2, food: 4 }, cost: [35, 70, 140], food: 20, temp: 22, rain: 2, lat: 35.24, lon: 24.47 },
  { id: "mykonos", name: "Mykonos", country: "Grécia", flag: "🇬🇷", cat: "Ilha", desc: "A ilha da festa — casas brancas e pool parties", attrs: { beach: 4, night: 5, nature: 1, culture: 2, warm: 4, budget: 1, travel: 3, liberal: 5, food: 3 }, cost: [60, 130, 300], food: 35, temp: 20, rain: 2, lat: 37.45, lon: 25.33 },
  { id: "sardegna", name: "Sardenha", country: "Itália", flag: "🇮🇹", cat: "Ilha", desc: "Costa Smeralda, praias cinema e pasta", attrs: { beach: 5, night: 2, nature: 3, culture: 2, warm: 4, budget: 2, travel: 3, liberal: 2, food: 5 }, cost: [45, 90, 200], food: 30, temp: 20, rain: 4, lat: 40.12, lon: 9.01 },
  { id: "malta", name: "Malta", country: "Malta", flag: "🇲🇹", cat: "Ilha", desc: "Templos antigos, gruta azul e nightlife", attrs: { beach: 3, night: 4, nature: 1, culture: 3, warm: 4, budget: 3, travel: 3, liberal: 3, food: 3 }, cost: [30, 65, 130], food: 22, temp: 21, rain: 2, lat: 35.94, lon: 14.38 },
  { id: "london-d", name: "Londres", country: "Reino Unido", flag: "🇬🇧", cat: "Capital", desc: "Pubs, museus grátis e Camden Town", attrs: { beach: 0, night: 4, nature: 1, culture: 5, warm: 1, budget: 1, travel: 4, liberal: 4, food: 3 }, cost: [50, 110, 250], food: 35, temp: 14, rain: 8, lat: 51.51, lon: -0.13 },
  { id: "paris-d", name: "Paris", country: "França", flag: "🇫🇷", cat: "Capital", desc: "Croissants, Eiffel e aquele charme francês", attrs: { beach: 0, night: 3, nature: 1, culture: 5, warm: 2, budget: 1, travel: 4, liberal: 3, food: 5 }, cost: [50, 120, 280], food: 35, temp: 15, rain: 7, lat: 48.86, lon: 2.35 },
  { id: "berlin-d", name: "Berlim", country: "Alemanha", flag: "🇩🇪", cat: "Capital", desc: "Techno, kebabs a 3€ e arte urbana insana", attrs: { beach: 0, night: 5, nature: 1, culture: 4, warm: 2, budget: 4, travel: 4, liberal: 5, food: 3 }, cost: [25, 60, 130], food: 20, temp: 14, rain: 6, lat: 52.52, lon: 13.41 },
  { id: "amsterdam-d", name: "Amesterdão", country: "Holanda", flag: "🇳🇱", cat: "Capital", desc: "Canais, coffeeshops, Rijks e bicicletas", attrs: { beach: 0, night: 4, nature: 1, culture: 4, warm: 2, budget: 2, travel: 4, liberal: 5, food: 3 }, cost: [40, 90, 200], food: 30, temp: 13, rain: 8, lat: 52.37, lon: 4.9 },
  { id: "copenhagen-d", name: "Copenhaga", country: "Dinamarca", flag: "🇩🇰", cat: "Capital", desc: "Noma, Christiania e hygge escandinavo", attrs: { beach: 0, night: 3, nature: 1, culture: 4, warm: 1, budget: 1, travel: 4, liberal: 4, food: 5 }, cost: [50, 110, 240], food: 40, temp: 12, rain: 7, lat: 55.68, lon: 12.57 },
  { id: "vienna", name: "Viena", country: "Áustria", flag: "🇦🇹", cat: "Capital", desc: "Schnitzel, ópera e cafés centenários", attrs: { beach: 0, night: 2, nature: 2, culture: 5, warm: 2, budget: 2, travel: 4, liberal: 2, food: 4 }, cost: [35, 80, 180], food: 28, temp: 16, rain: 7, lat: 48.21, lon: 16.37 },
  { id: "prague", name: "Praga", country: "Chéquia", flag: "🇨🇿", cat: "Capital", desc: "Cerveja mais barata que água e baladas épicas", attrs: { beach: 0, night: 5, nature: 1, culture: 4, warm: 2, budget: 5, travel: 4, liberal: 4, food: 3 }, cost: [20, 50, 120], food: 15, temp: 14, rain: 7, lat: 50.08, lon: 14.44 },
  { id: "budapest", name: "Budapeste", country: "Hungria", flag: "🇭🇺", cat: "Capital", desc: "Ruin bars, banhos termais e gulash", attrs: { beach: 0, night: 5, nature: 1, culture: 4, warm: 3, budget: 5, travel: 4, liberal: 3, food: 4 }, cost: [18, 45, 110], food: 12, temp: 17, rain: 7, lat: 47.5, lon: 19.04 },
  { id: "rome", name: "Roma", country: "Itália", flag: "🇮🇹", cat: "Capital", desc: "Coliseu, carbonara, gelato e caos organizado", attrs: { beach: 0, night: 3, nature: 1, culture: 5, warm: 4, budget: 2, travel: 4, liberal: 2, food: 5 }, cost: [40, 90, 200], food: 28, temp: 20, rain: 5, lat: 41.9, lon: 12.5 },
  { id: "athens", name: "Atenas", country: "Grécia", flag: "🇬🇷", cat: "Capital", desc: "Acrópole, souvlaki e rooftop bars", attrs: { beach: 2, night: 4, nature: 1, culture: 5, warm: 4, budget: 3, travel: 3, liberal: 3, food: 4 }, cost: [30, 65, 140], food: 20, temp: 22, rain: 4, lat: 37.98, lon: 23.73 },
  { id: "ibiza", name: "Ibiza", country: "Espanha", flag: "🇪🇸", cat: "Espanha", desc: "Capital mundial da festa — DJs e sunsets", attrs: { beach: 4, night: 5, nature: 1, culture: 0, warm: 4, budget: 1, travel: 4, liberal: 5, food: 2 }, cost: [50, 120, 300], food: 35, temp: 20, rain: 3, lat: 38.91, lon: 1.43 },
  { id: "mallorca", name: "Mallorca", country: "Espanha", flag: "🇪🇸", cat: "Espanha", desc: "Praias, Tramuntana e paella com vista", attrs: { beach: 5, night: 3, nature: 3, culture: 2, warm: 4, budget: 2, travel: 4, liberal: 3, food: 3 }, cost: [40, 85, 180], food: 25, temp: 20, rain: 4, lat: 39.57, lon: 2.65 },
  { id: "menorca", name: "Menorca", country: "Espanha", flag: "🇪🇸", cat: "Espanha", desc: "Calas secretas e gin xoriguer", attrs: { beach: 5, night: 1, nature: 4, culture: 1, warm: 4, budget: 2, travel: 4, liberal: 2, food: 3 }, cost: [40, 80, 170], food: 25, temp: 19, rain: 4, lat: 39.95, lon: 4.11 },
  { id: "barcelona", name: "Barcelona", country: "Espanha", flag: "🇪🇸", cat: "Espanha", desc: "Gaudí, tapas, Barceloneta e La Rambla", attrs: { beach: 3, night: 5, nature: 1, culture: 5, warm: 4, budget: 2, travel: 5, liberal: 4, food: 5 }, cost: [40, 90, 200], food: 28, temp: 18, rain: 5, lat: 41.39, lon: 2.17 },
  { id: "valencia", name: "Valência", country: "Espanha", flag: "🇪🇸", cat: "Espanha", desc: "Paella original e Cidade das Artes", attrs: { beach: 3, night: 3, nature: 1, culture: 3, warm: 4, budget: 3, travel: 5, liberal: 3, food: 5 }, cost: [30, 65, 140], food: 22, temp: 20, rain: 3, lat: 39.47, lon: -0.38 },
  { id: "sevilla", name: "Sevilha", country: "Espanha", flag: "🇪🇸", cat: "Espanha", desc: "Flamenco, tapas e Alcázar de sonho", attrs: { beach: 0, night: 3, nature: 1, culture: 5, warm: 5, budget: 3, travel: 5, liberal: 2, food: 5 }, cost: [28, 60, 130], food: 20, temp: 24, rain: 3, lat: 37.39, lon: -5.98 },
  { id: "madrid-d", name: "Madrid", country: "Espanha", flag: "🇪🇸", cat: "Espanha", desc: "Prado, Retiro, cañas e noites infinitas", attrs: { beach: 0, night: 4, nature: 1, culture: 4, warm: 4, budget: 3, travel: 5, liberal: 3, food: 4 }, cost: [35, 75, 170], food: 25, temp: 19, rain: 5, lat: 40.42, lon: -3.7 },
  { id: "granada", name: "Granada", country: "Espanha", flag: "🇪🇸", cat: "Espanha", desc: "Alhambra, Sierra Nevada e tapas grátis", attrs: { beach: 0, night: 2, nature: 3, culture: 5, warm: 4, budget: 4, travel: 4, liberal: 2, food: 4 }, cost: [25, 55, 120], food: 18, temp: 20, rain: 4, lat: 37.18, lon: -3.6 },
  { id: "san-seb", name: "San Sebastián", country: "Espanha", flag: "🇪🇸", cat: "Espanha", desc: "Capital dos pintxos — La Concha é épica", attrs: { beach: 3, night: 2, nature: 2, culture: 3, warm: 2, budget: 1, travel: 4, liberal: 2, food: 5 }, cost: [45, 95, 200], food: 35, temp: 15, rain: 10, lat: 43.32, lon: -1.98 },
  { id: "fuerte", name: "Fuerteventura", country: "Espanha", flag: "🇪🇸", cat: "Espanha", desc: "Dunas, surf e praias infinitas", attrs: { beach: 5, night: 1, nature: 3, culture: 0, warm: 5, budget: 3, travel: 4, liberal: 2, food: 2 }, cost: [30, 60, 120], food: 20, temp: 22, rain: 1, lat: 28.36, lon: -14.05 },
];

export const QUIZ = [
  { id: "q1", emoji: "🏠", q: "Onde queres dormir?", opts: [
    { id: "a", t: "🛏️ Hostel barato — conhecer gente", a: { budget: 3, night: 1 } },
    { id: "b", t: "🏨 Hotel 3-4★ com conforto", a: { budget: 0 } },
    { id: "c", t: "🏡 Villa/casa épica para o grupo", a: { budget: -1 } },
  ]},
  { id: "q2", emoji: "🌙", q: "A noite ideal de férias?", opts: [
    { id: "a", t: "🎉 Discoteca até às 6h da manhã!", a: { night: 3, liberal: 1 } },
    { id: "b", t: "🍻 Bar/rooftop com copos e conversa", a: { night: 1 } },
    { id: "c", t: "😴 Jantar porreiro e cama cedo", a: { night: -2 } },
  ]},
  { id: "q3", emoji: "🏖️", q: "Praia é importante?", opts: [
    { id: "a", t: "🏝️ SIM! Não vou sem praia", a: { beach: 3, warm: 1 } },
    { id: "b", t: "🌅 Nice to have, não obrigatório", a: { beach: 1 } },
    { id: "c", t: "🏙️ Prefiro cidade, praia é overrated", a: { beach: -2 } },
  ]},
  { id: "q4", emoji: "🌡️", q: "Clima ideal para maio?", opts: [
    { id: "a", t: "☀️ Calor! 25°C+ obrigatório", a: { warm: 3 } },
    { id: "b", t: "🌤️ Ameno está ótimo (15-25°C)", a: { warm: 0 } },
    { id: "c", t: "🌧️ Tanto faz, não vou pelo tempo", a: { warm: -1 } },
  ]},
  { id: "q5", emoji: "🏛️", q: "Cultura e museus?", opts: [
    { id: "a", t: "🎨 Adoro! Quanto mais melhor", a: { culture: 3 } },
    { id: "b", t: "📸 Um ou dois está perfeito", a: { culture: 1 } },
    { id: "c", t: "🏃 Passo à frente, aborrece-me", a: { culture: -1 } },
  ]},
  { id: "q6", emoji: "🌲", q: "Natureza e trilhos?", opts: [
    { id: "a", t: "🥾 Bora! Adoro hiking e vistas", a: { nature: 3 } },
    { id: "b", t: "🌅 Vistas bonitas sim, trilhos não", a: { nature: 1 } },
    { id: "c", t: "🛋️ A natureza vê-se do hotel", a: { nature: -1 } },
  ]},
  { id: "q7", emoji: "✈️", q: "Tempo de voo?", opts: [
    { id: "a", t: "⚡ Máximo 2-3h, perto e rápido", a: { travel: 3 } },
    { id: "b", t: "🛫 Até 5-6h está tranquilo", a: { travel: 1 } },
    { id: "c", t: "🌍 Vou até ao fim do mundo!", a: { travel: -2 } },
  ]},
  { id: "q8", emoji: "💰", q: "Budget da viagem?", opts: [
    { id: "a", t: "💸 Low-cost! Poupar ao máximo", a: { budget: 3 } },
    { id: "b", t: "💵 Médio, com algum conforto", a: { budget: 0 } },
    { id: "c", t: "💎 YOLO! Vamos gastar à grande", a: { budget: -3 } },
  ]},
  { id: "q9", emoji: "🍽️", q: "Como comes em viagem?", opts: [
    { id: "a", t: "🌮 Street food e mercados locais", a: { food: 2, budget: 1 } },
    { id: "b", t: "🍝 Restaurantes típicos e bons", a: { food: 3 } },
    { id: "c", t: "⭐ Fine dining e experiências gastro", a: { food: 4, budget: -2 } },
  ]},
  { id: "q10", emoji: "🌿", q: "Vibe liberal do destino?", opts: [
    { id: "a", t: "🟢 Muito liberal/aberto — essencial", a: { liberal: 3 } },
    { id: "b", t: "🟡 Nice to have, não é prioridade", a: { liberal: 1 } },
    { id: "c", t: "⚪ Tanto faz, não me afeta", a: { liberal: 0 } },
    { id: "d", t: "🔵 Prefiro destinos mais calmos", a: { liberal: -2 } },
  ]},
  { id: "q11", emoji: "👥", q: "Atividades em grupo?", opts: [
    { id: "a", t: "🤝 Sempre juntos, tudo em grupo!", a: {} },
    { id: "b", t: "🔀 Misto — programa junto e à parte", a: {} },
    { id: "c", t: "🚶 Liberdade total, cada um faz o seu", a: {} },
  ]},
  { id: "q12", emoji: "🏊", q: "Piscina/SPA no alojamento?", opts: [
    { id: "a", t: "💯 Obrigatório! Deal breaker", a: { beach: 1, budget: -1 } },
    { id: "b", t: "👌 Nice to have mas dispensável", a: {} },
    { id: "c", t: "🤷 Irrelevante para mim", a: {} },
  ]},
];

export const FACTORS = [
  { id: "beach", name: "🏖️ Praia", key: "beach" },
  { id: "nature", name: "🌲 Natureza", key: "nature" },
  { id: "culture", name: "🏛️ Cultura", key: "culture" },
  { id: "night", name: "🎉 Nightlife", key: "night" },
  { id: "warm", name: "☀️ Calor/Sol", key: "warm" },
  { id: "budget", name: "💰 Preço baixo", key: "budget" },
  { id: "travel", name: "✈️ Viagem curta", key: "travel" },
  { id: "liberal", name: "🌿 Vibe liberal", key: "liberal" },
  { id: "food", name: "🍽️ Gastronomia", key: "food" },
];
