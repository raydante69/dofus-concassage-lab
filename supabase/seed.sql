-- ═══════════════════════════════════════════════════════════
-- SEED DATA — Exécuter APRÈS schema.sql
-- ═══════════════════════════════════════════════════════════

-- ─── Prix des runes ───
INSERT INTO rune_prices (name, price) VALUES
  ('Pa', 45000), ('Pm', 38000), ('Po', 12000),
  ('Fo', 380), ('Vi', 45), ('Sa', 1450),
  ('Cha', 360), ('Agi', 420), ('Ine', 340),
  ('Pui', 280), ('Do', 4200), ('CC', 2800),
  ('Ini', 8), ('Prosp', 1600), ('Soin', 2400),
  ('Invo', 8500), ('DoCri', 1200),
  ('EsqPa', 1800), ('EsqPm', 1800),
  ('RetPa', 1800), ('RetPm', 1800),
  ('RéNeu%', 480), ('RéTer%', 480), ('RéFeu%', 480),
  ('RéEau%', 480), ('RéAir%', 480),
  ('RéTer', 480), ('RéEau', 480), ('RéAir', 480),
  ('RéFeu', 480), ('RéNeu', 480),
  ('DoMêl', 3600), ('DoDist', 3600)
ON CONFLICT (name) DO NOTHING;

-- ─── Équipements (encyclopédie de départ) ───
INSERT INTO items (dofus_id, name, level, type, description, effects, recipe, drops) VALUES
  (2411, 'Coiffe du Bouftou', 20, 'Chapeau',
   'Ce superbe chapeau permet à son porteur de gagner force et intelligence.',
   '[{"c":10,"f":16,"t":25},{"c":15,"f":16,"t":25},{"c":11,"f":21,"t":30}]',
   '[{"n":"Cuir de Bouftou","q":4},{"n":"Laine de Bouftou","q":2},{"n":"Dent de Bouftou","q":1}]',
   '["Chef de Guerre Bouftou","Bouftou Royal"]'),

  (2414, 'Cape Bouffante', 20, 'Cape',
   'Une cape fabriquée à partir de laine de Bouftou.',
   '[{"c":11,"f":51,"t":80},{"c":44,"f":11,"t":20}]',
   '[{"n":"Laine de Bouftou","q":5},{"n":"Cuir de Bouftou","q":2}]',
   '["Chef de Guerre Bouftou","Bouflet le Puéril"]'),

  (2416, 'Amulette du Bouftou', 20, 'Amulette',
   'Cette amulette rend sage comme un Bouftou.',
   '[{"c":12,"f":1,"t":15}]',
   '[{"n":"Dent de Bouftou","q":3},{"n":"Laine de Bouftou","q":1}]',
   '["Bouftou Royal"]'),

  (2469, 'Gelano', 60, 'Anneau',
   'Inutile de vous ronger les ongles avec cet anneau, léchez-vous les doigts !',
   '[{"c":1,"f":1,"t":0}]',
   '[{"n":"Saphir","q":1},{"n":"Bauxite","q":8},{"n":"Étain","q":8}]',
   '["Gelée Royale Menthe"]'),

  (2467, 'Kam Assutra', 50, 'Amulette',
   'Amulette portant le nom d''une ancienne reine.',
   '[{"c":1,"f":1,"t":0}]',
   '[{"n":"Saphir","q":1},{"n":"Ébène","q":5}]', '[]'),

  (7032, 'Coiffe du Kwak de Flamme', 37, 'Chapeau',
   'Chapeau flamboyant en plumes de Kwak.',
   '[{"c":15,"f":16,"t":25},{"c":11,"f":31,"t":50},{"c":12,"f":1,"t":10}]',
   '[{"n":"Plume du Kwak de Flamme","q":10},{"n":"Bec du Kwak de Flamme","q":2}]',
   '["Kwak de Flamme"]'),

  (8243, 'Chapeau Blop Griotte Royal', 80, 'Chapeau',
   'Chapeau royal rouge cerise.',
   '[{"c":11,"f":101,"t":150},{"c":10,"f":21,"t":35},{"c":12,"f":11,"t":20},{"c":48,"f":1,"t":3}]',
   '[{"n":"Pétale Griotte du Blop Royal","q":5},{"n":"Feuille du Blop Griotte","q":20}]',
   '["Blop Griotte Royal"]'),

  (10838, 'Amulette du Minotot', 120, 'Amulette',
   'Le Minotot ne quittait jamais cette amulette.',
   '[{"c":11,"f":151,"t":200},{"c":10,"f":31,"t":40},{"c":12,"f":21,"t":30},{"c":26,"f":4,"t":6},{"c":20,"f":1,"t":2}]',
   '[{"n":"Corne de Minotot","q":3},{"n":"Cuir de Minotot","q":8}]',
   '["Minotot"]'),

  (11442, 'Amulette Dofusteuse', 150, 'Amulette',
   'Même les Dofus vous regardent avec envie.',
   '[{"c":11,"f":201,"t":250},{"c":10,"f":31,"t":50},{"c":15,"f":31,"t":50},{"c":12,"f":21,"t":30},{"c":1,"f":1,"t":0},{"c":20,"f":3,"t":5},{"c":48,"f":6,"t":10}]',
   '[{"n":"Galet Choumarien","q":5},{"n":"Sève de Bambou Sacré","q":10}]', '[]'),

  (33608, 'Col du Ventrublion', 200, 'Amulette',
   'Objet tellement massif qu''il sera difficile de vous attraper par le col.',
   '[{"c":11,"f":451,"t":500},{"c":15,"f":31,"t":40},{"c":12,"f":41,"t":50},{"c":25,"f":41,"t":50},{"c":1,"f":1,"t":0},{"c":33,"f":9,"t":12},{"c":36,"f":9,"t":12},{"c":84,"f":31,"t":40}]',
   '[]', '["Ventrublion","Armubarak","Ventrublaze"]'),

  (11356, 'Cape du Comte Harebourg', 190, 'Cape',
   'Cape impériale portant l''emblème du Comte Harebourg.',
   '[{"c":11,"f":301,"t":350},{"c":10,"f":41,"t":60},{"c":12,"f":31,"t":40},{"c":1,"f":1,"t":0},{"c":25,"f":31,"t":50},{"c":48,"f":8,"t":12},{"c":84,"f":11,"t":15}]',
   '[{"n":"Bandelette du Comte Harebourg","q":1},{"n":"Étoffe du Frizz","q":10}]',
   '["Comte Harebourg"]');
