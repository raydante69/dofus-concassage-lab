// ═══════════════════════════════════════════════════════════════
// Constantes Dofus — IDs KamaMaster, poids runes, formule brisage
// ═══════════════════════════════════════════════════════════════

// Mapping stat_id KamaMaster → info rune
// IDs fournis par KamaMaster (type.id dans les effets d'équipement)
export var CHAR_MAP = {
  // Caractéristiques principales
  12: { fr: 'PA',              rune: 'Pa',     w: 100  },
  23: { fr: 'PM',              rune: 'Pm',     w: 90   },
  18: { fr: 'Portée',          rune: 'Po',     w: 51   },
  9:  { fr: 'Vitalité',        rune: 'Vi',     w: 0.2  },
  10: { fr: 'Sagesse',         rune: 'Sa',     w: 3    },
  45: { fr: 'Force',           rune: 'Fo',     w: 1    },
  13: { fr: 'Intelligence',    rune: 'Ine',    w: 1    },
  22: { fr: 'Chance',          rune: 'Cha',    w: 1    },
  36: { fr: 'Agilité',         rune: 'Agi',    w: 1    },
  // Carac secondaires
  26: { fr: 'Puissance',       rune: 'Pui',    w: 2    },
  29: { fr: '% Critique',      rune: 'CC',     w: 10   },
  28: { fr: 'Invocations',     rune: 'Invo',   w: 30   },
  25: { fr: 'Prospection',     rune: 'Prosp',  w: 3    },
  24: { fr: 'Initiative',      rune: 'Ini',    w: 0.1  },
  // Dommages
  55: { fr: 'Dommages',        rune: 'Do',     w: 20   },
  56: { fr: 'Soins',           rune: 'Soin',   w: 10   },
  57: { fr: 'Do Critiques',    rune: 'DoCri',  w: 5    },
  54: { fr: 'Do Mêlée',        rune: 'DoMêl',  w: 15   },
  58: { fr: 'Do Distance',     rune: 'DoDist', w: 15   },
  // Esquive / Retrait PA/PM
  96: { fr: 'Esquive PA',      rune: 'EsqPa',  w: 7    },
  97: { fr: 'Esquive PM',      rune: 'EsqPm',  w: 7    },
  98: { fr: 'Retrait PA',      rune: 'RetPa',  w: 7    },
  99: { fr: 'Retrait PM',      rune: 'RetPm',  w: 7    },
  // Résistances %
  82: { fr: '% Rés Neutre',    rune: 'RéNeu%', w: 2    },
  83: { fr: '% Rés Terre',     rune: 'RéTer%', w: 2    },
  84: { fr: '% Rés Feu',       rune: 'RéFeu%', w: 2    },
  85: { fr: '% Rés Eau',       rune: 'RéEau%', w: 2    },
  86: { fr: '% Rés Air',       rune: 'RéAir%', w: 2    },
  // Résistances fixes
  87: { fr: 'Rés Neutre',      rune: 'RéNeu',  w: 2    },
  88: { fr: 'Rés Terre',       rune: 'RéTer',  w: 2    },
  89: { fr: 'Rés Feu',         rune: 'RéFeu',  w: 2    },
  90: { fr: 'Rés Eau',         rune: 'RéEau',  w: 2    },
  91: { fr: 'Rés Air',         rune: 'RéAir',  w: 2    },
}

// Fallback par nom de stat (français, insensible à la casse) si stat_id inconnu
var CHAR_MAP_BY_NAME = {
  'pa': CHAR_MAP[12], 'points d\'action': CHAR_MAP[12],
  'pm': CHAR_MAP[23], 'points de mouvement': CHAR_MAP[23],
  'portée': CHAR_MAP[18], 'portee': CHAR_MAP[18], 'po': CHAR_MAP[18],
  'vitalité': CHAR_MAP[9], 'vitalite': CHAR_MAP[9], 'vi': CHAR_MAP[9],
  'sagesse': CHAR_MAP[10], 'sa': CHAR_MAP[10],
  'force': CHAR_MAP[45], 'fo': CHAR_MAP[45],
  'intelligence': CHAR_MAP[13], 'ine': CHAR_MAP[13],
  'chance': CHAR_MAP[22], 'cha': CHAR_MAP[22],
  'agilité': CHAR_MAP[36], 'agilite': CHAR_MAP[36], 'agi': CHAR_MAP[36],
  'puissance': CHAR_MAP[26], 'pui': CHAR_MAP[26],
  '% critique': CHAR_MAP[29], 'coups critiques': CHAR_MAP[29], 'cc': CHAR_MAP[29],
  'invocations': CHAR_MAP[28], 'invo': CHAR_MAP[28],
  'prospection': CHAR_MAP[25], 'prosp': CHAR_MAP[25],
  'initiative': CHAR_MAP[24], 'ini': CHAR_MAP[24],
  'dommages': CHAR_MAP[55], 'do': CHAR_MAP[55],
  'soins': CHAR_MAP[56], 'soin': CHAR_MAP[56],
  'esquive pa': CHAR_MAP[96], 'esqpa': CHAR_MAP[96],
  'esquive pm': CHAR_MAP[97], 'esqpm': CHAR_MAP[97],
  'retrait pa': CHAR_MAP[98], 'retpa': CHAR_MAP[98],
  'retrait pm': CHAR_MAP[99], 'retpm': CHAR_MAP[99],
}

