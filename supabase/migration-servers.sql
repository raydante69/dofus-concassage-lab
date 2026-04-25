-- ═══════════════════════════════════════════════
-- MIGRATION : Support multi-serveur
-- Exécuter dans SQL Editor de Supabase
-- ═══════════════════════════════════════════════

-- 1. Ajouter la colonne server
ALTER TABLE rune_prices ADD COLUMN IF NOT EXISTS server TEXT DEFAULT 'Imagiro';

-- 2. Mettre à jour les lignes existantes
UPDATE rune_prices SET server = 'Imagiro' WHERE server IS NULL;

-- 3. Supprimer l'ancienne contrainte unique
ALTER TABLE rune_prices DROP CONSTRAINT IF EXISTS rune_prices_name_key;

-- 4. Nouvelle contrainte : unique par (name, server)
ALTER TABLE rune_prices ADD CONSTRAINT rune_prices_name_server_key UNIQUE (name, server);

-- 5. Créer les prix pour chaque serveur
-- (copie les prix d'Imagiro vers tous les autres serveurs)
INSERT INTO rune_prices (name, price, server)
SELECT name, price, 'Ilyzaelle' FROM rune_prices WHERE server = 'Imagiro'
ON CONFLICT (name, server) DO NOTHING;

INSERT INTO rune_prices (name, price, server)
SELECT name, price, 'Draconiros' FROM rune_prices WHERE server = 'Imagiro'
ON CONFLICT (name, server) DO NOTHING;

INSERT INTO rune_prices (name, price, server)
SELECT name, price, 'Tylezia' FROM rune_prices WHERE server = 'Imagiro'
ON CONFLICT (name, server) DO NOTHING;

INSERT INTO rune_prices (name, price, server)
SELECT name, price, 'Hell Mina' FROM rune_prices WHERE server = 'Imagiro'
ON CONFLICT (name, server) DO NOTHING;

INSERT INTO rune_prices (name, price, server)
SELECT name, price, 'Oshimo' FROM rune_prices WHERE server = 'Imagiro'
ON CONFLICT (name, server) DO NOTHING;

INSERT INTO rune_prices (name, price, server)
SELECT name, price, 'Herdegrize' FROM rune_prices WHERE server = 'Imagiro'
ON CONFLICT (name, server) DO NOTHING;

INSERT INTO rune_prices (name, price, server)
SELECT name, price, 'Brutas' FROM rune_prices WHERE server = 'Imagiro'
ON CONFLICT (name, server) DO NOTHING;

-- 6. Index pour la performance
CREATE INDEX IF NOT EXISTS idx_rune_prices_server ON rune_prices (server);
