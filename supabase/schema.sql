-- ═══════════════════════════════════════════════════════════
-- DOFUS CONCASSAGE LAB — Schéma Supabase
-- Exécuter dans SQL Editor de votre dashboard Supabase
-- ═══════════════════════════════════════════════════════════

-- ─── Table : Équipements (encyclopédie) ───
CREATE TABLE IF NOT EXISTS items (
  id            BIGSERIAL PRIMARY KEY,
  dofus_id      INTEGER,
  name          TEXT NOT NULL,
  level         INTEGER NOT NULL DEFAULT 1,
  type          TEXT NOT NULL,
  description   TEXT DEFAULT '',
  img_url       TEXT,
  effects       JSONB NOT NULL DEFAULT '[]',
  recipe        JSONB NOT NULL DEFAULT '[]',
  drops         JSONB NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Table : Prix des runes (communautaire) ───
CREATE TABLE IF NOT EXISTS rune_prices (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT NOT NULL UNIQUE,
  price         INTEGER NOT NULL DEFAULT 0,
  updated_by    TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Table : Items sauvegardés (dashboard utilisateur) ───
CREATE TABLE IF NOT EXISTS saved_items (
  id            BIGSERIAL PRIMARY KEY,
  item_id       BIGINT REFERENCES items(id) ON DELETE CASCADE,
  buy_price     INTEGER NOT NULL DEFAULT 0,
  coefficient   REAL NOT NULL DEFAULT 85,
  session_id    TEXT NOT NULL DEFAULT 'anonymous',
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Index pour les recherches ───
CREATE INDEX IF NOT EXISTS idx_items_name ON items USING gin(to_tsvector('french', name));
CREATE INDEX IF NOT EXISTS idx_items_level ON items (level);
CREATE INDEX IF NOT EXISTS idx_items_type ON items (type);
CREATE INDEX IF NOT EXISTS idx_saved_session ON saved_items (session_id);

-- ─── Row Level Security (accès public lecture + écriture communautaire) ───
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE rune_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_items ENABLE ROW LEVEL SECURITY;

-- Lecture publique
CREATE POLICY "read_items"       ON items       FOR SELECT USING (true);
CREATE POLICY "read_rune_prices" ON rune_prices  FOR SELECT USING (true);
CREATE POLICY "read_saved_items" ON saved_items  FOR SELECT USING (true);

-- Écriture communautaire (tout le monde peut ajouter/modifier)
CREATE POLICY "insert_items"      ON items       FOR INSERT WITH CHECK (true);
CREATE POLICY "update_items"      ON items       FOR UPDATE USING (true);
CREATE POLICY "insert_rune"       ON rune_prices FOR INSERT WITH CHECK (true);
CREATE POLICY "update_rune"       ON rune_prices FOR UPDATE USING (true);
CREATE POLICY "insert_saved"      ON saved_items FOR INSERT WITH CHECK (true);
CREATE POLICY "update_saved"      ON saved_items FOR UPDATE USING (true);
CREATE POLICY "delete_saved"      ON saved_items FOR DELETE USING (true);

-- ─── Realtime : les prix se mettent à jour en direct ───
ALTER PUBLICATION supabase_realtime ADD TABLE rune_prices;
ALTER PUBLICATION supabase_realtime ADD TABLE items;

-- ─── Trigger : auto-update updated_at ───
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_items_updated
  BEFORE UPDATE ON items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_rune_prices_updated
  BEFORE UPDATE ON rune_prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
