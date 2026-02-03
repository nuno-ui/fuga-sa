-- ==========================================
-- Fuga, SA v3 — Multi-Tenant + 200 Destinations
-- ==========================================
-- Run this ENTIRE script in Supabase SQL Editor
-- (Dashboard -> SQL Editor -> New query -> Paste -> Run)
-- ==========================================

-- ─── 1. SCHEMA CHANGES ──────────────────────────────

-- Add admin fields to groups table
ALTER TABLE groups ADD COLUMN IF NOT EXISTS admin_password TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS admin_email TEXT;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- ─── 2. JUNCTION TABLES ──────────────────────────────

-- Group destinations - which destinations each group includes
CREATE TABLE IF NOT EXISTS group_destinations (
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  destination_id TEXT REFERENCES destinations(id) ON DELETE CASCADE,
  priority INT DEFAULT 0,
  PRIMARY KEY (group_id, destination_id)
);

-- Group factors - which factors each group uses
CREATE TABLE IF NOT EXISTS group_factors (
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  factor_id TEXT REFERENCES factors(id) ON DELETE CASCADE,
  display_order INT DEFAULT 0,
  PRIMARY KEY (group_id, factor_id)
);

-- Group quiz questions - which quiz questions each group uses
CREATE TABLE IF NOT EXISTS group_quiz_questions (
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  question_id TEXT REFERENCES quiz_questions(id) ON DELETE CASCADE,
  display_order INT DEFAULT 0,
  PRIMARY KEY (group_id, question_id)
);

-- ─── 3. RLS FOR JUNCTION TABLES ──────────────────────────────

ALTER TABLE group_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_factors ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_quiz_questions ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "public_read_group_destinations" ON group_destinations FOR SELECT USING (true);
CREATE POLICY "public_read_group_factors" ON group_factors FOR SELECT USING (true);
CREATE POLICY "public_read_group_quiz" ON group_quiz_questions FOR SELECT USING (true);

-- Insert/Update/Delete policies (will use service role key in API)
CREATE POLICY "service_insert_group_destinations" ON group_destinations FOR INSERT WITH CHECK (true);
CREATE POLICY "service_update_group_destinations" ON group_destinations FOR UPDATE USING (true);
CREATE POLICY "service_delete_group_destinations" ON group_destinations FOR DELETE USING (true);

CREATE POLICY "service_insert_group_factors" ON group_factors FOR INSERT WITH CHECK (true);
CREATE POLICY "service_update_group_factors" ON group_factors FOR UPDATE USING (true);
CREATE POLICY "service_delete_group_factors" ON group_factors FOR DELETE USING (true);

CREATE POLICY "service_insert_group_quiz" ON group_quiz_questions FOR INSERT WITH CHECK (true);
CREATE POLICY "service_update_group_quiz" ON group_quiz_questions FOR UPDATE USING (true);
CREATE POLICY "service_delete_group_quiz" ON group_quiz_questions FOR DELETE USING (true);

-- ─── 4. NEW DESTINATIONS (165+ new destinations) ──────────────────────────────

