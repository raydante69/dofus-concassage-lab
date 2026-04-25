// ═══════════════════════════════════════════════════
// Dofus Game Constants
// ═══════════════════════════════════════════════════

export const CHAR_MAP = {
  1:{fr:'PA',rune:'Pa',w:100},10:{fr:'Force',rune:'Fo',w:1},11:{fr:'Vitalité',rune:'Vi',w:0.2},
  12:{fr:'Sagesse',rune:'Sa',w:3},13:{fr:'Chance',rune:'Cha',w:1},14:{fr:'Agilité',rune:'Agi',w:1},
  15:{fr:'Intelligence',rune:'Ine',w:1},18:{fr:'Portée',rune:'Po',w:51},19:{fr:'Invocations',rune:'Invo',w:30},
  20:{fr:'Coups Critiques',rune:'CC',w:10},23:{fr:'PM',rune:'Pm',w:90},25:{fr:'Puissance',rune:'Pui',w:2},
  26:{fr:'Dommages',rune:'Do',w:20},27:{fr:'Do Critiques',rune:'DoCri',w:5},28:{fr:'Soins',rune:'Soin',w:10},
  33:{fr:'% Rés Neutre',rune:'RéNeu%',w:2},34:{fr:'% Rés Terre',rune:'RéTer%',w:2},
  35:{fr:'% Rés Feu',rune:'RéFeu%',w:2},36:{fr:'% Rés Eau',rune:'RéEau%',w:2},
  37:{fr:'% Rés Air',rune:'RéAir%',w:2},44:{fr:'Initiative',rune:'Ini',w:0.1},
  48:{fr:'Prospection',rune:'Prosp',w:3},77:{fr:'Esquive PA',rune:'EsqPa',w:7},
  78:{fr:'Esquive PM',rune:'EsqPm',w:7},79:{fr:'Retrait PA',rune:'RetPa',w:7},
  82:{fr:'Retrait PM',rune:'RetPm',w:7},84:{fr:'Do Mêlée',rune:'DoMêl',w:15},
  85:{fr:'Do Distance',rune:'DoDist',w:15},88:{fr:'Rés Terre',rune:'RéTer',w:2},
  89:{fr:'Rés Eau',rune:'RéEau',w:2},90:{fr:'Rés Air',rune:'RéAir',w:2},
  91:{fr:'Rés Feu',rune:'RéFeu',w:2},92:{fr:'Rés Neutre',rune:'RéNeu',w:2},
}

export const TYPE_ICONS = {
  'Amulette':'📿','Anneau':'💍','Chapeau':'🎩','Cape':'🧥','Ceinture':'🎗️','Bottes':'👢',
  'Bouclier':'🛡️','Épée':'⚔️','Arc':'🏹','Baguette':'🪄','Bâton':'🏑','Dague':'🗡️',
  'Marteau':'🔨','Pelle':'⛏️','Hache':'🪓','Faux':'🌾','Pioche':'⚒️',
}

export var EQUIPMENT_TYPES = [
  'Amulette','Anneau','Chapeau','Cape','Ceinture','Bottes',
  'Bouclier','Épée','Arc','Baguette','Bâton','Dague',
  'Marteau','Pelle','Hache','Faux','Pioche',
]

// ─── Serveurs Dofus ───
export var SERVERS = [
  { id: 'draconiros', name: 'Draconiros', game: 'Dofus' },
  { id: 'imagiro', name: 'Imagiro', game: 'Dofus' },
  { id: 'ilyzaelle', name: 'Ilyzaelle', game: 'Dofus' },
  { id: 'jahash', name: 'Jahash', game: 'Dofus' },
  { id: 'hellmina', name: 'HellMina', game: 'Dofus' },
  { id: 'tylezia', name: 'Tylézia', game: 'Dofus' },
  { id: 'brutas', name: 'Brutas', game: 'Dofus Touch' },
  { id: 'dodge', name: 'Dodge', game: 'Dofus Touch' },
  { id: 'grandapan', name: 'Grandapan', game: 'Dofus Touch' },
  { id: 'herdegrize', name: 'Herdegrize', game: 'Dofus Touch' },
  { id: 'oshimo', name: 'Oshimo', game: 'Dofus Touch' },
  { id: 'terra', name: 'Terra Cogita', game: 'Dofus Touch' },
]

// ─── Coefficient de concassage réel (approximation par niveau) ───
// En Dofus, le rendement au concassage dépend du niveau de l'objet
export function getRealCoefficient(level) {
  if (level <= 10) return 30
  if (level <= 30) return 40
  if (level <= 50) return 50
  if (level <= 80) return 58
  if (level <= 100) return 65
  if (level <= 120) return 72
  if (level <= 140) return 78
  if (level <= 160) return 83
  if (level <= 180) return 88
  if (level <= 190) return 91
  return 94 // level 191-200
}

// ─── Calculs ───
export function computeRuneBreakdown(effects) {
  var runes = {}
  for (var i = 0; i < (effects || []).length; i++) {
    var e = effects[i]
    var c = CHAR_MAP[e.c]
    if (!c) continue
    var maxVal = Math.max(e.f || 0, e.t || 0)
    if (maxVal <= 0) continue
    var weight = maxVal * c.w
    if (weight <= 0) continue
    if (!runes[c.rune]) runes[c.rune] = { name: c.rune, stat: c.fr, weight: 0, maxVal: 0 }
    runes[c.rune].weight += weight
    runes[c.rune].maxVal += maxVal
  }
  return Object.values(runes).sort(function(a, b) { return b.weight - a.weight })
}

export function computeEstimatedValue(runeBreakdown, runePrices) {
  var total = 0
  for (var i = 0; i < runeBreakdown.length; i++) {
    var r = runeBreakdown[i]
    total += r.weight * (runePrices[r.name] || 0)
  }
  return total
}

export function computeProfitability(estimatedValue, cost, coefficient) {
  var adjustedValue = estimatedValue * (coefficient / 100)
  var profit = adjustedValue - cost
  var roi = cost > 0 ? (profit / cost) * 100 : (profit > 0 ? 999 : 0)
  return { adjustedValue: adjustedValue, profit: profit, roi: roi }
}
