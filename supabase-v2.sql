-- ==========================================
-- Fuga, SA v2 — Full Database Setup
-- ==========================================
-- Run this ENTIRE script in Supabase SQL Editor
-- (Dashboard → SQL Editor → New query → Paste → Run)
-- ==========================================

-- ─── 1. TABLES ──────────────────────────────

-- Groups (each trip planning group)
CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  cal_start DATE NOT NULL DEFAULT '2026-04-24',
  cal_end DATE NOT NULL DEFAULT '2026-05-08',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Members (people in each group)
CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_order INT DEFAULT 0
);

-- Origins (departure cities — shared across all groups)
CREATE TABLE IF NOT EXISTS origins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  lat FLOAT NOT NULL,
  lon FLOAT NOT NULL,
  display_order INT DEFAULT 0
);

-- Destinations (travel destinations — shared across all groups)
CREATE TABLE IF NOT EXISTS destinations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  flag TEXT DEFAULT '🏳️',
  category TEXT DEFAULT 'Outro',
  description TEXT,
  image_url TEXT,
  attrs JSONB DEFAULT '{}',
  cost_low INT DEFAULT 30,
  cost_med INT DEFAULT 70,
  cost_high INT DEFAULT 150,
  food_per_day INT DEFAULT 25,
  temp_may INT DEFAULT 20,
  rain_days INT DEFAULT 5,
  lat FLOAT NOT NULL,
  lon FLOAT NOT NULL,
  active BOOLEAN DEFAULT true
);

-- Quiz questions (shared across all groups)
CREATE TABLE IF NOT EXISTS quiz_questions (
  id TEXT PRIMARY KEY,
  emoji TEXT DEFAULT '❓',
  question TEXT NOT NULL,
  display_order INT DEFAULT 0
);

-- Quiz options (choices for each question)
CREATE TABLE IF NOT EXISTS quiz_options (
  id TEXT PRIMARY KEY,
  question_id TEXT NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  attrs JSONB DEFAULT '{}',
  display_order INT DEFAULT 0
);

-- Factors (priority ranking factors — shared)
CREATE TABLE IF NOT EXISTS factors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '⭐',
  attr_key TEXT NOT NULL,
  display_order INT DEFAULT 0
);

