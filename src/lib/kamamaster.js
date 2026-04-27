// ═══════════════════════════════════════════════════════════
// KamaMaster — Intégration prix HDV & runes
// Site : https://kamamaster.fr
// ═══════════════════════════════════════════════════════════

// Mapping nom serveur → slug KamaMaster (à ajuster si leur API utilise d'autres noms)
var SERVER_SLUGS = {
  'Imagiro':     'imagiro',
  'Ilyzaelle':   'ilyzaelle',
  'Draconiros':  'draconiros',
  'Tylezia':     'tylezia',
  'Hell Mina':   'hell-mina',
  'Oshimo':      'oshimo',
  'Herdegrize':  'herdegrize',
  'Brutas':      'brutas',
}

// Mapping noms KamaMaster → noms runes internes
// (à ajuster selon le format retourné par KamaMaster)
var RUNE_NAME_MAP = {
  'pa': 'Pa', 'pm': 'Pm', 'po': 'Po',
  'fo': 'Fo', 'fo%': 'Fo', 'vi': 'Vi', 'sa': 'Sa',
  'cha': 'Cha', 'cha%': 'Cha', 'agi': 'Agi', 'agi%': 'Agi',
  'ine': 'Ine', 'ine%': 'Ine', 'pui': 'Pui',
  'do': 'Do', 'cc': 'CC', 'ini': 'Ini', 'prosp': 'Prosp',
  'soin': 'Soin', 'invo': 'Invo', 'docri': 'DoCri',
  'esqpa': 'EsqPa', 'esqpm': 'EsqPm', 'retpa': 'RetPa', 'retpm': 'RetPm',
  'reNeu%': 'RéNeu%', 'reter%': 'RéTer%', 'refeu%': 'RéFeu%',
  'reeau%': 'RéEau%', 'reair%': 'RéAir%',
  'reter': 'RéTer', 'reeau': 'RéEau', 'reair': 'RéAir',
  'refeu': 'RéFeu', 'reneu': 'RéNeu',
  'domel': 'DoMêl', 'dodist': 'DoDist',
}

// Essaie de normaliser un nom de rune KamaMaster vers notre format interne
function normalizeRuneName(raw) {
  if (!raw) return null
  var key = raw.toLowerCase().replace(/[éèê]/g, 'e').replace(/[àâ]/g, 'a').replace(/[îï]/g, 'i').replace(/\s+/g, '')
  return RUNE_NAME_MAP[key] || null
}

// Fetche les prix de runes depuis KamaMaster pour un serveur donné.
// Retourne null si l'API est inaccessible (CORS, etc.).
// Le vrai endpoint KamaMaster est à découvrir via l'inspecteur réseau du navigateur.
export async function fetchKamaMasterRunePrices(server) {
  var slug = SERVER_SLUGS[server] || server.toLowerCase().replace(' ', '-')

  // Essaie plusieurs patterns d'API potentiels
  var candidates = [
    'https://kamamaster.fr/api/runes?server=' + slug,
    'https://kamamaster.fr/api/' + slug + '/runes',
    'https://api.kamamaster.fr/runes?server=' + slug,
    'https://kamamaster.fr/api/prices/runes/' + slug,
  ]

  for (var i = 0; i < candidates.length; i++) {
    try {
      var resp = await fetch(candidates[i], {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(5000),
      })
      if (!resp.ok) continue
      var data = await resp.json()
      var prices = parseKamaMasterRunes(data)
      if (prices && Object.keys(prices).length > 5) {
        console.log('[KamaMaster] Prix runes OK depuis', candidates[i])
        return prices
      }
    } catch (e) {
      // Endpoint non accessible, essaie le suivant
    }
  }

  console.warn('[KamaMaster] Aucun endpoint disponible pour', server, '— utilisation des prix Supabase')
  return null
}

// Essaie de parser différents formats de réponse KamaMaster
function parseKamaMasterRunes(data) {
  if (!data) return null
  var prices = {}

  // Format 1 : { runes: [ { name: "Pa", price: 45000 }, ... ] }
  if (Array.isArray(data.runes)) {
    data.runes.forEach(function(r) {
      var n = normalizeRuneName(r.name || r.rune || r.id)
      var p = r.price || r.value || r.avg || 0
      if (n && p > 0) prices[n] = p
    })
    return prices
  }

  // Format 2 : tableau direct [ { name: "Pa", price: 45000 }, ... ]
  if (Array.isArray(data)) {
    data.forEach(function(r) {
      var n = normalizeRuneName(r.name || r.rune || r.id)
      var p = r.price || r.value || r.avg || 0
      if (n && p > 0) prices[n] = p
    })
    return prices
  }

  // Format 3 : objet { Pa: 45000, Pm: 38000, ... }
  if (typeof data === 'object') {
    Object.keys(data).forEach(function(k) {
      var n = normalizeRuneName(k)
      var p = typeof data[k] === 'number' ? data[k] : (data[k].price || 0)
      if (n && p > 0) prices[n] = p
    })
    return prices
  }

  return null
}

// Coefficient de brisage réel par niveau (approximation documentée)
// Source : expériences communautaires et KamaMaster
export function realCoefByLevel(level) {
  if (level <= 50)  return 78
  if (level <= 100) return 82
  if (level <= 150) return 86
  return 90
}
