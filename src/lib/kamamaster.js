// ═══════════════════════════════════════════════════════════
// KamaMaster API — source unique de vérité
// ═══════════════════════════════════════════════════════════

var KM_BASE = 'https://api.kamamaster.fr'

// Liste de secours (si /api/hdv/serveurs est indisponible)
export var KM_SERVERS_FALLBACK = [
  'Imagiro', 'Draconiros', 'Tylezia', 'Hell Mina',
  'Brial', 'Dakal', 'Kourial', 'Mikhal',
  'Ombre', 'Orukam', 'Rafal', 'Salar', 'Tal Kasha',
]

export async function fetchKMServers() {
  try {
    var r = await fetch(KM_BASE + '/api/hdv/serveurs', { signal: AbortSignal.timeout(6000) })
    if (!r.ok) throw new Error('HTTP ' + r.status)
    var data = await r.json()
    // Réponse : tableau de strings ["Brial", "Dakal", ...]
    return Array.isArray(data) ? data : KM_SERVERS_FALLBACK
  } catch (e) {
    console.warn('[KamaMaster] fetchKMServers:', e.message)
    return KM_SERVERS_FALLBACK
  }
}

// Normalise un item HDV retourné par /api/hdv/serveur
function normalizeHdvItem(raw, server) {
  return {
    ankama_id: raw.ankamaId,
    name:      raw.name || ('Item #' + raw.ankamaId),
    price:     parseInt(raw.price) || 0,
    server:    server,
    type:      raw.type || '',
    level:     raw.level || 1,
    img_url:   (raw.image_urls && raw.image_urls.icon) || null,
  }
}

// Récupère les prix HDV d'un serveur depuis KamaMaster
// Retourne un tableau de rows prêtes pour hdv_prices
export async function fetchKMHdvPrices(server) {
  var r = await fetch(
    KM_BASE + '/api/hdv/serveur?serveurName=' + encodeURIComponent(server),
    { signal: AbortSignal.timeout(30000) }
  )
  if (!r.ok) throw new Error('KamaMaster HDV ' + server + ': HTTP ' + r.status)
  var data = await r.json()
  var items = Array.isArray(data) ? data : (data.items || data.data || [])
  return items
    .filter(function(it) { return it.ankamaId && it.price })
    .map(function(it) { return normalizeHdvItem(it, server) })
    .filter(function(it) { return it.price > 0 })
}
