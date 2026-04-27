-- ═══════════════════════════════════════════════════════════
-- NETTOYAGE BDD — Dofus Concassage Lab
-- Exécuter dans le SQL Editor de Supabase
-- ═══════════════════════════════════════════════════════════

-- ÉTAPE 1 : Supprimer tout ce qui n'est pas un équipement brisable
DELETE FROM items
WHERE type NOT IN (
  'Amulette', 'Anneau', 'Chapeau', 'Cape', 'Ceinture', 'Bottes',
  'Bouclier', 'Épée', 'Arc', 'Baguette', 'Bâton', 'Dague',
  'Marteau', 'Pelle', 'Hache', 'Faux', 'Pioche'
);

-- ÉTAPE 2 : Supprimer les doublons — garder le plus ancien (id le plus bas) par dofus_id
DELETE FROM items a
USING items b
WHERE a.dofus_id IS NOT NULL
  AND a.dofus_id = b.dofus_id
  AND a.id > b.id;

-- ÉTAPE 3 : Supprimer les items sans dofus_id qui sont en double par nom
DELETE FROM items a
USING items b
WHERE a.dofus_id IS NULL
  AND b.dofus_id IS NULL
  AND a.name = b.name
  AND a.id > b.id;

-- ÉTAPE 4 : Ajouter la contrainte UNIQUE sur dofus_id (empêche les futurs doublons)
ALTER TABLE items
  DROP CONSTRAINT IF EXISTS items_dofus_id_key;

ALTER TABLE items
  ADD CONSTRAINT items_dofus_id_key UNIQUE (dofus_id);

-- ÉTAPE 5 : Index sur type pour les filtres encyclopédie
CREATE INDEX IF NOT EXISTS idx_items_type_level ON items (type, level);

-- VÉRIFICATION — afficher le compte par type après nettoyage
SELECT type, COUNT(*) as nb FROM items GROUP BY type ORDER BY nb DESC;