-- Member data (responses per member)
CREATE TABLE IF NOT EXISTS member_data (
  member_id UUID PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  pin TEXT,
  data JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── 2. ROW LEVEL SECURITY ────────────────

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE origins ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_data ENABLE ROW LEVEL SECURITY;

-- Open policies (friend group app, no auth needed)
CREATE POLICY "public_read_groups" ON groups FOR SELECT USING (true);
CREATE POLICY "public_read_members" ON members FOR SELECT USING (true);
CREATE POLICY "public_read_origins" ON origins FOR SELECT USING (true);
CREATE POLICY "public_read_destinations" ON destinations FOR SELECT USING (true);
CREATE POLICY "public_read_quiz_q" ON quiz_questions FOR SELECT USING (true);
CREATE POLICY "public_read_quiz_o" ON quiz_options FOR SELECT USING (true);
CREATE POLICY "public_read_factors" ON factors FOR SELECT USING (true);
CREATE POLICY "public_all_member_data" ON member_data FOR ALL USING (true);
CREATE POLICY "public_insert_member_data" ON member_data FOR INSERT WITH CHECK (true);

-- ─── 3. AUTO-UPDATE TIMESTAMP ─────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS member_data_updated_at ON member_data;
CREATE TRIGGER member_data_updated_at
  BEFORE UPDATE ON member_data
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ─── 4. REALTIME ──────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE member_data;

-- ─── 5. SEED: GROUP ──────────────────────

INSERT INTO groups (id, name, slug, description, cal_start, cal_end) VALUES
  ('fuga2026', 'Fuga, SA', 'fuga2026', 'A viagem épica do grupo — Maio 2026', '2026-04-24', '2026-05-08')
ON CONFLICT (id) DO NOTHING;

-- ─── 6. SEED: MEMBERS ───────────────────

INSERT INTO members (id, group_id, name, display_order) VALUES
  ('11111111-0000-0000-0000-000000000001', 'fuga2026', 'Nuno Santos', 0),
  ('11111111-0000-0000-0000-000000000002', 'fuga2026', 'Pedro Ribeiro', 1),
  ('11111111-0000-0000-0000-000000000003', 'fuga2026', 'Pedro Correia', 2),
  ('11111111-0000-0000-0000-000000000004', 'fuga2026', 'Filipe Robalo', 3),
  ('11111111-0000-0000-0000-000000000005', 'fuga2026', 'Bruno Lionel', 4),
  ('11111111-0000-0000-0000-000000000006', 'fuga2026', 'Albano Carvalhal', 5),
  ('11111111-0000-0000-0000-000000000007', 'fuga2026', 'João Pinhas', 6),
  ('11111111-0000-0000-0000-000000000008', 'fuga2026', 'Henrique Nunes', 7)
ON CONFLICT (id) DO NOTHING;

-- Seed empty member_data rows
INSERT INTO member_data (member_id) VALUES
  ('11111111-0000-0000-0000-000000000001'),
  ('11111111-0000-0000-0000-000000000002'),
  ('11111111-0000-0000-0000-000000000003'),
  ('11111111-0000-0000-0000-000000000004'),
  ('11111111-0000-0000-0000-000000000005'),
  ('11111111-0000-0000-0000-000000000006'),
  ('11111111-0000-0000-0000-000000000007'),
  ('11111111-0000-0000-0000-000000000008')
ON CONFLICT (member_id) DO NOTHING;

-- ─── 7. SEED: ORIGINS ───────────────────

INSERT INTO origins (id, name, lat, lon, display_order) VALUES
  ('lisboa',     'Lisboa',      38.72,  -9.14,  0),
  ('evora',      'Évora',       38.57,  -7.91,  1),
  ('porto',      'Porto',       41.16,  -8.63,  2),
  ('amsterdam',  'Amesterdão',  52.37,   4.90,  3),
  ('rotterdam',  'Roterdão',    51.92,   4.48,  4),
  ('haia',       'Haia',        52.07,   4.30,  5),
  ('utrecht',    'Utrecht',     52.09,   5.12,  6),
  ('eindhoven',  'Eindhoven',   51.44,   5.47,  7),
  ('groningen',  'Groningen',   53.22,   6.57,  8),
  ('copenhagen', 'Copenhaga',   55.68,  12.57,  9),
  ('bangkok',    'Bangkok',     13.76, 100.50, 10),
  ('london',     'Londres',     51.51,  -0.13, 11),
  ('paris',      'Paris',       48.86,   2.35, 12),
  ('berlin',     'Berlim',      52.52,  13.41, 13),
  ('madrid',     'Madrid',      40.42,  -3.70, 14)
ON CONFLICT (id) DO NOTHING;

-- ─── 8. SEED: DESTINATIONS ──────────────

INSERT INTO destinations (id, name, country, flag, category, description, image_url, attrs, cost_low, cost_med, cost_high, food_per_day, temp_may, rain_days, lat, lon) VALUES
  ('cancun',       'Cancún',            'México',        '🇲🇽', 'Exótico',  'Praias de sonho, tequila e ruínas maias',            'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800&h=500&fit=crop&q=80',   '{"beach":5,"night":5,"nature":2,"culture":2,"warm":5,"budget":2,"travel":1,"liberal":4,"food":3}', 50, 100, 200, 30, 29, 5, 21.16, -86.85),
  ('sal',          'Sal',               'Cabo Verde',    '🇨🇻', 'Exótico',  'Santa Maria, kitesurf e morabeza pura',              'https://images.unsplash.com/photo-1590523278191-995b72f1a022?w=800&h=500&fit=crop&q=80',   '{"beach":5,"night":2,"nature":2,"culture":1,"warm":5,"budget":3,"travel":3,"liberal":2,"food":2}', 35, 70, 130, 20, 25, 0, 16.73, -22.93),
  ('istanbul',     'Istambul',          'Turquia',       '🇹🇷', 'Exótico',  'Europa encontra Ásia — bazares, kebabs e mesquitas', 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&h=500&fit=crop&q=80',   '{"beach":1,"night":3,"nature":1,"culture":5,"warm":3,"budget":4,"travel":3,"liberal":2,"food":5}', 25, 60, 120, 15, 17, 6, 41.01, 28.98),
  ('havana',       'Havana',            'Cuba',          '🇨🇺', 'Exótico',  'Carros antigos, mojitos, salsa e vibes retro',       'https://images.unsplash.com/photo-1500759285222-a95626b934cb?w=800&h=500&fit=crop&q=80',   '{"beach":3,"night":4,"nature":1,"culture":4,"warm":5,"budget":3,"travel":1,"liberal":3,"food":3}', 30, 60, 100, 15, 28, 7, 23.11, -82.37),
  ('marrakech',    'Marrakech',         'Marrocos',      '🇲🇦', 'Exótico',  'Souks loucos, riads de sonho e tajine',              'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=800&h=500&fit=crop&q=80',   '{"beach":0,"night":2,"nature":2,"culture":5,"warm":4,"budget":4,"travel":4,"liberal":1,"food":4}', 20, 50, 120, 12, 26, 3, 31.63, -8.0),
  ('bangkok-d',    'Bangkok',           'Tailândia',     '🇹🇭', 'Exótico',  'Street food épica, templos e noites loucas',         'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&h=500&fit=crop&q=80',   '{"beach":1,"night":5,"nature":1,"culture":4,"warm":5,"budget":5,"travel":0,"liberal":4,"food":5}', 15, 40, 100, 10, 35, 10, 13.76, 100.50),
  ('cdmx',         'Cidade do México',  'México',        '🇲🇽', 'Exótico',  'Tacos al pastor, cultura insana e altitude',         'https://images.unsplash.com/photo-1518659526054-190340b32735?w=800&h=500&fit=crop&q=80',   '{"beach":0,"night":4,"nature":1,"culture":5,"warm":3,"budget":4,"travel":1,"liberal":3,"food":5}', 30, 70, 150, 20, 22, 5, 19.43, -99.13),
  ('spb',          'S. Petersburgo',    'Rússia',        '🇷🇺', 'Exótico',  'Palácios imperiais e noites brancas',                'https://images.unsplash.com/photo-1556610961-2fecc5927173?w=800&h=500&fit=crop&q=80',   '{"beach":0,"night":3,"nature":1,"culture":5,"warm":1,"budget":3,"travel":2,"liberal":1,"food":3}', 30, 70, 150, 20, 12, 8, 59.93, 30.32),
  ('madeira',      'Madeira',           'Portugal',      '🇵🇹', 'Ilha',     'Levadas, poncha e vistas de tirar o fôlego',         'https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?w=800&h=500&fit=crop&q=80',   '{"beach":2,"night":1,"nature":5,"culture":2,"warm":3,"budget":3,"travel":4,"liberal":2,"food":4}', 30, 60, 120, 20, 19, 5, 32.65, -16.91),
  ('acores',       'Açores',            'Portugal',      '🇵🇹', 'Ilha',     'Lagoas vulcânicas e cozido das furnas',              'https://images.unsplash.com/photo-1570439521142-625c0605549e?w=800&h=500&fit=crop&q=80',   '{"beach":2,"night":0,"nature":5,"culture":1,"warm":2,"budget":3,"travel":4,"liberal":1,"food":3}', 25, 55, 110, 18, 17, 10, 37.74, -25.68),
  ('tenerife',     'Tenerife',          'Espanha',       '🇪🇸', 'Ilha',     'Teide, praias negras e sol garantido',               'https://images.unsplash.com/photo-1540202404-a2f29016b523?w=800&h=500&fit=crop&q=80',   '{"beach":4,"night":3,"nature":3,"culture":1,"warm":5,"budget":3,"travel":4,"liberal":3,"food":2}', 35, 70, 140, 22, 22, 2, 28.29, -16.63),
  ('creta',        'Creta',             'Grécia',        '🇬🇷', 'Ilha',     'Praias turquesa, ruínas minoicas e souvlaki',        'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=800&h=500&fit=crop&q=80',   '{"beach":5,"night":2,"nature":3,"culture":4,"warm":4,"budget":3,"travel":3,"liberal":2,"food":4}', 35, 70, 140, 20, 22, 2, 35.24, 24.47),
  ('mykonos',      'Mykonos',           'Grécia',        '🇬🇷', 'Ilha',     'A ilha da festa — casas brancas e pool parties',     'https://images.unsplash.com/photo-1601581875309-fafbf2d3ed3a?w=800&h=500&fit=crop&q=80',   '{"beach":4,"night":5,"nature":1,"culture":2,"warm":4,"budget":1,"travel":3,"liberal":5,"food":3}', 60, 130, 300, 35, 20, 2, 37.45, 25.33),
  ('sardegna',     'Sardenha',          'Itália',        '🇮🇹', 'Ilha',     'Costa Smeralda, praias cinema e pasta',              'https://images.unsplash.com/photo-1586500036706-41963de24d8b?w=800&h=500&fit=crop&q=80',   '{"beach":5,"night":2,"nature":3,"culture":2,"warm":4,"budget":2,"travel":3,"liberal":2,"food":5}', 45, 90, 200, 30, 20, 4, 40.12, 9.01),
  ('malta',        'Malta',             'Malta',         '🇲🇹', 'Ilha',     'Templos antigos, gruta azul e nightlife',            'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=800&h=500&fit=crop&q=80',   '{"beach":3,"night":4,"nature":1,"culture":3,"warm":4,"budget":3,"travel":3,"liberal":3,"food":3}', 30, 65, 130, 22, 21, 2, 35.94, 14.38),
  ('london-d',     'Londres',           'Reino Unido',   '🇬🇧', 'Capital',  'Pubs, museus grátis e Camden Town',                  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=500&fit=crop&q=80',   '{"beach":0,"night":4,"nature":1,"culture":5,"warm":1,"budget":1,"travel":4,"liberal":4,"food":3}', 50, 110, 250, 35, 14, 8, 51.51, -0.13),
  ('paris-d',      'Paris',             'França',        '🇫🇷', 'Capital',  'Croissants, Eiffel e aquele charme francês',         'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=500&fit=crop&q=80',   '{"beach":0,"night":3,"nature":1,"culture":5,"warm":2,"budget":1,"travel":4,"liberal":3,"food":5}', 50, 120, 280, 35, 15, 7, 48.86, 2.35),
  ('berlin-d',     'Berlim',            'Alemanha',      '🇩🇪', 'Capital',  'Techno, kebabs a 3€ e arte urbana insana',           'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=800&h=500&fit=crop&q=80',   '{"beach":0,"night":5,"nature":1,"culture":4,"warm":2,"budget":4,"travel":4,"liberal":5,"food":3}', 25, 60, 130, 20, 14, 6, 52.52, 13.41),
  ('amsterdam-d',  'Amesterdão',        'Holanda',       '🇳🇱', 'Capital',  'Canais, coffeeshops, Rijks e bicicletas',            'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=800&h=500&fit=crop&q=80',   '{"beach":0,"night":4,"nature":1,"culture":4,"warm":2,"budget":2,"travel":4,"liberal":5,"food":3}', 40, 90, 200, 30, 13, 8, 52.37, 4.90),
  ('copenhagen-d', 'Copenhaga',         'Dinamarca',     '🇩🇰', 'Capital',  'Noma, Christiania e hygge escandinavo',              'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=800&h=500&fit=crop&q=80',   '{"beach":0,"night":3,"nature":1,"culture":4,"warm":1,"budget":1,"travel":4,"liberal":4,"food":5}', 50, 110, 240, 40, 12, 7, 55.68, 12.57),
  ('vienna',       'Viena',             'Áustria',       '🇦🇹', 'Capital',  'Schnitzel, ópera e cafés centenários',               'https://images.unsplash.com/photo-1516550893923-42d28e5677af?w=800&h=500&fit=crop&q=80',   '{"beach":0,"night":2,"nature":2,"culture":5,"warm":2,"budget":2,"travel":4,"liberal":2,"food":4}', 35, 80, 180, 28, 16, 7, 48.21, 16.37),
  ('prague',       'Praga',             'Chéquia',       '🇨🇿', 'Capital',  'Cerveja mais barata que água e baladas épicas',      'https://images.unsplash.com/photo-1519677100203-a0e668c92439?w=800&h=500&fit=crop&q=80',   '{"beach":0,"night":5,"nature":1,"culture":4,"warm":2,"budget":5,"travel":4,"liberal":4,"food":3}', 20, 50, 120, 15, 14, 7, 50.08, 14.44),
  ('budapest',     'Budapeste',         'Hungria',       '🇭🇺', 'Capital',  'Ruin bars, banhos termais e gulash',                 'https://images.unsplash.com/photo-1551867633-194f125bddfa?w=800&h=500&fit=crop&q=80',   '{"beach":0,"night":5,"nature":1,"culture":4,"warm":3,"budget":5,"travel":4,"liberal":3,"food":4}', 18, 45, 110, 12, 17, 7, 47.50, 19.04),
  ('rome',         'Roma',              'Itália',        '🇮🇹', 'Capital',  'Coliseu, carbonara, gelato e caos organizado',       'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&h=500&fit=crop&q=80',   '{"beach":0,"night":3,"nature":1,"culture":5,"warm":4,"budget":2,"travel":4,"liberal":2,"food":5}', 40, 90, 200, 28, 20, 5, 41.90, 12.50),
  ('athens',       'Atenas',            'Grécia',        '🇬🇷', 'Capital',  'Acrópole, souvlaki e rooftop bars',                  'https://images.unsplash.com/photo-1555993539-1732b0258235?w=800&h=500&fit=crop&q=80',   '{"beach":2,"night":4,"nature":1,"culture":5,"warm":4,"budget":3,"travel":3,"liberal":3,"food":4}', 30, 65, 140, 20, 22, 4, 37.98, 23.73),
  ('ibiza',        'Ibiza',             'Espanha',       '🇪🇸', 'Espanha',  'Capital mundial da festa — DJs e sunsets',           'https://images.unsplash.com/photo-1573455494060-c5595004fb6c?w=800&h=500&fit=crop&q=80',   '{"beach":4,"night":5,"nature":1,"culture":0,"warm":4,"budget":1,"travel":4,"liberal":5,"food":2}', 50, 120, 300, 35, 20, 3, 38.91, 1.43),
  ('mallorca',     'Mallorca',          'Espanha',       '🇪🇸', 'Espanha',  'Praias, Tramuntana e paella com vista',              'https://images.unsplash.com/photo-1578922746465-3a80a228f223?w=800&h=500&fit=crop&q=80',   '{"beach":5,"night":3,"nature":3,"culture":2,"warm":4,"budget":2,"travel":4,"liberal":3,"food":3}', 40, 85, 180, 25, 20, 4, 39.57, 2.65),
  ('menorca',      'Menorca',           'Espanha',       '🇪🇸', 'Espanha',  'Calas secretas e gin xoriguer',                      'https://images.unsplash.com/photo-1616432043562-3671ea2e5242?w=800&h=500&fit=crop&q=80',   '{"beach":5,"night":1,"nature":4,"culture":1,"warm":4,"budget":2,"travel":4,"liberal":2,"food":3}', 40, 80, 170, 25, 19, 4, 39.95, 4.11),
  ('barcelona',    'Barcelona',         'Espanha',       '🇪🇸', 'Espanha',  'Gaudí, tapas, Barceloneta e La Rambla',             'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&h=500&fit=crop&q=80',   '{"beach":3,"night":5,"nature":1,"culture":5,"warm":4,"budget":2,"travel":5,"liberal":4,"food":5}', 40, 90, 200, 28, 18, 5, 41.39, 2.17),
  ('valencia',     'Valência',          'Espanha',       '🇪🇸', 'Espanha',  'Paella original e Cidade das Artes',                'https://images.unsplash.com/photo-1599832254916-59cf5c1bb812?w=800&h=500&fit=crop&q=80',   '{"beach":3,"night":3,"nature":1,"culture":3,"warm":4,"budget":3,"travel":5,"liberal":3,"food":5}', 30, 65, 140, 22, 20, 3, 39.47, -0.38),
  ('sevilla',      'Sevilha',           'Espanha',       '🇪🇸', 'Espanha',  'Flamenco, tapas e Alcázar de sonho',                'https://images.unsplash.com/photo-1515443961218-a51367888e4b?w=800&h=500&fit=crop&q=80',   '{"beach":0,"night":3,"nature":1,"culture":5,"warm":5,"budget":3,"travel":5,"liberal":2,"food":5}', 28, 60, 130, 20, 24, 3, 37.39, -5.98),
  ('madrid-d',     'Madrid',            'Espanha',       '🇪🇸', 'Espanha',  'Prado, Retiro, cañas e noites infinitas',           'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=800&h=500&fit=crop&q=80',   '{"beach":0,"night":4,"nature":1,"culture":4,"warm":4,"budget":3,"travel":5,"liberal":3,"food":4}', 35, 75, 170, 25, 19, 5, 40.42, -3.70),
  ('granada',      'Granada',           'Espanha',       '🇪🇸', 'Espanha',  'Alhambra, Sierra Nevada e tapas grátis',            'https://images.unsplash.com/photo-1526392060635-9d6019884377?w=800&h=500&fit=crop&q=80',   '{"beach":0,"night":2,"nature":3,"culture":5,"warm":4,"budget":4,"travel":4,"liberal":2,"food":4}', 25, 55, 120, 18, 20, 4, 37.18, -3.60),
  ('san-seb',      'San Sebastián',     'Espanha',       '🇪🇸', 'Espanha',  'Capital dos pintxos — La Concha é épica',            'https://images.unsplash.com/photo-1504019347908-b45f9b0b8dd5?w=800&h=500&fit=crop&q=80',   '{"beach":3,"night":2,"nature":2,"culture":3,"warm":2,"budget":1,"travel":4,"liberal":2,"food":5}', 45, 95, 200, 35, 15, 10, 43.32, -1.98),
  ('fuerte',       'Fuerteventura',     'Espanha',       '🇪🇸', 'Espanha',  'Dunas, surf e praias infinitas',                    'https://images.unsplash.com/photo-1559060634-e63205af4703?w=800&h=500&fit=crop&q=80',   '{"beach":5,"night":1,"nature":3,"culture":0,"warm":5,"budget":3,"travel":4,"liberal":2,"food":2}', 30, 60, 120, 20, 22, 1, 28.36, -14.05)
ON CONFLICT (id) DO NOTHING;

-- ─── 9. SEED: FACTORS ───────────────────

INSERT INTO factors (id, name, emoji, attr_key, display_order) VALUES
  ('beach',   'Praia',         '🏖️', 'beach',   0),
  ('nature',  'Natureza',      '🌲', 'nature',  1),
  ('culture', 'Cultura',       '🏛️', 'culture', 2),
  ('night',   'Nightlife',     '🎉', 'night',   3),
  ('warm',    'Calor/Sol',     '☀️', 'warm',    4),
  ('budget',  'Preço baixo',   '💰', 'budget',  5),
  ('travel',  'Viagem curta',  '✈️', 'travel',  6),
  ('liberal', 'Vibe liberal',  '🌿', 'liberal', 7),
  ('food',    'Gastronomia',   '🍽️', 'food',    8)
ON CONFLICT (id) DO NOTHING;

-- ─── 10. SEED: QUIZ QUESTIONS ───────────

INSERT INTO quiz_questions (id, emoji, question, display_order) VALUES
  ('q1',  '🏠', 'Onde queres dormir?',           0),
  ('q2',  '🌙', 'A noite ideal de férias?',      1),
  ('q3',  '🏖️', 'Praia é importante?',           2),
  ('q4',  '🌡️', 'Clima ideal para maio?',        3),
  ('q5',  '🏛️', 'Cultura e museus?',              4),
  ('q6',  '🌲', 'Natureza e trilhos?',            5),
  ('q7',  '✈️', 'Tempo de voo?',                  6),
  ('q8',  '💰', 'Budget da viagem?',              7),
  ('q9',  '🍽️', 'Como comes em viagem?',          8),
  ('q10', '🌿', 'Vibe liberal do destino?',       9),
  ('q11', '👥', 'Atividades em grupo?',          10),
  ('q12', '🏊', 'Piscina/SPA no alojamento?',   11)
ON CONFLICT (id) DO NOTHING;

-- ─── 11. SEED: QUIZ OPTIONS ─────────────

INSERT INTO quiz_options (id, question_id, text, attrs, display_order) VALUES
  -- Q1
  ('q1a', 'q1', '🛏️ Hostel barato — conhecer gente',    '{"budget":3,"night":1}',    0),
  ('q1b', 'q1', '🏨 Hotel 3-4★ com conforto',            '{"budget":0}',              1),
  ('q1c', 'q1', '🏡 Villa/casa épica para o grupo',      '{"budget":-1}',             2),
  -- Q2
  ('q2a', 'q2', '🎉 Discoteca até às 6h da manhã!',      '{"night":3,"liberal":1}',   0),
  ('q2b', 'q2', '🍻 Bar/rooftop com copos e conversa',    '{"night":1}',               1),
  ('q2c', 'q2', '😴 Jantar porreiro e cama cedo',        '{"night":-2}',              2),
  -- Q3
  ('q3a', 'q3', '🏝️ SIM! Não vou sem praia',             '{"beach":3,"warm":1}',      0),
  ('q3b', 'q3', '🌅 Nice to have, não obrigatório',      '{"beach":1}',               1),
  ('q3c', 'q3', '🏙️ Prefiro cidade, praia é overrated',  '{"beach":-2}',              2),
  -- Q4
  ('q4a', 'q4', '☀️ Calor! 25°C+ obrigatório',           '{"warm":3}',                0),
  ('q4b', 'q4', '🌤️ Ameno está ótimo (15-25°C)',         '{"warm":0}',                1),
  ('q4c', 'q4', '🌧️ Tanto faz, não vou pelo tempo',      '{"warm":-1}',               2),
  -- Q5
  ('q5a', 'q5', '🎨 Adoro! Quanto mais melhor',           '{"culture":3}',             0),
  ('q5b', 'q5', '📸 Um ou dois está perfeito',            '{"culture":1}',             1),
  ('q5c', 'q5', '🏃 Passo à frente, aborrece-me',        '{"culture":-1}',            2),
  -- Q6
  ('q6a', 'q6', '🥾 Bora! Adoro hiking e vistas',        '{"nature":3}',              0),
  ('q6b', 'q6', '🌅 Vistas bonitas sim, trilhos não',     '{"nature":1}',              1),
  ('q6c', 'q6', '🛋️ A natureza vê-se do hotel',          '{"nature":-1}',             2),
  -- Q7
  ('q7a', 'q7', '⚡ Máximo 2-3h, perto e rápido',        '{"travel":3}',              0),
  ('q7b', 'q7', '🛫 Até 5-6h está tranquilo',            '{"travel":1}',              1),
  ('q7c', 'q7', '🌍 Vou até ao fim do mundo!',            '{"travel":-2}',             2),
  -- Q8
  ('q8a', 'q8', '💸 Low-cost! Poupar ao máximo',          '{"budget":3}',              0),
  ('q8b', 'q8', '💵 Médio, com algum conforto',           '{"budget":0}',              1),
  ('q8c', 'q8', '💎 YOLO! Vamos gastar à grande',        '{"budget":-3}',             2),
  -- Q9
  ('q9a', 'q9', '🌮 Street food e mercados locais',       '{"food":2,"budget":1}',     0),
  ('q9b', 'q9', '🍝 Restaurantes típicos e bons',         '{"food":3}',                1),
  ('q9c', 'q9', '⭐ Fine dining e experiências gastro',   '{"food":4,"budget":-2}',    2),
  -- Q10
  ('q10a', 'q10', '🟢 Muito liberal/aberto — essencial',  '{"liberal":3}',             0),
  ('q10b', 'q10', '🟡 Nice to have, não é prioridade',    '{"liberal":1}',             1),
  ('q10c', 'q10', '⚪ Tanto faz, não me afeta',           '{"liberal":0}',             2),
  ('q10d', 'q10', '🔵 Prefiro destinos mais calmos',      '{"liberal":-2}',            3),
  -- Q11
  ('q11a', 'q11', '🤝 Sempre juntos, tudo em grupo!',     '{}',                        0),
  ('q11b', 'q11', '🔀 Misto — programa junto e à parte',  '{}',                        1),
  ('q11c', 'q11', '🚶 Liberdade total, cada um faz o seu','{}',                        2),
  -- Q12
  ('q12a', 'q12', '💯 Obrigatório! Deal breaker',         '{"beach":1,"budget":-1}',   0),
  ('q12b', 'q12', '👌 Nice to have mas dispensável',       '{}',                        1),
  ('q12c', 'q12', '🤷 Irrelevante para mim',              '{}',                        2)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- ✅ Done! All tables created and seeded.
-- ==========================================
-- 
-- You can now edit EVERYTHING in Supabase Table Editor:
--   • groups        → Add new trip groups
--   • members       → Add/remove people from groups
--   • destinations  → Edit cities, images, costs, attributes
--   • quiz_questions/quiz_options → Change quiz questions
--   • factors       → Edit priority ranking options
--   • origins       → Add departure cities
--
-- To add a NEW GROUP:
--   1. Insert into "groups" (pick a unique slug)
--   2. Insert members into "members" (link to group_id)
--   3. Insert member_data rows for each member
--   4. Share the URL: yoursite.com/YOUR-SLUG
-- ==========================================
