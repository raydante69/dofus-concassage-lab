// ═══════════════════════════════════════════════════
// Dofus Game Constants — VRAIE formule de brisage
// Source: KamaMaster / DofusDB / Calculateur_Brisage_Dofus
// ═══════════════════════════════════════════════════

export var CHAR_MAP = {
  1:  { fr: 'PA',             rune: 'Pa',     w: 100 },
  10: { fr: 'Force',          rune: 'Fo',     w: 1   },
  11: { fr: 'Vitalité',       rune: 'Vi',     w: 0.2 },
  12: { fr: 'Sagesse',        rune: 'Sa',     w: 3   },
  13: { fr: 'Chance',         rune: 'Cha',    w: 1   },
  14: { fr: 'Agilité',        rune: 'Agi',    w: 1   },
  15: { fr: 'Intelligence',   rune: 'Ine',    w: 1   },
  18: { fr: 'Portée',         rune: 'Po',     w: 51  },
  19: { fr: 'Invocations',    rune: 'Invo',   w: 30  },
  20: { fr: 'Coups Critiques', rune: 'CC',    w: 10  },
  23: { fr: 'PM',             rune: 'Pm',     w: 90  },
  25: { fr: 'Puissance',      rune: 'Pui',    w: 2   },
  26: { fr: 'Dommages',       rune: 'Do',     w: 20  },
  27: { fr: 'Do Critiques',   rune: 'DoCri',  w: 5   },
  28: { fr: 'Soins',          rune: 'Soin',   w: 10  },
  33: { fr: '% Rés Neutre',   rune: 'RéNeu%', w: 2   },
  34: { fr: '% Rés Terre',    rune: 'RéTer%', w: 2   },
  35: { fr: '% Rés Feu',      rune: 'RéFeu%', w: 2   },
  36: { fr: '% Rés Eau',      rune: 'RéEau%', w: 2   },
  37: { fr: '% Rés Air',      rune: 'RéAir%', w: 2   },
  44: { fr: 'Initiative',     rune: 'Ini',    w: 0.1 },
  48: { fr: 'Prospection',    rune: 'Prosp',  w: 3   },
  77: { fr: 'Esquive PA',     rune: 'EsqPa',  w: 7   },
  78: { fr: 'Esquive PM',     rune: 'EsqPm',  w: 7   },
  79: { fr: 'Retrait PA',     rune: 'RetPa',  w: 7   },
  82: { fr: 'Retrait PM',     rune: 'RetPm',  w: 7   },
  84: { fr: 'Do Mêlée',       rune: 'DoMêl',  w: 15  },
  85: { fr: 'Do Distance',    rune: 'DoDist', w: 15  },
  88: { fr: 'Rés Terre',      rune: 'RéTer',  w: 2   },
  89: { fr: 'Rés Eau',        rune: 'RéEau',  w: 2   },
  90: { fr: 'Rés Air',        rune: 'RéAir',  w: 2   },
  91: { fr: 'Rés Feu',        rune: 'RéFeu',  w: 2   },
  92: { fr: 'Rés Neutre',     rune: 'RéNeu',  w: 2   },
}

export var TYPE_ICONS = {
  'Amulette': '📿', 'Anneau': '💍', 'Chapeau': '🎩',
  'Cape': '🧥', 'Ceinture': '🎗️', 'Bottes': '👢',
  'Bouclier': '🛡️', 'Épée': '⚔️', 'Arc': '🏹',
  'Baguette': '🪄', 'Bâton': '🏑', 'Dague': '🗡️',
  'Marteau': '🔨', 'Pelle': '⛏️', 'Hache': '🪓',
  'Faux': '🌾', 'Pioche': '⚒️', 'Ressource': '🧱',
}

export var EQUIPMENT_TYPES = [
  'Amulette', 'Anneau', 'Chapeau', 'Cape', 'Ceinture', 'Bottes',
  'Bouclier', 'Épée', 'Arc', 'Baguette', 'Bâton', 'Dague',
  'Marteau', 'Pelle', 'Hache', 'Faux', 'Pioche',
]

// ─── Vraie formule de brisage Dofus ───
// Formule : poids_rune = (jet_stat * poids_stat * niveau_item * 0.015) + 1
// Source : KamaMaster / Calculateur_Brisage_Dofus (GitHub)

export function computeRuneBreakdown(effects, itemLevel) {
  var runes = {}
  var lvl = itemLevel || 1

  for (var i = 0; i < (effects || []).length; i++) {
    var e = effects[i]
    var c = CHAR_MAP[e.c]
    if (!c) continue
    var maxVal = Math.max(e.f || 0, e.t || 0)
    if (maxVal <= 0) continue

    // Vraie formule avec le niveau
    var weight = (maxVal * c.w * lvl * 0.015) + 1

    if (!runes[c.rune]) runes[c.rune] = { name: c.rune, stat: c.fr, weight: 0, maxVal: 0 }
    runes[c.rune].weight += weight
    runes[c.rune].maxVal += maxVal
  }

  var result = []
  var keys = Object.keys(runes)
  for (var j = 0; j < keys.length; j++) { result.push(runes[keys[j]]) }
  result.sort(function(a, b) { return b.weight - a.weight })
  return result
}

export function computeEstimatedValue(runeBreakdown, runePrices) {
  var total = 0
  for (var i = 0; i < runeBreakdown.length; i++) {
    var r = runeBreakdown[i]
    var price = runePrices[r.name] || 0
    total += r.weight * price
  }
  return total
}

export function computeProfitability(estimatedValue, cost, coefficient) {
  var adj = estimatedValue * (coefficient / 100)
  var profit = adj - cost
  var roi = cost > 0 ? (profit / cost) * 100 : (profit > 0 ? 999 : 0)
  return { adjustedValue: adj, profit: profit, roi: roi }
}
