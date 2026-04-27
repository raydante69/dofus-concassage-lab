-- ═══════════════════════════════════════════════════════════
-- SCHEMA v2 — KamaMaster comme source unique de vérité
-- Exécuter dans le SQL Editor de Supabase (dans l'ordre)
-- ═══════════════════════════════════════════════════════════

-- ── 1. Vider la table items (repartir de zéro) ──────────────
TRUNCATE TABLE items RESTART IDENTITY CASCADE;

-- ── 2. Ajouter ankama_id à items ────────────────────────────
ALTER TABLE items ADD COLUMN IF NOT EXISTS ankama_id INTEGER;
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_dofus_id_key;
ALTER TABLE items DROP CONSTRAINT IF EXISTS items_ankama_id_key;
ALTER TABLE items ADD CONSTRAINT items_ankama_id_key UNIQUE (ankama_id);
CREATE INDEX IF NOT EXISTS idx_items_ankama ON items (ankama_id);

-- Les effets seront stockés dans le nouveau format KamaMaster :
-- [{stat_id, stat_name, min, max}]
-- Les recettes : [{ankama_id, quantity}]

-- ── 3. Créer la table hdv_prices ────────────────────────────
CREATE TABLE IF NOT EXISTS hdv_prices (
  id          BIGSERIAL PRIMARY KEY,
  ankama_id   INTEGER NOT NULL,
  name        TEXT NOT NULL,
  price       INTEGER NOT NULL DEFAULT 0,
  server      TEXT NOT NULL DEFAULT 'Imagiro',
  type        TEXT DEFAULT '',
  level       INTEGER DEFAULT 1,
  img_url     TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT hdv_prices_ankama_server_key UNIQUE (ankama_id, server)
);

-- ── 4. RLS sur hdv_prices ────────────────────────────────────
ALTER TABLE hdv_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "read_hdv"   ON hdv_prices FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "insert_hdv" ON hdv_prices FOR INSERT WITH CHECK (true);
CREATE POLICY IF NOT EXISTS "update_hdv" ON hdv_prices FOR UPDATE USING (true);
CREATE POLICY IF NOT EXISTS "delete_hdv" ON hdv_prices FOR DELETE USING (true);

-- ── 5. Index hdv_prices ──────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_hdv_server       ON hdv_prices (server);
CREATE INDEX IF NOT EXISTS idx_hdv_ankama       ON hdv_prices (ankama_id);
CREATE INDEX IF NOT EXISTS idx_hdv_name         ON hdv_prices USING gin(to_tsvector('french', name));
CREATE INDEX IF NOT EXISTS idx_hdv_server_type  ON hdv_prices (server, type);

-- ── 6. Trigger updated_at sur hdv_prices ────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_hdv_updated ON hdv_prices;
CREATE TRIGGER trg_hdv_updated
  BEFORE UPDATE ON hdv_prices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── 7. Activer Realtime sur hdv_prices ──────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE hdv_prices;

-- ── 8. Vérification ─────────────────────────────────────────
SELECT 'items: '     || COUNT(*) FROM items
UNION ALL
SELECT 'hdv_prices: ' || COUNT(*) FROM hdv_prices;