function lookupByName(name) {
  if (!name) return null
  return CHAR_MAP_BY_NAME[name.toLowerCase().trim()] || null
}

export function getStatInfo(statId, statName) {
  if (statId !== undefined && CHAR_MAP[statId]) return CHAR_MAP[statId]
  return lookupByName(statName)
}

export var TYPE_ICONS = {
  'Amulette': '📿', 'Anneau': '💍', 'Chapeau': '🎩',
  'Cape': '🧥', 'Ceinture': '🎗️', 'Bottes': '👢',
  'Bouclier': '🛡️', 'Épée': '⚔️', 'Arc': '🏹',
  'Baguette': '🪄', 'Bâton': '🏑', 'Dague': '🗡️',
  'Marteau': '🔨', 'Pelle': '⛏️', 'Hache': '🪓',
  'Faux': '🌾', 'Pioche': '⚒️',
}

export var EQUIPMENT_TYPES = [
  'Amulette', 'Anneau', 'Chapeau', 'Cape', 'Ceinture', 'Bottes',
  'Bouclier', 'Épée', 'Arc', 'Baguette', 'Bâton', 'Dague',
  'Marteau', 'Pelle', 'Hache', 'Faux', 'Pioche',
]

// ─── Formule de brisage ──────────────────────────────────────
// rune_units = (niveau × int_max × poids_stat × coeff) / 10000
// coeff est en % (100 = 100%, 4000 = 4000%)
// Résultat : nombre d'unités de rune de ce type obtenues

export function computeRuneBreakdown(effects, itemLevel, coeff) {
  var runes = {}
  var lvl = itemLevel || 1
  var c = (coeff !== undefined ? coeff : 100)

  for (var i = 0; i < (effects || []).length; i++) {
    var e = effects[i]

    // Support nouveau format KamaMaster {stat_id, stat_name, min, max}
    // ET ancien format DofusDB {c, f, t}
    var statId   = e.stat_id   !== undefined ? e.stat_id   : e.c
    var statName = e.stat_name !== undefined ? e.stat_name : null
    var maxVal   = e.max       !== undefined ? e.max       : Math.max(e.f || 0, e.t || 0)

    if (maxVal <= 0) continue

    var ch = getStatInfo(statId, statName)
    if (!ch) continue

    var units = (lvl * maxVal * ch.w * c) / 10000
    if (units <= 0) continue

    if (!runes[ch.rune]) {
      runes[ch.rune] = { name: ch.rune, stat: ch.fr, units: 0, maxVal: 0 }
    }
    runes[ch.rune].units  += units
    runes[ch.rune].maxVal += maxVal
  }

  var result = Object.values(runes)
  result.sort(function(a, b) { return b.units - a.units })
  return result
}

export function computeEstimatedValue(runeBreakdown, runePrices) {
  var total = 0
  for (var i = 0; i < runeBreakdown.length; i++) {
    var r = runeBreakdown[i]
    var price = (runePrices && runePrices[r.name]) || 0
    total += r.units * price
  }
  return total
}

// ─── Dérive les prix des runes depuis les prix HDV ──────────
// Les runes sont des items HDV dont le nom commence par "Rune "
// (pas "Ra Rune" ni "Pa Rune")
export function deriveRunePricesFromHdv(hdvMap) {
  var runePrices = {}
  var vals = Object.values(hdvMap)
  for (var i = 0; i < vals.length; i++) {
    var item = vals[i]
    if (!item.name || !item.price) continue
    var name = item.name.trim()
    // Identifie les runes basiques : "Rune Pa", "Rune Vi", etc.
    // Exclut "Ra Rune", "Pa Rune" (variantes puissantes)
    if (name.startsWith('Rune ') && !name.startsWith('Rune de ')) {
      var runeCode = name.slice(5).trim()  // "Rune Pa" → "Pa"
      if (runeCode && item.price > 0) {
        runePrices[runeCode] = item.price
      }
    }
  }
  return runePrices
}