INSERT INTO destinations (id, name, country, flag, category, description, image_url, attrs, cost_low, cost_med, cost_high, food_per_day, temp_may, rain_days, lat, lon) VALUES
-- ═══ NORTHERN EUROPE ═══
('stockholm', 'Estocolmo', 'Suécia', '🇸🇪', 'Capital', 'Arquipélago, design nórdico e ABBA Museum', 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11?w=1200&h=750&fit=crop&q=85', '{"beach":1,"night":3,"nature":3,"culture":5,"warm":1,"budget":1,"travel":3,"liberal":5,"food":4}', 50, 110, 220, 40, 12, 7, 59.33, 18.07),
('oslo', 'Oslo', 'Noruega', '🇳🇴', 'Capital', 'Fiordes, museus vikings e natureza épica', 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":2,"nature":5,"culture":4,"warm":0,"budget":0,"travel":3,"liberal":5,"food":3}', 60, 130, 260, 45, 10, 8, 59.91, 10.75),
('helsinki', 'Helsínquia', 'Finlândia', '🇫🇮', 'Capital', 'Saunas, design e aurora boreal no inverno', 'https://images.unsplash.com/photo-1538332576228-eb5b4c4de6f5?w=1200&h=750&fit=crop&q=85', '{"beach":1,"night":2,"nature":3,"culture":4,"warm":0,"budget":1,"travel":3,"liberal":5,"food":3}', 50, 100, 200, 38, 10, 7, 60.17, 24.94),
('reykjavik', 'Reiquiavique', 'Islândia', '🇮🇸', 'Capital', 'Géiseres, cascatas e Blue Lagoon', 'https://images.unsplash.com/photo-1504893524553-b855bce32c67?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":2,"nature":5,"culture":2,"warm":0,"budget":0,"travel":3,"liberal":5,"food":3}', 70, 150, 300, 50, 8, 10, 64.15, -21.94),
('edinburgh', 'Edimburgo', 'Escócia', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Capital', 'Castelos, whisky e festivais de verão', 'https://images.unsplash.com/photo-1506377585622-bedcbb027afc?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":3,"nature":3,"culture":5,"warm":1,"budget":2,"travel":4,"liberal":4,"food":4}', 40, 90, 180, 32, 12, 9, 55.95, -3.19),
('dublin', 'Dublin', 'Irlanda', '🇮🇪', 'Capital', 'Pubs, Guinness e Temple Bar', 'https://images.unsplash.com/photo-1549918864-48ac978761a4?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":5,"nature":2,"culture":4,"warm":1,"budget":2,"travel":4,"liberal":4,"food":3}', 40, 95, 190, 35, 12, 10, 53.35, -6.26),
('glasgow', 'Glasgow', 'Escócia', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'Outro', 'Música ao vivo, arte e pubs autênticos', 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":4,"nature":2,"culture":4,"warm":1,"budget":3,"travel":4,"liberal":4,"food":3}', 35, 80, 160, 30, 12, 10, 55.86, -4.25),
('belfast', 'Belfast', 'Irlanda do Norte', '🇬🇧', 'Outro', 'Titanic Quarter e pubs históricos', 'https://images.unsplash.com/photo-1573155993874-d5d48af862ba?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":3,"nature":2,"culture":4,"warm":1,"budget":3,"travel":4,"liberal":3,"food":3}', 35, 75, 150, 28, 12, 10, 54.60, -5.93),
('bergen', 'Bergen', 'Noruega', '🇳🇴', 'Outro', 'Porta para os fiordes e casas coloridas', 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":1,"nature":5,"culture":3,"warm":0,"budget":0,"travel":3,"liberal":4,"food":3}', 55, 120, 240, 42, 11, 12, 60.39, 5.32),
('gothenburg', 'Gotemburgo', 'Suécia', '🇸🇪', 'Outro', 'Canais, Liseberg e frutos do mar', 'https://images.unsplash.com/photo-1578991624414-276ef23a534f?w=1200&h=750&fit=crop&q=85', '{"beach":1,"night":3,"nature":2,"culture":3,"warm":1,"budget":2,"travel":4,"liberal":5,"food":4}', 45, 95, 190, 35, 13, 8, 57.71, 11.97),
('malmo', 'Malmö', 'Suécia', '🇸🇪', 'Outro', 'Ponte para Copenhaga e vibes modernas', 'https://images.unsplash.com/photo-1594708767771-a7502209ff51?w=1200&h=750&fit=crop&q=85', '{"beach":1,"night":2,"nature":2,"culture":3,"warm":1,"budget":2,"travel":4,"liberal":5,"food":3}', 40, 85, 170, 32, 13, 7, 55.60, 13.00),
('tallinn', 'Tallinn', 'Estónia', '🇪🇪', 'Capital', 'Cidade medieval e startups tech', 'https://images.unsplash.com/photo-1560713781-d00f6c18f388?w=1200&h=750&fit=crop&q=85', '{"beach":1,"night":3,"nature":2,"culture":4,"warm":1,"budget":4,"travel":3,"liberal":4,"food":3}', 25, 55, 110, 20, 12, 7, 59.44, 24.75),
('riga', 'Riga', 'Letónia', '🇱🇻', 'Capital', 'Art Nouveau e vida noturna acessível', 'https://images.unsplash.com/photo-1583928853375-e66c94e8c0e6?w=1200&h=750&fit=crop&q=85', '{"beach":1,"night":4,"nature":1,"culture":4,"warm":1,"budget":5,"travel":3,"liberal":4,"food":3}', 20, 45, 90, 18, 13, 7, 56.95, 24.11),
('vilnius', 'Vilnius', 'Lituânia', '🇱🇹', 'Capital', 'Barroco, hipster e cerveja artesanal', 'https://images.unsplash.com/photo-1549891472-991e6bc75d1e?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":3,"nature":2,"culture":4,"warm":1,"budget":5,"travel":3,"liberal":3,"food":3}', 18, 40, 80, 15, 14, 7, 54.69, 25.28),
('brussels', 'Bruxelas', 'Bélgica', '🇧🇪', 'Capital', 'Chocolate, waffles e Art Nouveau', 'https://images.unsplash.com/photo-1559113202-c916b8e44373?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":3,"nature":1,"culture":4,"warm":2,"budget":2,"travel":5,"liberal":4,"food":5}', 40, 90, 180, 30, 14, 8, 50.85, 4.35),
('luxembourg-city', 'Luxemburgo', 'Luxemburgo', '🇱🇺', 'Capital', 'Fortalezas, bancos e natureza verde', 'https://images.unsplash.com/photo-1558551649-e44c8f992010?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":1,"nature":3,"culture":3,"warm":2,"budget":1,"travel":5,"liberal":4,"food":4}', 50, 110, 220, 38, 14, 8, 49.61, 6.13),
('geneva', 'Genebra', 'Suíça', '🇨🇭', 'Outro', 'Lago Léman, ONU e relógios suíços', 'https://images.unsplash.com/photo-1573108724029-4c46571d6490?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":2,"nature":4,"culture":4,"warm":2,"budget":0,"travel":4,"liberal":4,"food":4}', 60, 140, 280, 50, 15, 7, 46.20, 6.14),
('zurich', 'Zurique', 'Suíça', '🇨🇭', 'Outro', 'Lago, Alpes e chocolate premium', 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":2,"nature":4,"culture":4,"warm":2,"budget":0,"travel":4,"liberal":4,"food":4}', 65, 150, 300, 55, 14, 8, 47.37, 8.54),
('basel', 'Basileia', 'Suíça', '🇨🇭', 'Outro', 'Arte contemporânea e três países', 'https://images.unsplash.com/photo-1548199569-11a00a781e43?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":2,"nature":3,"culture":5,"warm":2,"budget":0,"travel":4,"liberal":4,"food":4}', 55, 130, 260, 48, 15, 7, 47.56, 7.59),

-- ═══ CENTRAL EUROPE ═══
('munich', 'Munique', 'Alemanha', '🇩🇪', 'Outro', 'Oktoberfest, cerveja e BMW', 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":4,"nature":2,"culture":4,"warm":2,"budget":2,"travel":4,"liberal":4,"food":4}', 40, 90, 180, 30, 15, 8, 48.14, 11.58),
('frankfurt', 'Frankfurt', 'Alemanha', '🇩🇪', 'Outro', 'Skyline financeiro e apple wine', 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":2,"nature":1,"culture":3,"warm":2,"budget":2,"travel":5,"liberal":4,"food":3}', 40, 85, 170, 28, 15, 7, 50.11, 8.68),
('hamburg', 'Hamburgo', 'Alemanha', '🇩🇪', 'Outro', 'Porto, Reeperbahn e arquitectura de tijolo', 'https://images.unsplash.com/photo-1560969184-10fe8719e047?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":4,"nature":1,"culture":4,"warm":1,"budget":2,"travel":4,"liberal":5,"food":4}', 35, 80, 160, 28, 13, 8, 53.55, 9.99),
('cologne', 'Colónia', 'Alemanha', '🇩🇪', 'Outro', 'Catedral gótica e Kölsch beer', 'https://images.unsplash.com/photo-1542820229-081e0c12af0b?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":3,"nature":1,"culture":4,"warm":2,"budget":3,"travel":5,"liberal":4,"food":3}', 30, 70, 140, 25, 15, 7, 50.94, 6.96),
('dresden', 'Dresden', 'Alemanha', '🇩🇪', 'Outro', 'Barroco reconstruído e porcelana', 'https://images.unsplash.com/photo-1596803244618-8dff0c2e1cb5?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":2,"nature":2,"culture":5,"warm":2,"budget":3,"travel":4,"liberal":3,"food":3}', 25, 60, 120, 22, 15, 6, 51.05, 13.74),
('nuremberg', 'Nuremberga', 'Alemanha', '🇩🇪', 'Outro', 'Medieval, Christmas markets e salsichas', 'https://images.unsplash.com/photo-1519846552623-8bc0ceaa8914?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":2,"nature":1,"culture":4,"warm":2,"budget":3,"travel":4,"liberal":3,"food":4}', 28, 65, 130, 24, 15, 7, 49.45, 11.08),
('salzburg', 'Salzburgo', 'Áustria', '🇦🇹', 'Outro', 'Mozart, Sound of Music e Alpes', 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":1,"nature":5,"culture":5,"warm":2,"budget":2,"travel":4,"liberal":3,"food":4}', 35, 80, 160, 28, 15, 8, 47.80, 13.04),
('innsbruck', 'Innsbruck', 'Áustria', '🇦🇹', 'Outro', 'Capital dos Alpes e ski', 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":1,"nature":5,"culture":3,"warm":1,"budget":2,"travel":4,"liberal":3,"food":3}', 35, 75, 150, 28, 13, 8, 47.26, 11.39),
('graz', 'Graz', 'Áustria', '🇦🇹', 'Outro', 'Estudantes, arte moderna e vinho', 'https://images.unsplash.com/photo-1578301978018-3005759f48f7?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":2,"nature":3,"culture":4,"warm":2,"budget":3,"travel":4,"liberal":3,"food":4}', 30, 65, 130, 25, 16, 7, 47.07, 15.44),
('krakow', 'Cracóvia', 'Polónia', '🇵🇱', 'Outro', 'Medieval, Auschwitz e vida noturna épica', 'https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":5,"nature":1,"culture":5,"warm":2,"budget":5,"travel":4,"liberal":3,"food":4}', 18, 40, 80, 15, 15, 7, 50.06, 19.94),
('warsaw', 'Varsóvia', 'Polónia', '🇵🇱', 'Capital', 'Fénix renascida e rooftop bars', 'https://images.unsplash.com/photo-1519197924294-4ba991a11128?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":4,"nature":1,"culture":4,"warm":2,"budget":4,"travel":4,"liberal":3,"food":3}', 20, 50, 100, 18, 15, 7, 52.23, 21.01),
('gdansk', 'Gdansk', 'Polónia', '🇵🇱', 'Outro', 'Porto hanseático e praias do Báltico', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1200&h=750&fit=crop&q=85', '{"beach":3,"night":3,"nature":2,"culture":4,"warm":1,"budget":4,"travel":3,"liberal":3,"food":3}', 20, 45, 90, 16, 13, 7, 54.35, 18.65),
('wroclaw', 'Wroclaw', 'Polónia', '🇵🇱', 'Outro', 'Ilha de Catedral e anões escondidos', 'https://images.unsplash.com/photo-1560390773-f090c3c1c1cb?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":3,"nature":1,"culture":4,"warm":2,"budget":5,"travel":4,"liberal":3,"food":3}', 18, 40, 80, 14, 16, 6, 51.11, 17.04),
('bratislava', 'Bratislava', 'Eslováquia', '🇸🇰', 'Capital', 'Compacta, castelo e Danúbio', 'https://images.unsplash.com/photo-1577351285958-d5a1c42d6d89?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":3,"nature":1,"culture":3,"warm":2,"budget":4,"travel":4,"liberal":3,"food":3}', 20, 45, 90, 16, 17, 6, 48.15, 17.11),
('ljubljana', 'Liubliana', 'Eslovénia', '🇸🇮', 'Capital', 'Verde, ciclável e muito charme', 'https://images.unsplash.com/photo-1569091791842-7cfb64e04797?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":2,"nature":4,"culture":4,"warm":2,"budget":3,"travel":4,"liberal":4,"food":4}', 25, 55, 110, 20, 17, 8, 46.05, 14.51),
('zagreb', 'Zagreb', 'Croácia', '🇭🇷', 'Capital', 'Austro-húngara e cafés com história', 'https://images.unsplash.com/photo-1555990538-1e6c0a9bff4f?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":3,"nature":2,"culture":4,"warm":2,"budget":3,"travel":4,"liberal":3,"food":4}', 25, 55, 110, 20, 17, 8, 45.81, 15.98),
('dubrovnik', 'Dubrovnik', 'Croácia', '🇭🇷', 'Outro', 'Kings Landing, muralhas e Adriático', 'https://images.unsplash.com/photo-1555990538-1e6c0a9bff4f?w=1200&h=750&fit=crop&q=85', '{"beach":4,"night":2,"nature":3,"culture":5,"warm":4,"budget":2,"travel":3,"liberal":3,"food":4}', 40, 90, 180, 30, 20, 5, 42.65, 18.09),
('split', 'Split', 'Croácia', '🇭🇷', 'Outro', 'Palácio de Diocleciano e ilhas próximas', 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=1200&h=750&fit=crop&q=85', '{"beach":4,"night":3,"nature":3,"culture":4,"warm":4,"budget":3,"travel":3,"liberal":3,"food":4}', 30, 70, 140, 25, 20, 5, 43.51, 16.44),
('pula', 'Pula', 'Croácia', '🇭🇷', 'Outro', 'Arena romana e Ístria', 'https://images.unsplash.com/photo-1594498653385-d5172c532c00?w=1200&h=750&fit=crop&q=85', '{"beach":4,"night":2,"nature":3,"culture":4,"warm":4,"budget":3,"travel":4,"liberal":3,"food":4}', 28, 65, 130, 22, 19, 5, 44.87, 13.85),
('zadar', 'Zadar', 'Croácia', '🇭🇷', 'Outro', 'Órgão do mar e sunset épico', 'https://images.unsplash.com/photo-1558100409-4c8f6cc54948?w=1200&h=750&fit=crop&q=85', '{"beach":4,"night":2,"nature":3,"culture":4,"warm":4,"budget":3,"travel":3,"liberal":3,"food":4}', 28, 60, 120, 22, 19, 5, 44.12, 15.23),
('sarajevo', 'Sarajevo', 'Bósnia', '🇧🇦', 'Capital', 'Oriente encontra Ocidente e cevapi', 'https://images.unsplash.com/photo-1586016413664-864c0dd76f53?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":2,"nature":3,"culture":5,"warm":2,"budget":5,"travel":3,"liberal":2,"food":4}', 18, 40, 80, 14, 16, 8, 43.86, 18.41),
('mostar', 'Mostar', 'Bósnia', '🇧🇦', 'Outro', 'Ponte icónica e mergulho tradicional', 'https://images.unsplash.com/photo-1555990538-1e6c0a9bff4f?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":1,"nature":3,"culture":5,"warm":3,"budget":5,"travel":3,"liberal":2,"food":4}', 15, 35, 70, 12, 19, 6, 43.34, 17.81),
('belgrade', 'Belgrado', 'Sérvia', '🇷🇸', 'Capital', 'Noite sem fim e história pesada', 'https://images.unsplash.com/photo-1577351285958-d5a1c42d6d89?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":5,"nature":1,"culture":4,"warm":2,"budget":5,"travel":3,"liberal":3,"food":4}', 18, 40, 80, 14, 18, 7, 44.79, 20.45),
('novi-sad', 'Novi Sad', 'Sérvia', '🇷🇸', 'Outro', 'EXIT Festival e fortaleza', 'https://images.unsplash.com/photo-1577351285958-d5a1c42d6d89?w=1200&h=750&fit=crop&q=85', '{"beach":1,"night":4,"nature":2,"culture":3,"warm":2,"budget":5,"travel":3,"liberal":3,"food":3}', 15, 35, 70, 12, 18, 6, 45.25, 19.85),
('timisoara', 'Timisoara', 'Roménia', '🇷🇴', 'Outro', 'Little Vienna e capital cultural', 'https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":2,"nature":1,"culture":4,"warm":2,"budget":5,"travel":3,"liberal":3,"food":3}', 15, 35, 70, 12, 18, 6, 45.76, 21.23),

-- ═══ WESTERN EUROPE ═══
('lyon', 'Lyon', 'França', '🇫🇷', 'Outro', 'Capital gastronómica e traboules', 'https://images.unsplash.com/photo-1524396309943-e03f5249f002?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":3,"nature":2,"culture":4,"warm":3,"budget":2,"travel":4,"liberal":3,"food":5}', 40, 90, 180, 32, 17, 6, 45.76, 4.83),
('marseille', 'Marselha', 'França', '🇫🇷', 'Outro', 'Porto antigo e calanques', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=1200&h=750&fit=crop&q=85', '{"beach":4,"night":3,"nature":4,"culture":3,"warm":4,"budget":3,"travel":4,"liberal":3,"food":5}', 35, 80, 160, 28, 19, 4, 43.30, 5.37),
('nice', 'Nice', 'França', '🇫🇷', 'Outro', 'Promenade, Riviera e art de vivre', 'https://images.unsplash.com/photo-1491166617655-0723a0999cfc?w=1200&h=750&fit=crop&q=85', '{"beach":5,"night":3,"nature":3,"culture":3,"warm":4,"budget":1,"travel":4,"liberal":4,"food":5}', 50, 110, 220, 35, 18, 4, 43.71, 7.26),
('bordeaux', 'Bordéus', 'França', '🇫🇷', 'Outro', 'Vinho, arquitetura e Miroir dEau', 'https://images.unsplash.com/photo-1565018054866-968e244671af?w=1200&h=750&fit=crop&q=85', '{"beach":1,"night":2,"nature":2,"culture":4,"warm":3,"budget":2,"travel":4,"liberal":3,"food":5}', 40, 85, 170, 30, 17, 6, 44.84, -0.58),
('toulouse', 'Toulouse', 'França', '🇫🇷', 'Outro', 'Cidade rosa e Airbus', 'https://images.unsplash.com/photo-1547037579-f0fc020ac3be?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":3,"nature":2,"culture":3,"warm":3,"budget":3,"travel":4,"liberal":3,"food":4}', 35, 75, 150, 26, 18, 6, 43.60, 1.44),
('strasbourg', 'Estrasburgo', 'França', '🇫🇷', 'Outro', 'Petite France e mercado de Natal', 'https://images.unsplash.com/photo-1574069894173-f35c3aba6c0a?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":2,"nature":2,"culture":4,"warm":2,"budget":2,"travel":5,"liberal":4,"food":4}', 35, 80, 160, 28, 16, 7, 48.57, 7.75),
('nantes', 'Nantes', 'França', '🇫🇷', 'Outro', 'Elefante mecânico e criatividade', 'https://images.unsplash.com/photo-1560156280-a6e6c65f3ab4?w=1200&h=750&fit=crop&q=85', '{"beach":1,"night":2,"nature":2,"culture":4,"warm":2,"budget":3,"travel":4,"liberal":4,"food":4}', 32, 70, 140, 25, 15, 7, 47.22, -1.55),
('lille', 'Lille', 'França', '🇫🇷', 'Outro', 'Flamenga, acolhedora e gastro', 'https://images.unsplash.com/photo-1587614203976-365c74645e83?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":3,"nature":1,"culture":3,"warm":2,"budget":2,"travel":5,"liberal":4,"food":4}', 32, 72, 145, 26, 14, 8, 50.63, 3.06),
('antwerp', 'Antuérpia', 'Bélgica', '🇧🇪', 'Outro', 'Diamantes, Rubens e moda', 'https://images.unsplash.com/photo-1549888834-3ec93abae044?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":3,"nature":1,"culture":4,"warm":2,"budget":2,"travel":5,"liberal":4,"food":4}', 38, 85, 170, 30, 14, 8, 51.22, 4.40),
('ghent', 'Ghent', 'Bélgica', '🇧🇪', 'Outro', 'Medieval, estudantes e graslei', 'https://images.unsplash.com/photo-1558642084-fd07fae5282e?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":3,"nature":1,"culture":4,"warm":2,"budget":2,"travel":5,"liberal":4,"food":4}', 35, 78, 155, 28, 14, 8, 51.05, 3.72),
('bruges', 'Bruges', 'Bélgica', '🇧🇪', 'Outro', 'Canais, chocolate e lace', 'https://images.unsplash.com/photo-1549888834-3ec93abae044?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":1,"nature":1,"culture":5,"warm":2,"budget":2,"travel":5,"liberal":4,"food":4}', 40, 90, 180, 30, 13, 9, 51.21, 3.22),
('rotterdam', 'Roterdão', 'Holanda', '🇳🇱', 'Outro', 'Arquitetura moderna e porto gigante', 'https://images.unsplash.com/photo-1580996742538-3e7b65c07ab3?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":3,"nature":1,"culture":3,"warm":2,"budget":2,"travel":5,"liberal":5,"food":3}', 38, 85, 170, 28, 13, 8, 51.92, 4.48),
('utrecht', 'Utrecht', 'Holanda', '🇳🇱', 'Outro', 'Canais com terraços e Dom Tower', 'https://images.unsplash.com/photo-1548196324-4b9e1a1a78a2?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":3,"nature":1,"culture":3,"warm":2,"budget":2,"travel":5,"liberal":5,"food":3}', 35, 80, 160, 28, 13, 8, 52.09, 5.12),
('the-hague', 'Haia', 'Holanda', '🇳🇱', 'Outro', 'Tribunal internacional e Scheveningen', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=750&fit=crop&q=85', '{"beach":3,"night":2,"nature":1,"culture":4,"warm":2,"budget":2,"travel":5,"liberal":5,"food":3}', 38, 85, 170, 28, 13, 8, 52.07, 4.30),
('eindhoven-d', 'Eindhoven', 'Holanda', '🇳🇱', 'Outro', 'Design, tech e Van Gogh', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":2,"nature":1,"culture":3,"warm":2,"budget":2,"travel":5,"liberal":5,"food":3}', 32, 75, 150, 26, 14, 7, 51.44, 5.47),

-- ═══ SOUTHERN EUROPE ═══
('milan', 'Milão', 'Itália', '🇮🇹', 'Outro', 'Moda, Duomo e aperitivo', 'https://images.unsplash.com/photo-1520440229-6469a149ac59?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":4,"nature":1,"culture":5,"warm":3,"budget":1,"travel":5,"liberal":3,"food":5}', 45, 100, 200, 32, 19, 6, 45.46, 9.19),
('florence', 'Florença', 'Itália', '🇮🇹', 'Outro', 'Renascimento, gelato e Ponte Vecchio', 'https://images.unsplash.com/photo-1543429257-3eb0b65d9c58?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":2,"nature":2,"culture":5,"warm":3,"budget":2,"travel":4,"liberal":3,"food":5}', 40, 90, 180, 30, 20, 5, 43.77, 11.25),
('venice', 'Veneza', 'Itália', '🇮🇹', 'Outro', 'Canais, gôndolas e carnaval', 'https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=1200&h=750&fit=crop&q=85', '{"beach":2,"night":1,"nature":1,"culture":5,"warm":3,"budget":1,"travel":4,"liberal":2,"food":5}', 50, 120, 240, 35, 19, 5, 45.44, 12.32),
('naples', 'Nápoles', 'Itália', '🇮🇹', 'Outro', 'Pizza original, Pompeia e Vesúvio', 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=1200&h=750&fit=crop&q=85', '{"beach":2,"night":3,"nature":3,"culture":5,"warm":4,"budget":4,"travel":4,"liberal":2,"food":5}', 28, 60, 120, 22, 20, 4, 40.85, 14.27),
('bologna', 'Bolonha', 'Itália', '🇮🇹', 'Outro', 'Universidade antiga e ragu original', 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":3,"nature":1,"culture":4,"warm":3,"budget":3,"travel":4,"liberal":3,"food":5}', 32, 72, 145, 26, 19, 6, 44.49, 11.34),
('turin', 'Turim', 'Itália', '🇮🇹', 'Outro', 'Chocolate, Fiat e Alpes próximos', 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":2,"nature":3,"culture":4,"warm":2,"budget":3,"travel":4,"liberal":3,"food":5}', 30, 68, 135, 25, 18, 6, 45.07, 7.69),
('palermo', 'Palermo', 'Itália', '🇮🇹', 'Ilha', 'Mercados caóticos e arancini', 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1200&h=750&fit=crop&q=85', '{"beach":3,"night":2,"nature":2,"culture":4,"warm":4,"budget":4,"travel":3,"liberal":2,"food":5}', 25, 55, 110, 20, 21, 3, 38.12, 13.36),
('catania', 'Catânia', 'Itália', '🇮🇹', 'Ilha', 'Etna, barroco e peixe fresco', 'https://images.unsplash.com/photo-1558998708-ed93834ea6dc?w=1200&h=750&fit=crop&q=85', '{"beach":4,"night":2,"nature":4,"culture":3,"warm":4,"budget":4,"travel":3,"liberal":2,"food":5}', 25, 55, 110, 20, 21, 3, 37.50, 15.09),
('cinque-terre', 'Cinque Terre', 'Itália', '🇮🇹', 'Outro', 'Aldeias coloridas na falésia', 'https://images.unsplash.com/photo-1498307833015-e7b400441eb8?w=1200&h=750&fit=crop&q=85', '{"beach":3,"night":0,"nature":5,"culture":4,"warm":3,"budget":2,"travel":4,"liberal":2,"food":5}', 45, 100, 200, 32, 18, 5, 44.15, 9.65),
('amalfi', 'Costa Amalfitana', 'Itália', '🇮🇹', 'Outro', 'Estrada panorâmica e limoncello', 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1200&h=750&fit=crop&q=85', '{"beach":4,"night":1,"nature":5,"culture":4,"warm":4,"budget":1,"travel":3,"liberal":2,"food":5}', 50, 120, 240, 35, 20, 4, 40.63, 14.60),
('lisbon-d', 'Lisboa', 'Portugal', '🇵🇹', 'Capital', 'Colinas, pastéis e fado', 'https://images.unsplash.com/photo-1585208798174-6cedd86e019a?w=1200&h=750&fit=crop&q=85', '{"beach":3,"night":4,"nature":2,"culture":5,"warm":4,"budget":3,"travel":5,"liberal":4,"food":5}', 35, 75, 150, 25, 20, 5, 38.72, -9.14),
('porto-d', 'Porto', 'Portugal', '🇵🇹', 'Outro', 'Vinho, Ribeira e francesinhas', 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&h=750&fit=crop&q=85', '{"beach":2,"night":3,"nature":2,"culture":5,"warm":3,"budget":3,"travel":5,"liberal":4,"food":5}', 30, 65, 130, 22, 18, 7, 41.16, -8.63),
('algarve', 'Algarve', 'Portugal', '🇵🇹', 'Outro', 'Falésias douradas e praias secretas', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=750&fit=crop&q=85', '{"beach":5,"night":2,"nature":4,"culture":2,"warm":5,"budget":3,"travel":5,"liberal":3,"food":4}', 35, 75, 150, 24, 21, 2, 37.02, -8.93),
('sintra', 'Sintra', 'Portugal', '🇵🇹', 'Outro', 'Palácios mágicos e jardins românticos', 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?w=1200&h=750&fit=crop&q=85', '{"beach":1,"night":0,"nature":5,"culture":5,"warm":3,"budget":3,"travel":5,"liberal":3,"food":4}', 35, 75, 150, 25, 18, 5, 38.80, -9.39),
('braga', 'Braga', 'Portugal', '🇵🇹', 'Outro', 'Bom Jesus e juventude universitária', 'https://images.unsplash.com/photo-1562883676-8c7feb83f09b?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":2,"nature":2,"culture":4,"warm":3,"budget":4,"travel":5,"liberal":3,"food":4}', 25, 55, 110, 20, 18, 8, 41.55, -8.43),
('malaga', 'Málaga', 'Espanha', '🇪🇸', 'Espanha', 'Picasso, tapas e Costa del Sol', 'https://images.unsplash.com/photo-1558370781-d6196949e317?w=1200&h=750&fit=crop&q=85', '{"beach":5,"night":4,"nature":2,"culture":4,"warm":5,"budget":3,"travel":5,"liberal":3,"food":4}', 30, 65, 130, 22, 22, 3, 36.72, -4.42),
('cordoba', 'Córdoba', 'Espanha', '🇪🇸', 'Espanha', 'Mesquita-Catedral e pátios floridos', 'https://images.unsplash.com/photo-1558370781-d6196949e317?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":2,"nature":1,"culture":5,"warm":5,"budget":4,"travel":5,"liberal":2,"food":4}', 25, 55, 110, 20, 24, 2, 37.88, -4.78),
('bilbao', 'Bilbao', 'Espanha', '🇪🇸', 'Espanha', 'Guggenheim e pintxos bascos', 'https://images.unsplash.com/photo-1558370781-d6196949e317?w=1200&h=750&fit=crop&q=85', '{"beach":1,"night":3,"nature":2,"culture":5,"warm":2,"budget":2,"travel":4,"liberal":3,"food":5}', 38, 82, 165, 30, 16, 9, 43.26, -2.93),
('santander', 'Santander', 'Espanha', '🇪🇸', 'Espanha', 'Praias urbanas e Palácio Magdalena', 'https://images.unsplash.com/photo-1558370781-d6196949e317?w=1200&h=750&fit=crop&q=85', '{"beach":4,"night":2,"nature":3,"culture":3,"warm":2,"budget":3,"travel":4,"liberal":2,"food":4}', 30, 68, 135, 25, 15, 10, 43.46, -3.81),
('zaragoza', 'Zaragoza', 'Espanha', '🇪🇸', 'Espanha', 'Basílica del Pilar e tapas', 'https://images.unsplash.com/photo-1558370781-d6196949e317?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":2,"nature":1,"culture":4,"warm":3,"budget":4,"travel":5,"liberal":3,"food":4}', 25, 55, 110, 20, 19, 4, 41.65, -0.88),
('monaco', 'Mónaco', 'Mónaco', '🇲🇨', 'Outro', 'Glamour, casino e F1', 'https://images.unsplash.com/photo-1491166617655-0723a0999cfc?w=1200&h=750&fit=crop&q=85', '{"beach":3,"night":4,"nature":2,"culture":3,"warm":4,"budget":0,"travel":4,"liberal":4,"food":5}', 100, 250, 500, 60, 18, 4, 43.74, 7.42),

-- ═══ EASTERN EUROPE ═══
('bucharest', 'Bucareste', 'Roménia', '🇷🇴', 'Capital', 'Parlamento gigante e clubes underground', 'https://images.unsplash.com/photo-1585409677983-0f6c41ca9c3b?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":4,"nature":1,"culture":4,"warm":3,"budget":5,"travel":3,"liberal":3,"food":4}', 18, 40, 80, 14, 19, 6, 44.43, 26.10),
('sofia', 'Sófia', 'Bulgária', '🇧🇬', 'Capital', 'Vitosha e história profunda', 'https://images.unsplash.com/photo-1558100409-4c8f6cc54948?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":3,"nature":3,"culture":4,"warm":2,"budget":5,"travel":3,"liberal":3,"food":4}', 15, 35, 70, 12, 16, 7, 42.70, 23.32),
('plovdiv', 'Plovdiv', 'Bulgária', '🇧🇬', 'Outro', 'Cidade velha e anfiteatro romano', 'https://images.unsplash.com/photo-1558100409-4c8f6cc54948?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":2,"nature":2,"culture":5,"warm":3,"budget":5,"travel":3,"liberal":3,"food":4}', 14, 32, 65, 11, 18, 5, 42.15, 24.75),
('varna', 'Varna', 'Bulgária', '🇧🇬', 'Outro', 'Mar Negro e resorts', 'https://images.unsplash.com/photo-1558100409-4c8f6cc54948?w=1200&h=750&fit=crop&q=85', '{"beach":4,"night":3,"nature":2,"culture":2,"warm":3,"budget":5,"travel":2,"liberal":3,"food":3}', 15, 35, 70, 12, 19, 4, 43.21, 27.92),
('thessaloniki', 'Salónica', 'Grécia', '🇬🇷', 'Outro', 'Segunda cidade grega e nightlife', 'https://images.unsplash.com/photo-1558370781-d6196949e317?w=1200&h=750&fit=crop&q=85', '{"beach":2,"night":4,"nature":1,"culture":4,"warm":4,"budget":3,"travel":3,"liberal":3,"food":4}', 28, 60, 120, 20, 21, 4, 40.64, 22.94),
('santorini', 'Santorini', 'Grécia', '🇬🇷', 'Ilha', 'Pôr do sol em Oia e caldera', 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&h=750&fit=crop&q=85', '{"beach":4,"night":2,"nature":4,"culture":3,"warm":4,"budget":1,"travel":3,"liberal":3,"food":4}', 60, 140, 280, 35, 21, 2, 36.39, 25.46),
('rhodes', 'Rodes', 'Grécia', '🇬🇷', 'Ilha', 'Cidade medieval e praias', 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&h=750&fit=crop&q=85', '{"beach":5,"night":3,"nature":2,"culture":4,"warm":5,"budget":3,"travel":3,"liberal":3,"food":4}', 35, 75, 150, 25, 22, 2, 36.43, 28.22),
('corfu', 'Corfu', 'Grécia', '🇬🇷', 'Ilha', 'Verde, venetiana e Durrell', 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&h=750&fit=crop&q=85', '{"beach":4,"night":2,"nature":4,"culture":4,"warm":4,"budget":3,"travel":3,"liberal":3,"food":4}', 32, 70, 140, 24, 21, 4, 39.62, 19.92),
('kotor', 'Kotor', 'Montenegro', '🇲🇪', 'Outro', 'Baía espetacular e muralhas', 'https://images.unsplash.com/photo-1555990538-1e6c0a9bff4f?w=1200&h=750&fit=crop&q=85', '{"beach":3,"night":1,"nature":5,"culture":4,"warm":4,"budget":3,"travel":3,"liberal":3,"food":4}', 28, 60, 120, 22, 20, 6, 42.42, 18.77),
('tirana', 'Tirana', 'Albânia', '🇦🇱', 'Capital', 'Colorida, caótica e em crescimento', 'https://images.unsplash.com/photo-1555990538-1e6c0a9bff4f?w=1200&h=750&fit=crop&q=85', '{"beach":2,"night":3,"nature":2,"culture":3,"warm":4,"budget":5,"travel":2,"liberal":3,"food":4}', 15, 35, 70, 12, 19, 6, 41.33, 19.82),
('skopje', 'Skopje', 'Macedónia do Norte', '🇲🇰', 'Capital', 'Estátuas gigantes e Old Bazaar', 'https://images.unsplash.com/photo-1555990538-1e6c0a9bff4f?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":2,"nature":2,"culture":3,"warm":3,"budget":5,"travel":2,"liberal":2,"food":3}', 14, 32, 65, 11, 18, 5, 41.99, 21.43),
('kyiv', 'Kyiv', 'Ucrânia', '🇺🇦', 'Capital', 'Mosteiro dourado e resiliência', 'https://images.unsplash.com/photo-1561542320-9a18cd340e98?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":3,"nature":1,"culture":5,"warm":2,"budget":5,"travel":2,"liberal":2,"food":4}', 15, 35, 70, 12, 17, 6, 50.45, 30.52),
('lviv', 'Lviv', 'Ucrânia', '🇺🇦', 'Outro', 'Coffee culture e arquitectura', 'https://images.unsplash.com/photo-1561542320-9a18cd340e98?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":2,"nature":1,"culture":5,"warm":2,"budget":5,"travel":2,"liberal":2,"food":4}', 12, 28, 55, 10, 16, 7, 49.84, 24.03),

-- ═══ MEDITERRANEAN ISLANDS ═══
('cyprus-paphos', 'Paphos', 'Chipre', '🇨🇾', 'Ilha', 'Berço de Afrodite e ruínas', 'https://images.unsplash.com/photo-1555990538-1e6c0a9bff4f?w=1200&h=750&fit=crop&q=85', '{"beach":5,"night":2,"nature":3,"culture":4,"warm":5,"budget":3,"travel":3,"liberal":3,"food":4}', 35, 75, 150, 25, 24, 1, 34.78, 32.42),
('cyprus-limassol', 'Limassol', 'Chipre', '🇨🇾', 'Ilha', 'Praia, vinho e marina', 'https://images.unsplash.com/photo-1555990538-1e6c0a9bff4f?w=1200&h=750&fit=crop&q=85', '{"beach":4,"night":3,"nature":2,"culture":3,"warm":5,"budget":3,"travel":3,"liberal":3,"food":4}', 38, 82, 165, 28, 24, 1, 34.68, 33.04),
('sicily', 'Sicília', 'Itália', '🇮🇹', 'Ilha', 'Etna, cannoli e história milenar', 'https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=1200&h=750&fit=crop&q=85', '{"beach":4,"night":2,"nature":4,"culture":5,"warm":4,"budget":3,"travel":3,"liberal":2,"food":5}', 30, 65, 130, 22, 21, 3, 37.60, 14.02),
('corsica', 'Córsega', 'França', '🇫🇷', 'Ilha', 'Montanhas no mar e GR20', 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&h=750&fit=crop&q=85', '{"beach":5,"night":1,"nature":5,"culture":2,"warm":4,"budget":2,"travel":3,"liberal":3,"food":4}', 45, 100, 200, 32, 19, 4, 42.04, 9.01),
('hvar', 'Hvar', 'Croácia', '🇭🇷', 'Ilha', 'Party island croata e lavanda', 'https://images.unsplash.com/photo-1555990538-1e6c0a9bff4f?w=1200&h=750&fit=crop&q=85', '{"beach":5,"night":4,"nature":3,"culture":3,"warm":4,"budget":2,"travel":3,"liberal":4,"food":4}', 45, 100, 200, 32, 20, 3, 43.17, 16.44),
('brac', 'Brac', 'Croácia', '🇭🇷', 'Ilha', 'Zlatni Rat e pedra branca', 'https://images.unsplash.com/photo-1555990538-1e6c0a9bff4f?w=1200&h=750&fit=crop&q=85', '{"beach":5,"night":1,"nature":4,"culture":2,"warm":4,"budget":3,"travel":3,"liberal":3,"food":3}', 35, 75, 150, 25, 20, 3, 43.31, 16.65),
('zakynthos', 'Zakynthos', 'Grécia', '🇬🇷', 'Ilha', 'Navagio Beach e tartarugas', 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&h=750&fit=crop&q=85', '{"beach":5,"night":3,"nature":4,"culture":2,"warm":4,"budget":3,"travel":3,"liberal":3,"food":3}', 35, 75, 150, 24, 21, 3, 37.79, 20.90),
('kefalonia', 'Cefalónia', 'Grécia', '🇬🇷', 'Ilha', 'Melissani Cave e praias intocadas', 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&h=750&fit=crop&q=85', '{"beach":5,"night":1,"nature":5,"culture":2,"warm":4,"budget":3,"travel":3,"liberal":3,"food":4}', 35, 75, 150, 24, 20, 3, 38.18, 20.49),
('lefkada', 'Lefkada', 'Grécia', '🇬🇷', 'Ilha', 'Porto Katsiki e kitesurf', 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&h=750&fit=crop&q=85', '{"beach":5,"night":1,"nature":4,"culture":1,"warm":4,"budget":3,"travel":3,"liberal":3,"food":3}', 32, 70, 140, 22, 21, 3, 38.83, 20.71),
('naxos', 'Naxos', 'Grécia', '🇬🇷', 'Ilha', 'Maior Cíclade e autêntica', 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&h=750&fit=crop&q=85', '{"beach":5,"night":2,"nature":3,"culture":3,"warm":4,"budget":3,"travel":3,"liberal":3,"food":4}', 32, 70, 140, 22, 21, 2, 37.10, 25.38),
('paros', 'Paros', 'Grécia', '🇬🇷', 'Ilha', 'Naoussa e vibes boémias', 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&h=750&fit=crop&q=85', '{"beach":5,"night":3,"nature":2,"culture":3,"warm":4,"budget":3,"travel":3,"liberal":4,"food":4}', 35, 78, 155, 25, 21, 2, 37.09, 25.15),
('milos', 'Milos', 'Grécia', '🇬🇷', 'Ilha', 'Praias coloridas e Sarakiniko', 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&h=750&fit=crop&q=85', '{"beach":5,"night":1,"nature":5,"culture":2,"warm":4,"budget":3,"travel":3,"liberal":3,"food":3}', 38, 85, 170, 26, 21, 2, 36.74, 24.43),
('ios', 'Ios', 'Grécia', '🇬🇷', 'Ilha', 'Party island das Cíclades', 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&h=750&fit=crop&q=85', '{"beach":5,"night":5,"nature":2,"culture":1,"warm":4,"budget":3,"travel":3,"liberal":5,"food":3}', 35, 78, 155, 25, 21, 2, 36.72, 25.28),
('skiathos', 'Skiathos', 'Grécia', '🇬🇷', 'Ilha', 'Praias premiadas e pinheiros', 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1200&h=750&fit=crop&q=85', '{"beach":5,"night":3,"nature":4,"culture":2,"warm":4,"budget":3,"travel":3,"liberal":3,"food":3}', 38, 85, 170, 26, 21, 3, 39.16, 23.49),

-- ═══ SELECT NON-EUROPEAN ═══
('tel-aviv', 'Tel Aviv', 'Israel', '🇮🇱', 'Exótico', 'Praia, tech e nightlife 24/7', 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&h=750&fit=crop&q=85', '{"beach":5,"night":5,"nature":1,"culture":4,"warm":5,"budget":1,"travel":3,"liberal":5,"food":5}', 50, 110, 220, 40, 25, 1, 32.07, 34.77),
('dubai', 'Dubai', 'EAU', '🇦🇪', 'Exótico', 'Superlativos, malls e deserto', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1200&h=750&fit=crop&q=85', '{"beach":4,"night":4,"nature":2,"culture":2,"warm":5,"budget":1,"travel":2,"liberal":2,"food":4}', 60, 140, 280, 45, 35, 0, 25.20, 55.27),
('cairo', 'Cairo', 'Egito', '🇪🇬', 'Exótico', 'Pirâmides, Nilo e caos épico', 'https://images.unsplash.com/photo-1553913861-c0fddf2619ee?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":2,"nature":2,"culture":5,"warm":5,"budget":4,"travel":2,"liberal":1,"food":4}', 25, 55, 110, 18, 30, 0, 30.04, 31.24),
('cape-town', 'Cidade do Cabo', 'África do Sul', '🇿🇦', 'Exótico', 'Table Mountain e duas oceanos', 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?w=1200&h=750&fit=crop&q=85', '{"beach":4,"night":4,"nature":5,"culture":4,"warm":4,"budget":3,"travel":0,"liberal":4,"food":5}', 40, 90, 180, 28, 18, 4, -33.92, 18.42),
('cartagena', 'Cartagena', 'Colômbia', '🇨🇴', 'Exótico', 'Ciudad amurallada e Caribe', 'https://images.unsplash.com/photo-1583508915901-b5f84c1dcde1?w=1200&h=750&fit=crop&q=85', '{"beach":4,"night":4,"nature":2,"culture":5,"warm":5,"budget":3,"travel":0,"liberal":4,"food":5}', 35, 75, 150, 22, 30, 5, 10.39, -75.51),
('buenos-aires', 'Buenos Aires', 'Argentina', '🇦🇷', 'Exótico', 'Tango, carne e noites infinitas', 'https://images.unsplash.com/photo-1612294037637-ec328d0e075e?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":5,"nature":1,"culture":5,"warm":3,"budget":4,"travel":0,"liberal":5,"food":5}', 30, 70, 140, 22, 18, 5, -34.60, -58.38),
('rio', 'Rio de Janeiro', 'Brasil', '🇧🇷', 'Exótico', 'Cristo, samba e Copacabana', 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=1200&h=750&fit=crop&q=85', '{"beach":5,"night":5,"nature":4,"culture":4,"warm":5,"budget":3,"travel":0,"liberal":5,"food":4}', 35, 80, 160, 25, 27, 4, -22.91, -43.17),
('bali', 'Bali', 'Indonésia', '🇮🇩', 'Exótico', 'Templos, rice terraces e surf', 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&h=750&fit=crop&q=85', '{"beach":5,"night":3,"nature":5,"culture":4,"warm":5,"budget":4,"travel":0,"liberal":4,"food":4}', 25, 55, 110, 15, 28, 5, -8.41, 115.19),
('tokyo', 'Tóquio', 'Japão', '🇯🇵', 'Exótico', 'Futuro e tradição em harmonia', 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1200&h=750&fit=crop&q=85', '{"beach":1,"night":4,"nature":2,"culture":5,"warm":3,"budget":2,"travel":0,"liberal":4,"food":5}', 50, 110, 220, 35, 20, 7, 35.68, 139.65),
('seoul', 'Seul', 'Coreia do Sul', '🇰🇷', 'Exótico', 'K-pop, tecnologia e BBQ', 'https://images.unsplash.com/photo-1538485399081-7191377e8241?w=1200&h=750&fit=crop&q=85', '{"beach":1,"night":5,"nature":2,"culture":4,"warm":3,"budget":3,"travel":0,"liberal":4,"food":5}', 40, 90, 180, 28, 19, 6, 37.57, 126.98),
('singapore', 'Singapura', 'Singapura', '🇸🇬', 'Exótico', 'Gardens by the Bay e hawker food', 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1200&h=750&fit=crop&q=85', '{"beach":2,"night":4,"nature":3,"culture":4,"warm":5,"budget":2,"travel":0,"liberal":3,"food":5}', 55, 120, 240, 35, 30, 10, 1.35, 103.82),
('new-york', 'Nova Iorque', 'EUA', '🇺🇸', 'Exótico', 'A cidade que nunca dorme', 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1200&h=750&fit=crop&q=85', '{"beach":2,"night":5,"nature":1,"culture":5,"warm":3,"budget":0,"travel":1,"liberal":5,"food":5}', 80, 180, 360, 50, 18, 6, 40.71, -74.01),
('montreal', 'Montreal', 'Canadá', '🇨🇦', 'Exótico', 'Francófona e festivais', 'https://images.unsplash.com/photo-1559587336-1b92f12f107e?w=1200&h=750&fit=crop&q=85', '{"beach":0,"night":4,"nature":2,"culture":4,"warm":2,"budget":2,"travel":1,"liberal":5,"food":5}', 50, 110, 220, 38, 15, 7, 45.50, -73.57)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  country = EXCLUDED.country,
  flag = EXCLUDED.flag,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  image_url = EXCLUDED.image_url,
  attrs = EXCLUDED.attrs,
  cost_low = EXCLUDED.cost_low,
  cost_med = EXCLUDED.cost_med,
  cost_high = EXCLUDED.cost_high,
  food_per_day = EXCLUDED.food_per_day,
  temp_may = EXCLUDED.temp_may,
  rain_days = EXCLUDED.rain_days,
  lat = EXCLUDED.lat,
  lon = EXCLUDED.lon;

-- ─── 5. SEED DEFAULT GROUP SELECTIONS ──────────────────────────────

-- Default destinations for the original fuga2026 group (keep existing 35 + add some popular ones)
INSERT INTO group_destinations (group_id, destination_id, priority)
SELECT 'fuga2026', d.id, 0
FROM destinations d
WHERE d.id IN (
  -- Original destinations
  'cancun', 'sal', 'istanbul', 'havana', 'marrakech', 'bangkok-d', 'cdmx', 'spb',
  'madeira', 'acores', 'tenerife', 'creta', 'mykonos', 'sardegna', 'malta',
  'london-d', 'paris-d', 'berlin-d', 'amsterdam-d', 'copenhagen-d', 'vienna', 'prague', 'budapest', 'rome', 'athens',
  'ibiza', 'mallorca', 'menorca', 'barcelona', 'valencia', 'sevilla', 'madrid-d', 'granada', 'san-seb', 'fuerte'
)
ON CONFLICT (group_id, destination_id) DO NOTHING;

-- Default factors (all factors)
INSERT INTO group_factors (group_id, factor_id, display_order)
SELECT 'fuga2026', f.id, f.display_order
FROM factors f
ON CONFLICT (group_id, factor_id) DO NOTHING;

-- Default quiz questions (all questions)
INSERT INTO group_quiz_questions (group_id, question_id, display_order)
SELECT 'fuga2026', q.id, q.display_order
FROM quiz_questions q
ON CONFLICT (group_id, question_id) DO NOTHING;

-- ==========================================
-- DONE! Multi-tenant schema + 200 destinations
-- ==========================================
--
-- New tables:
--   - group_destinations (junction: group <-> destinations)
--   - group_factors (junction: group <-> factors)
--   - group_quiz_questions (junction: group <-> quiz questions)
--
-- New columns on groups:
--   - admin_password (for per-group admin auth)
--   - admin_email (optional contact)
--   - is_public (default true)
--
-- Total destinations: ~200 (35 original + 165 new)
-- ==========================================
