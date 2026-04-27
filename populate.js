// populate.js — Importe items + prix HDV depuis KamaMaster vers Supabase
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// ── Lecture du .env ──────────────────────────────────────────
function loadEnv() {
  var content = readFileSync('.env', 'utf-8')
  var env = {}
  for (var line of content.split('\n')) {
    var trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    var eq = trimmed.indexOf('=')
    if (eq < 0) continue
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return env
}

var env = loadEnv()
var SUPABASE_URL = env.VITE_SUPABASE_URL
var SUPABASE_KEY = env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Erreur : VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY manquant dans .env')
  process.exit(1)
}

var db = createClient(SUPABASE_URL, SUPABASE_KEY)

var KM_BASE = 'https://api.kamamaster.fr'

var EQUIP_TYPES = new Set([
  'Amulette', 'Anneau', 'Chapeau', 'Cape', 'Ceinture', 'Bottes',
  'Bouclier', 'Épée', 'Arc', 'Baguette', 'Bâton', 'Dague',
  'Marteau', 'Pelle', 'Hache', 'Faux', 'Pioche',
])

// ════════════════════════════════════════════════════════════
// PHASE 1 — Équipements
// ════════════════════════════════════════════════════════════

function parseEffects(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(e => e.id !== -1 && (e.int_maximum || e.max || 0) > 0)
    .map(e => ({
      stat_id:   e.stat_id   ?? e.id ?? null,
      stat_name: e.stat_name ?? e.name ?? null,
      min:       e.int_minimum ?? e.min ?? 0,
      max:       e.int_maximum ?? e.max ?? 0,
    }))
}

function parseRecipe(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(r => r.item_ankama_id && r.quantity)
    .map(r => ({ ankama_id: r.item_ankama_id, quantity: r.quantity }))
}

async function phase1() {
  console.log('\n══ PHASE 1 : Équipements ══════════════════════════════')
  console.log('Fetch KamaMaster /api/equipement/all …')

  var r = await fetch(KM_BASE + '/api/equipement/all', { signal: AbortSignal.timeout(60000) })
  if (!r.ok) throw new Error('KamaMaster equipement/all : HTTP ' + r.status)
  var data = await r.json()

  var raw = Array.isArray(data) ? data : (data.items || data.data || [])
  console.log('Items bruts reçus :', raw.length)

  var items = raw
    .filter(it => {
      var typeName = it.type?.name ?? it.type ?? ''
      return EQUIP_TYPES.has(typeName)
    })
    .map(it => ({
      ankama_id: it.ankama_id ?? it.id,
      name:      it.name || ('Item #' + (it.ankama_id ?? it.id)),
      type:      it.type?.name ?? it.type ?? '',
      level:     it.level ?? 1,
      effects:   parseEffects(it.effects ?? it.stats ?? []),
      recipe:    parseRecipe(it.recipe ?? it.ingredients ?? []),
      img_url:   it.image_url ?? it.img ?? null,
    }))
    .filter(it => it.ankama_id)

  console.log('Équipements filtrés :', items.length)

  var BS = 200, ok = 0, err = 0
  for (var i = 0; i < items.length; i += BS) {
    var batch = items.slice(i, i + BS)
    var { error } = await db.from('items').upsert(batch, { onConflict: 'ankama_id' })
    if (error) {
      console.error('  Erreur batch', Math.floor(i / BS) + 1, ':', error.message)
      err += batch.length
    } else {
      ok += batch.length
      process.stdout.write('\r  Insérés : ' + ok + ' / ' + items.length)
    }
  }
  console.log('\n  OK :', ok, '  Erreurs :', err)
}

// ════════════════════════════════════════════════════════════
// PHASE 2 — Prix HDV Imagiro
// ════════════════════════════════════════════════════════════

function normalizeHdv(raw, server) {
  return {
    ankama_id: raw.ankamaId,
    name:      raw.name || ('Item #' + raw.ankamaId),
    price:     parseInt(raw.price) || 0,
    server,
    type:      raw.type || '',
    level:     raw.level || 1,
    img_url:   raw.image_urls?.icon ?? null,
  }
}

async function phase2(server = 'Imagiro') {
  console.log('\n══ PHASE 2 : Prix HDV — ' + server + ' ═══════════════════')
  console.log('Fetch KamaMaster /api/hdv/serveur …')

  var r = await fetch(
    KM_BASE + '/api/hdv/serveur?serveurName=' + encodeURIComponent(server),
    { signal: AbortSignal.timeout(60000) }
  )
  if (!r.ok) throw new Error('KamaMaster HDV : HTTP ' + r.status)
  var data = await r.json()

  var raw = Array.isArray(data) ? data : (data.items || data.data || [])
  console.log('Items HDV bruts :', raw.length)

  var rows = raw
    .filter(it => it.ankamaId && it.price)
    .map(it => normalizeHdv(it, server))
    .filter(it => it.price > 0)

  console.log('Lignes à insérer :', rows.length)

  var BS = 500, ok = 0, err = 0
  for (var i = 0; i < rows.length; i += BS) {
    var batch = rows.slice(i, i + BS)
    var { error } = await db.from('hdv_prices').upsert(batch, { onConflict: 'ankama_id,server' })
    if (error) {
      console.error('  Erreur batch', Math.floor(i / BS) + 1, ':', error.message)
      err += batch.length
    } else {
      ok += batch.length
      process.stdout.write('\r  Insérés : ' + ok + ' / ' + rows.length)
    }
  }
  console.log('\n  OK :', ok, '  Erreurs :', err)
}

// ════════════════════════════════════════════════════════════
// MAIN
//   node populate.js                → items + HDV Imagiro
//   node populate.js hdv Draconiros → HDV seulement, serveur donné
//   node populate.js hdv all        → HDV tous les serveurs
//   node populate.js items          → items seulement
// ════════════════════════════════════════════════════════════

var ALL_SERVERS = [
  'Imagiro', 'Draconiros', 'Tylezia', 'Hell Mina',
  'Brial', 'Dakal', 'Kourial', 'Mikhal',
  'Ombre', 'Orukam', 'Rafal', 'Salar', 'Tal Kasha',
]

async function main() {
  console.log('Supabase :', SUPABASE_URL)
  var mode   = process.argv[2] || 'all'
  var target = process.argv[3] || 'Imagiro'

  try {
    if (mode === 'items') {
      await phase1()
    } else if (mode === 'hdv') {
      var servers = target === 'all' ? ALL_SERVERS : [target]
      for (var srv of servers) await phase2(srv)
    } else {
      // défaut : items + HDV Imagiro
      await phase1()
      await phase2('Imagiro')
    }
    console.log('\nPopulation terminée.')
  } catch (e) {
    console.error('\nErreur fatale :', e.message)
    process.exit(1)
  }
}

main()
