import { useState, useEffect, useMemo, useCallback, useRef, Component } from 'react'
import { Search, ArrowLeft, Sparkles, Hammer, BookOpen, BarChart3, Loader2,
         ChevronLeft, ChevronRight, ArrowUpDown, RefreshCw, TrendingUp,
         ShoppingCart, Wrench, AlertCircle } from 'lucide-react'
import { db, getItems, getAllItems, getItemByName, getItemByAnkamaId,
         getHdvPrices, bulkUpsertHdvPrices } from './lib/supabase'
import { CHAR_MAP, TYPE_ICONS, EQUIPMENT_TYPES, getStatInfo,
         computeRuneBreakdown, computeEstimatedValue,
         deriveRunePricesFromHdv } from './lib/constants'
import { fetchKMServers, fetchKMHdvPrices, KM_SERVERS_FALLBACK } from './lib/kamamaster'

// ─── Error boundary ──────────────────────────────────────────
class EB extends Component {
  constructor(p) { super(p); this.state = { e: false, err: null } }
  static getDerivedStateFromError(e) { return { e: true, err: e } }
  render() {
    if (this.state.e) return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: '#ef4444' }}>Erreur</h2>
        <p style={{ color: '#64748b', margin: '1rem 0' }}>{String(this.state.err)}</p>
        <button onClick={() => window.location.reload()}
          style={{ padding: '.5rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '.5rem', cursor: 'pointer' }}>
          Recharger
        </button>
      </div>
    )
    return this.props.children
  }
}

// ─── Persistence ─────────────────────────────────────────────
function ls(k, def) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : def } catch { return def } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} }

var MN = "'JetBrains Mono',monospace"
var FD = "'Bricolage Grotesque',serif"

export default function App() { return <EB><Inner /></EB> }

// ─── Inner — gestion de l'état global ───────────────────────
function Inner() {
  var [tab, setTab]         = useState('encyclopedia')
  var [servers, setServers] = useState(KM_SERVERS_FALLBACK)
  var [server, setServer]   = useState(ls('d_srv', 'Imagiro'))
  var [hdv, setHdv]         = useState({})      // ankama_id → {name, price, img_url, type, level}
  var [rp, setRp]           = useState({})      // rune_name → price (dérivé du HDV)
  var [coeff, setCoeff]     = useState(ls('d_coeff', 100))
  var [syncing, setSyncing] = useState(false)
  var [hdvReady, setHdvReady] = useState(false)
  var [toast, setToast]     = useState(null)

  function show(m, t) {
    setToast({ m, t: t || 'ok' })
    setTimeout(() => setToast(null), 3000)
  }

  // Charge les prix HDV depuis Supabase
  async function loadHdv(srv) {
    setHdvReady(false)
    try {
      var map = await getHdvPrices(srv)
      setHdv(map)
      setRp(deriveRunePricesFromHdv(map))
      setHdvReady(Object.keys(map).length > 0)
    } catch (e) { console.error('loadHdv:', e) }
  }

  // Sync depuis KamaMaster
  async function syncHdv() {
    setSyncing(true)
    try {
      var rows = await fetchKMHdvPrices(server)
      if (!rows.length) { show('KamaMaster : aucune donnée reçue', 'err'); return }
      await bulkUpsertHdvPrices(rows)
      // Reconstruire le map
      var map = {}
      rows.forEach(r => { map[r.ankama_id] = r })
      setHdv(map)
      setRp(deriveRunePricesFromHdv(map))
      setHdvReady(true)
      show(rows.length.toLocaleString('fr') + ' prix synchronisés depuis KamaMaster ✓')
    } catch (e) { show('Erreur sync : ' + e.message, 'err') }
    finally { setSyncing(false) }
  }

  function changeServer(srv) {
    setServer(srv); lsSet('d_srv', srv); loadHdv(srv)
  }

  function changeCoeff(v) {
    var c = Math.max(1, Math.min(4000, parseInt(v) || 100))
    setCoeff(c); lsSet('d_coeff', c)
  }

  // Chargement initial
  useEffect(() => {
    fetchKMServers().then(setServers)
    loadHdv(server)
  }, [])

  var tabs = [
    { k: 'encyclopedia', l: 'Encyclopédie',  I: BookOpen   },
    { k: 'dashboard',    l: 'Rentabilité',    I: TrendingUp },
    { k: 'runes',        l: 'Runes',          I: Sparkles   },
  ]

  return (
    <div className="min-h-screen" style={{
      background: 'radial-gradient(1200px 600px at 10% -10%,#D9E3F7 0%,transparent 50%),radial-gradient(900px 500px at 90% 10%,#E8DEFB 0%,transparent 50%),linear-gradient(180deg,#F2F5FC,#FFF 60%)',
      fontFamily: "'Manrope',system-ui,sans-serif", color: '#0A1A3A'
    }}>
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div className="px-4 py-2.5 rounded-2xl shadow-2xl text-white text-sm font-semibold"
            style={{ background: toast.t === 'ok' ? 'rgba(16,185,129,.95)' : 'rgba(239,68,68,.95)' }}>
            {toast.m}
          </div>
        </div>
      )}

      <header className="sticky top-0 z-30 backdrop-blur-xl border-b border-white/60"
        style={{ background: 'rgba(242,245,252,.88)' }}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-2 justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md"
              style={{ background: 'linear-gradient(135deg,#0F1B3D,#2D4AAF)' }}>
              <Hammer className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-sm" style={{ fontFamily: FD }}>Concassage Lab</div>
              <div className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">Dofus · KamaMaster</div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0.5">
            {tabs.map(t => (
              <button key={t.k} onClick={() => setTab(t.k)}
                className="px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1"
                style={{ background: tab === t.k ? '#0F1B3D' : 'transparent', color: tab === t.k ? '#fff' : '#4B5870' }}>
                <t.I className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t.l}</span>
              </button>
            ))}
          </div>

          {/* Contrôles droite */}
          <div className="flex items-center gap-1.5">
            {/* Serveur */}
            <select value={server} onChange={e => changeServer(e.target.value)}
              className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 outline-none">
              {servers.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Coefficient */}
            <div className="hidden md:flex items-center gap-1 px-1.5 py-1 rounded-lg bg-white border border-slate-200">
              <span className="text-[9px] text-slate-400 font-bold">Coef</span>
              <input type="number" value={coeff} min={1} max={4000}
                onChange={e => changeCoeff(e.target.value)}
                className="w-14 text-center text-[11px] font-bold bg-transparent outline-none"
                style={{ fontFamily: MN }} />
              <span className="text-[9px] text-slate-400">%</span>
            </div>

            {/* Sync — CORS : uniquement via node populate.js */}
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-semibold"
              style={{ background: 'rgba(15,27,61,.06)', color: '#4B5870' }}
              title="Sync via : node populate.js hdv NomServeur">
              <RefreshCw className="w-3 h-3 opacity-50" />
              <span>node populate.js hdv {'{serveur}'}</span>
            </div>

            {/* Status */}
            <div className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold"
              style={{ background: hdvReady ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.12)', color: hdvReady ? '#047857' : '#B91C1C' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: hdvReady ? '#10b981' : '#ef4444' }} />
              {hdvReady ? Object.keys(hdv).length.toLocaleString('fr') + ' prix' : 'Sync requis'}
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-20">
        {tab === 'encyclopedia' && <Ency hdv={hdv} rp={rp} coeff={coeff} show={show} />}
        {tab === 'dashboard'    && <Dash hdv={hdv} rp={rp} coeff={coeff} show={show} />}
        {tab === 'runes'        && <RuneV rp={rp} hdv={hdv} server={server} coeff={coeff} onCoeff={changeCoeff} onSync={syncHdv} syncing={syncing} />}
      </main>

      <footer className="text-center text-[10px] text-slate-400 pb-8">
        {'Concassage Lab · ' + server + ' · source KamaMaster.fr'}
      </footer>
    </div>
  )
}

// ─── Sorts encyclopédie ──────────────────────────────────────
var SORT_OPTS = [
  { k: 'level-desc', label: 'Niveau ↓',    field: 'level', asc: false },
  { k: 'level-asc',  label: 'Niveau ↑',    field: 'level', asc: true  },
  { k: 'name-asc',   label: 'Nom A→Z',     field: 'name',  asc: true  },
  { k: 'name-desc',  label: 'Nom Z→A',     field: 'name',  asc: false },
  { k: 'type-asc',   label: 'Type A→Z',    field: 'type',  asc: true  },
  { k: 'gain-desc',  label: 'Gain ↓',      ranked: true },
  { k: 'roi-desc',   label: 'ROI ↓',       ranked: true },
  { k: 'bris-desc',  label: 'Brisage ↓',   ranked: true },
]

// ─── ENCYCLOPÉDIE ────────────────────────────────────────────
function Ency({ hdv, rp, coeff, show }) {
  var [items, setItems]       = useState([])
  var [total, setTotal]       = useState(0)
  var [page, setPage]         = useState(1)
  var [rPage, setRPage]       = useState(1)
  var [loading, setLoading]   = useState(true)
  var [query, setQuery]       = useState('')
  var [lvMin, setLvMin]       = useState(1)
  var [lvMax, setLvMax]       = useState(200)
  var [typeF, setTypeF]       = useState('all')
  var [sort, setSort]         = useState('level-desc')
  var [sel, setSel]           = useState(null)
  var [selIngr, setSelIngr]   = useState(null)
  var [allItems, setAllItems] = useState([])
  var [allLoaded, setAllLoaded] = useState(false)
  var [allLoading, setAllLoading] = useState(false)

  var so = SORT_OPTS.find(o => o.k === sort) || SORT_OPTS[0]
  var isRanked = !!so.ranked

  useEffect(() => {
    if (isRanked && !allLoaded && !allLoading) {
      setAllLoading(true)
      getAllItems().then(d => { setAllItems(d || []); setAllLoaded(true); setAllLoading(false) })
    }
  }, [isRanked])

  var doLoad = useCallback(() => {
    if (isRanked) return
    setLoading(true)
    getItems(query, lvMin, lvMax, typeF, page, so.field, so.asc).then(r => {
      setItems(r.data || []); setTotal(r.count || 0); setLoading(false)
    }).catch(() => setLoading(false))
  }, [query, lvMin, lvMax, typeF, page, sort, isRanked])

  useEffect(() => { var t = setTimeout(doLoad, 300); return () => clearTimeout(t) }, [doLoad])

  var ranked = useMemo(() => {
    if (!isRanked) return []
    var src = allItems
    if (query) src = src.filter(it => it.name.toLowerCase().includes(query.toLowerCase()))
    if (typeF !== 'all') src = src.filter(it => it.type === typeF)
    src = src.filter(it => it.level >= lvMin && it.level <= lvMax)
    var res = []
    for (var it of src) {
      var runes = computeRuneBreakdown(it.effects || [], it.level, coeff)
      var brisVal = computeEstimatedValue(runes, rp)
      if (brisVal <= 0) continue
      var hdvPrice = hdv[it.ankama_id]?.price || 0
      var craftCost = 0, craftKnown = (it.recipe || []).length > 0
      for (var r of (it.recipe || [])) {
        var p2 = hdv[r.ankama_id]?.price || 0
        if (!p2) { craftKnown = false; break }
        craftCost += p2 * r.quantity
      }
      var bestCost = hdvPrice > 0 && craftCost > 0 ? Math.min(hdvPrice, craftCost)
                   : hdvPrice > 0 ? hdvPrice : craftCost > 0 ? craftCost : 0
      var profit = bestCost > 0 ? brisVal - bestCost : null
      var roi    = bestCost > 0 ? ((brisVal - bestCost) / bestCost) * 100 : null
      res.push({ item: it, brisVal, hdvPrice, craftCost, craftKnown, bestCost, profit, roi })
    }
    if (sort === 'roi-desc')  res.sort((a, b) => (b.roi ?? -Infinity) - (a.roi ?? -Infinity))
    else if (sort === 'gain-desc') res.sort((a, b) => (b.profit ?? -Infinity) - (a.profit ?? -Infinity))
    else res.sort((a, b) => b.brisVal - a.brisVal)
    return res
  }, [allItems, hdv, rp, coeff, sort, query, typeF, lvMin, lvMax, isRanked])

  function goIngredient(ankamaId, name) {
    if (!ankamaId) return
    getItemByAnkamaId(ankamaId).then(item => {
      if (item) setSel(item)
      else {
        var hdvItem = hdv[ankamaId]
        if (hdvItem) setSelIngr({ ankama_id: ankamaId, ...hdvItem })
        else show((name || 'Item #' + ankamaId) + ' — introuvable', 'err')
      }
    })
  }

  var tp   = Math.ceil(total / 100) || 1
  var RPS  = 50
  var rTp  = Math.ceil(ranked.length / RPS) || 1
  var rRows = ranked.slice((rPage - 1) * RPS, rPage * RPS)

  if (selIngr) return <IngredientDetail item={selIngr} hdv={hdv} onBack={() => setSelIngr(null)} onIngredientClick={goIngredient} />
  if (sel)     return <Detail item={sel} onBack={() => setSel(null)} hdv={hdv} rp={rp} coeff={coeff} onIngredientClick={goIngredient} />

  return (
    <div className="animate-fadeUp">
      <div className="text-center mb-6">
        <h1 className="text-4xl md:text-5xl font-bold" style={{ fontFamily: FD, letterSpacing: '-0.03em' }}>
          Encyclopédie <span className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(120deg,#2D4AAF,#7E57C2 60%,#C49A3B)' }}>Dofus</span>
        </h1>
        <p className="text-slate-500 mt-2 text-sm">
          {isRanked ? ranked.length.toLocaleString('fr') + ' équipements avec valeur brisage' : total.toLocaleString('fr') + ' équipements'}
        </p>
      </div>

      {/* Filtres */}
      <div className="max-w-3xl mx-auto mb-6 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={e => { setQuery(e.target.value); setPage(1); setRPage(1) }}
            placeholder="Rechercher un équipement…"
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/80 backdrop-blur-xl border border-white shadow-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-300/60" />
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center text-xs text-slate-600">
          <label className="flex items-center gap-1">Niv
            <input type="number" value={lvMin} min={1} max={200}
              onChange={e => { setLvMin(+e.target.value || 1); setPage(1); setRPage(1) }}
              className="w-12 px-1.5 py-1 rounded-lg bg-white border border-slate-200 text-center font-semibold" />
          </label>
          <span>—</span>
          <input type="number" value={lvMax} min={1} max={200}
            onChange={e => { setLvMax(+e.target.value || 200); setPage(1); setRPage(1) }}
            className="w-12 px-1.5 py-1 rounded-lg bg-white border border-slate-200 text-center font-semibold" />
          <select value={typeF} onChange={e => { setTypeF(e.target.value); setPage(1); setRPage(1) }}
            className="px-2 py-1 rounded-lg bg-white border border-slate-200 font-semibold">
            <option value="all">Tous types</option>
            {EQUIPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-200">
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
            <select value={sort} onChange={e => { setSort(e.target.value); setPage(1); setRPage(1) }}
              className="text-xs font-semibold bg-transparent outline-none">
              {SORT_OPTS.map(o => <option key={o.k} value={o.k}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Mode classement rentabilité */}
      {isRanked && (
        <div>
          {(allLoading || !allLoaded) && <Spin text="Calcul de la rentabilité…" />}
          {allLoaded && ranked.length === 0 && <Emp icon="💡" title="Aucun résultat" msg="Sync HDV requis pour calculer les gains." />}
          {allLoaded && ranked.length > 0 && (
            <div>
              <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white shadow-xl overflow-hidden mb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                        <th className="px-3 py-3 w-8">#</th>
                        <th className="px-3 py-3">Équipement</th>
                        <th className="px-3 py-3 text-right">Niv</th>
                        <th className="px-3 py-3 text-right">HDV achat</th>
                        <th className="px-3 py-3 text-right">Coût craft</th>
                        <th className="px-3 py-3 text-right">Val. brisage</th>
                        <th className="px-3 py-3 text-right">Gain estimé</th>
                        <th className="px-3 py-3 text-right">ROI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rRows.map((r, idx) => {
                        var rank = (rPage - 1) * RPS + idx + 1
                        var icon = TYPE_ICONS[r.item.type] || '📦'
                        return (
                          <tr key={r.item.id || r.item.ankama_id}
                            className="border-b border-slate-50 last:border-0 hover:bg-blue-50/40 cursor-pointer transition"
                            onClick={() => setSel(r.item)}>
                            <td className="px-3 py-2.5 text-xs font-bold text-slate-400">{rank}</td>
                            <td className="px-3 py-2.5">
                              <div className="flex items-center gap-2">
                                {r.item.img_url
                                  ? <img src={r.item.img_url} alt="" className="w-8 h-8 object-contain rounded"
                                      onError={e => { e.target.style.display = 'none' }} />
                                  : <span className="text-lg">{icon}</span>}
                                <div>
                                  <div className="font-semibold text-xs">{r.item.name}</div>
                                  <div className="text-[10px] text-slate-400">{r.item.type}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-right text-xs font-semibold text-slate-500">{r.item.level}</td>
                            <td className="px-3 py-2.5 text-right text-xs" style={{ fontFamily: MN, color: '#2D4AAF' }}>
                              {r.hdvPrice > 0 ? r.hdvPrice.toLocaleString('fr') : '—'}
                            </td>
                            <td className="px-3 py-2.5 text-right text-xs" style={{ fontFamily: MN, color: '#7E57C2' }}>
                              {r.craftKnown && r.craftCost > 0 ? r.craftCost.toLocaleString('fr') : '—'}
                            </td>
                            <td className="px-3 py-2.5 text-right text-xs font-bold" style={{ fontFamily: MN, color: '#8B6914' }}>
                              {Math.round(r.brisVal).toLocaleString('fr')}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              {r.profit !== null
                                ? <span className="font-bold text-xs" style={{ fontFamily: MN, color: r.profit >= 0 ? '#047857' : '#B91C1C' }}>
                                    {r.profit >= 0 ? '+' : ''}{Math.round(r.profit).toLocaleString('fr')}
                                  </span>
                                : <span className="text-[10px] text-slate-300">—</span>}
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              {r.roi !== null
                                ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                    style={{ background: r.roi >= 0 ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.12)',
                                             color: r.roi >= 0 ? '#047857' : '#B91C1C' }}>
                                    {r.roi >= 0 ? '+' : ''}{r.roi.toFixed(0)}%
                                  </span>
                                : <span className="text-[10px] text-slate-300">—</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <Pag page={rPage} tp={rTp} total={ranked.length} onPage={p => { setRPage(p); window.scrollTo(0, 0) }} />
            </div>
          )}
        </div>
      )}

      {/* Mode normal (cartes paginées) */}
      {!isRanked && (
        <div>
          {loading && <Spin text="Chargement…" />}
          {!loading && items.length === 0 && <Emp icon="📖" title="Aucun résultat" msg="Modifie les filtres." />}
          {!loading && items.length > 0 && (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {items.map(item => (
                  <IC key={item.id} item={item} hdv={hdv} rp={rp} coeff={coeff} onClick={() => setSel(item)} />
                ))}
              </div>
              <Pag page={page} tp={tp} total={total} onPage={p => { setPage(p); window.scrollTo(0, 0) }} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── CARTE ITEM ───────────────────────────────────────────────
function IC({ item, hdv, rp, coeff, onClick }) {
  var icon = TYPE_ICONS[item.type] || '📦'
  var runes = computeRuneBreakdown(item.effects || [], item.level, coeff)
  var brisVal = computeEstimatedValue(runes, rp)
  var hdvPrice = hdv[item.ankama_id]?.price || 0

  var craftCost = 0, craftKnown = (item.recipe || []).length > 0
  for (var r of (item.recipe || [])) {
    var p = hdv[r.ankama_id]?.price || 0
    if (!p) { craftKnown = false; break }
    craftCost += p * r.quantity
  }

  var bestCost = hdvPrice > 0 && craftCost > 0 ? Math.min(hdvPrice, craftCost) : (hdvPrice || craftCost)
  var profit = bestCost > 0 && brisVal > 0 ? brisVal - bestCost : null
  var roi    = bestCost > 0 && brisVal > 0 ? ((brisVal - bestCost) / bestCost) * 100 : null

  return (
    <button onClick={onClick}
      className="card-hover bg-white/80 backdrop-blur-xl rounded-2xl p-3 border border-white/80 shadow-md text-left flex flex-col items-center gap-2 cursor-pointer w-full">
      <div className="w-14 h-14 rounded-xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg,#EEF2FB,#E0E7F8)' }}>
        {item.img_url
          ? <img src={item.img_url} alt="" className="w-12 h-12 object-contain"
              onError={e => { e.target.style.display = 'none' }} />
          : <span className="text-2xl">{icon}</span>}
      </div>
      <div className="text-center w-full space-y-0.5">
        <div className="font-bold text-[11px] leading-tight truncate">{item.name}</div>
        <div className="text-[9px] text-slate-500">{item.type} · Niv.{item.level}</div>
        {hdvPrice > 0 && (
          <div className="text-[9px] text-blue-600 font-semibold">
            HDV : {hdvPrice.toLocaleString('fr')} k
          </div>
        )}
        {craftKnown && craftCost > 0 && (
          <div className="text-[9px] text-purple-600 font-semibold">
            Craft : {craftCost.toLocaleString('fr')} k
          </div>
        )}
        {brisVal > 0 && (
          <div className="text-[9px] text-amber-700 font-semibold">
            Brisage : {Math.round(brisVal).toLocaleString('fr')} k
          </div>
        )}
        {profit !== null && (
          <div className="text-[10px] font-bold mt-1 px-2 py-0.5 rounded-full inline-block"
            style={{ background: profit >= 0 ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.1)',
                     color: profit >= 0 ? '#047857' : '#B91C1C' }}>
            Gain : {profit >= 0 ? '+' : ''}{Math.round(profit).toLocaleString('fr')} k
            {roi !== null && <span className="ml-1 opacity-70">({roi >= 0 ? '+' : ''}{roi.toFixed(0)}%)</span>}
          </div>
        )}
        {brisVal > 0 && profit === null && (
          <div className="text-[9px] font-bold px-2 py-0.5 rounded-full inline-block"
            style={{ background: 'rgba(196,154,59,.12)', color: '#8B6914' }}>
            ≈ {Math.round(brisVal).toLocaleString('fr')} k
          </div>
        )}
      </div>
    </button>
  )
}

// ─── PAGE INGRÉDIENT (ressource non-équipement) ──────────────
function IngredientDetail({ item, hdv, onBack, onIngredientClick }) {
  // item = { ankama_id, name, price, img_url, type, level }
  // Cherche les équipements qui utilisent cet ingrédient dans leur recette
  return (
    <div className="animate-fadeUp">
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-xl overflow-hidden">
        {/* Hero */}
        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6"
          style={{ background: 'linear-gradient(135deg,#F0F4FF,#E8E0FF)' }}>
          <div className="w-24 h-24 rounded-2xl bg-white/60 shadow-lg flex items-center justify-center">
            {item.img_url
              ? <img src={item.img_url} className="w-20 h-20 object-contain"
                  onError={e => { e.target.style.display = 'none' }} alt="" />
              : <span className="text-5xl">📦</span>}
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="text-[10px] font-bold text-purple-700 uppercase tracking-widest mb-1">
              {item.type || 'Ressource'}{item.level > 1 ? ' · Niveau ' + item.level : ''}
            </div>
            <h2 className="text-3xl font-bold" style={{ fontFamily: FD }}>{item.name}</h2>
            <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
              <span className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: 'rgba(126,87,194,.1)', color: '#7E57C2' }}>
                Ressource / Ingrédient
              </span>
              {item.price > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(45,74,175,.1)', color: '#2D4AAF' }}>
                  HDV : {item.price.toLocaleString('fr')} k
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Prix de marché */}
          <Sec title="Prix de marché (HDV)">
            {item.price > 0 ? (
              <div className="rounded-2xl p-4 border text-center"
                style={{ background: 'rgba(45,74,175,.08)', borderColor: '#2D4AAF' }}>
                <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500 uppercase mb-1">
                  <ShoppingCart className="w-3 h-3" /> Prix unitaire
                </div>
                <div className="text-2xl font-bold" style={{ fontFamily: MN, color: '#2D4AAF' }}>
                  {item.price.toLocaleString('fr')} k
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Prix non disponible — Sync HDV requis.</p>
            )}
          </Sec>

          {/* Obtention */}
          <Sec title="Comment l'obtenir">
            <div className="space-y-2">
              {item.price > 0 && (
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-50/60 border border-blue-100">
                  <ShoppingCart className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <div className="font-semibold text-sm text-slate-800">Hôtel des Ventes</div>
                    <div className="text-[10px] text-slate-500">{item.price.toLocaleString('fr')} k l'unité</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-purple-50/60 border border-purple-100">
                <span className="text-lg shrink-0">👹</span>
                <div>
                  <div className="font-semibold text-sm text-slate-800">Drop sur monstres</div>
                  <div className="text-[10px] text-slate-500">Consultez le Dofus Encyclopedia pour les détails</div>
                </div>
              </div>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-green-50/60 border border-green-100">
                <Wrench className="w-4 h-4 text-green-600 shrink-0" />
                <div>
                  <div className="font-semibold text-sm text-slate-800">Métiers</div>
                  <div className="text-[10px] text-slate-500">Craftable selon votre serveur</div>
                </div>
              </div>
            </div>
          </Sec>
        </div>
      </div>
    </div>
  )
}

// ─── FICHE DÉTAILLÉE ─────────────────────────────────────────
function Detail({ item, onBack, hdv, rp, coeff, onIngredientClick }) {
  var icon = TYPE_ICONS[item.type] || '📦'
  var effs = item.effects || []
  var runes = computeRuneBreakdown(effs, item.level, coeff)
  var brisVal = computeEstimatedValue(runes, rp)
  var recipe = item.recipe || []
  var drops = item.drops || []

  // Prix HDV de l'équipement
  var hdvPrice = hdv[item.ankama_id]?.price || 0

  // Coût de craft
  var craftCost = 0, craftKnown = recipe.length > 0
  for (var ri of recipe) {
    var p = hdv[ri.ankama_id]?.price || 0
    if (!p) { craftKnown = false; break }
    craftCost += p * ri.quantity
  }

  var bestCost = hdvPrice > 0 && craftCost > 0 ? Math.min(hdvPrice, craftCost) : (hdvPrice || craftCost)
  var profit = bestCost > 0 && brisVal > 0 ? brisVal - bestCost : null
  var roi = bestCost > 0 && brisVal > 0 ? ((brisVal - bestCost) / bestCost) * 100 : null

  return (
    <div className="animate-fadeUp">
      <button onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4">
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-xl overflow-hidden">
        {/* Hero */}
        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6"
          style={{ background: 'linear-gradient(135deg,#EEF2FB,#E0E7F8)' }}>
          <div className="w-24 h-24 rounded-2xl bg-white/60 shadow-lg flex items-center justify-center">
            {item.img_url
              ? <img src={item.img_url} className="w-20 h-20 object-contain"
                  onError={e => { e.target.style.display = 'none' }} alt="" />
              : <span className="text-5xl">{icon}</span>}
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1">
              {item.type} · Niveau {item.level}
            </div>
            <h2 className="text-3xl font-bold" style={{ fontFamily: FD }}>{item.name}</h2>
            {item.description && <p className="text-sm text-slate-600 mt-2 max-w-xl">{item.description}</p>}
            <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
              <span className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: 'rgba(45,74,175,.1)', color: '#2D4AAF' }}>
                Coef {coeff}%
              </span>
              {brisVal > 0 && (
                <span className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: 'rgba(196,154,59,.15)', color: '#8B6914' }}>
                  Brisage ≈ {Math.round(brisVal).toLocaleString('fr')} k
                </span>
              )}
              {roi !== null && (
                <span className="px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: roi >= 0 ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.12)',
                           color: roi >= 0 ? '#047857' : '#B91C1C' }}>
                  ROI {roi >= 0 ? '+' : ''}{roi.toFixed(0)}%
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Comparatif de prix */}
        {(hdvPrice > 0 || craftKnown) && (
          <div className="px-6 md:px-8 pt-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Comparatif d'achat</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-2">
              {hdvPrice > 0 && (
                <div className="rounded-2xl p-3 border text-center"
                  style={{ background: (!craftKnown || hdvPrice <= craftCost) ? 'rgba(45,74,175,.08)' : 'rgba(248,250,252,1)',
                           borderColor: (!craftKnown || hdvPrice <= craftCost) ? '#2D4AAF' : '#e2e8f0' }}>
                  <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500 uppercase mb-1">
                    <ShoppingCart className="w-3 h-3" /> HDV
                  </div>
                  <div className="text-sm font-bold" style={{ fontFamily: MN }}>
                    {hdvPrice.toLocaleString('fr')} k
                  </div>
                  {(!craftKnown || hdvPrice <= craftCost) && hdvPrice > 0 && (
                    <div className="text-[9px] text-blue-700 font-bold mt-0.5">✓ Recommandé</div>
                  )}
                </div>
              )}
              {craftKnown && craftCost > 0 && (
                <div className="rounded-2xl p-3 border text-center"
                  style={{ background: (craftCost < hdvPrice || !hdvPrice) ? 'rgba(45,74,175,.08)' : 'rgba(248,250,252,1)',
                           borderColor: (craftCost < hdvPrice || !hdvPrice) ? '#2D4AAF' : '#e2e8f0' }}>
                  <div className="flex items-center justify-center gap-1 text-[10px] font-bold text-slate-500 uppercase mb-1">
                    <Wrench className="w-3 h-3" /> Craft
                  </div>
                  <div className="text-sm font-bold" style={{ fontFamily: MN }}>
                    {craftCost.toLocaleString('fr')} k
                  </div>
                  {(craftCost < hdvPrice || !hdvPrice) && (
                    <div className="text-[9px] text-blue-700 font-bold mt-0.5">✓ Recommandé</div>
                  )}
                </div>
              )}
              {brisVal > 0 && (
                <div className="rounded-2xl p-3 border text-center"
                  style={{ background: 'rgba(196,154,59,.08)', borderColor: '#C49A3B' }}>
                  <div className="text-[10px] font-bold text-amber-700 uppercase mb-1">Brisage</div>
                  <div className="text-sm font-bold" style={{ fontFamily: MN, color: '#8B6914' }}>
                    {Math.round(brisVal).toLocaleString('fr')} k
                  </div>
                </div>
              )}
              {profit !== null && (
                <div className="rounded-2xl p-3 border text-center"
                  style={{ background: profit >= 0 ? 'rgba(16,185,129,.08)' : 'rgba(239,68,68,.08)',
                           borderColor: profit >= 0 ? '#10b981' : '#ef4444' }}>
                  <div className="text-[10px] font-bold uppercase mb-1"
                    style={{ color: profit >= 0 ? '#047857' : '#B91C1C' }}>Bénéfice</div>
                  <div className="text-sm font-bold" style={{ fontFamily: MN, color: profit >= 0 ? '#047857' : '#B91C1C' }}>
                    {profit >= 0 ? '+' : ''}{Math.round(profit).toLocaleString('fr')} k
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stats */}
          <Sec title="Statistiques">
            {effs.filter(e => (e.max || 0) > 0 || (e.min || 0) !== 0).map((e, idx) => {
              var ch = getStatInfo(e.stat_id, e.stat_name)
              var label = e.stat_name || (ch ? ch.fr : '#' + e.stat_id)
              var val = e.max > 0
                ? (e.min > 0 && e.min !== e.max ? e.min + ' à ' + e.max : String(e.max))
                : String(e.min)
              return (
                <div key={idx} className="flex justify-between px-3 py-1.5 rounded-lg hover:bg-slate-50 text-sm">
                  <span className="text-slate-700 font-medium">{label}</span>
                  <span className="font-bold" style={{ fontFamily: MN, color: (e.max || e.min) < 0 ? '#B91C1C' : '#047857' }}>
                    {val}
                  </span>
                </div>
              )
            })}
            {effs.length === 0 && <p className="text-xs text-slate-400 italic">Aucune statistique</p>}
          </Sec>

          {/* Runes */}
          <Sec title={`Runes au brisage (coef ${coeff}%)`}>
            {runes.length > 0 ? runes.map((r, idx) => {
              var price = rp[r.name] || 0
              return (
                <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50/60 mb-2">
                  <div>
                    <span className="font-bold text-sm text-amber-900">Rune {r.name}</span>
                    <span className="text-[10px] text-slate-500 ml-2">({r.stat} max {Math.round(r.maxVal)})</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xs" style={{ fontFamily: MN }}>{r.units.toFixed(1)} u</div>
                    {price > 0 && (
                      <div className="text-[10px] text-slate-500">
                        ≈ {Math.round(r.units * price).toLocaleString('fr')} k
                      </div>
                    )}
                  </div>
                </div>
              )
            }) : <p className="text-xs text-slate-400 italic">Aucune rune (stats non mappées)</p>}
          </Sec>

          {/* Recette */}
          <Sec title="Recette de craft">
            {recipe.length > 0 ? recipe.map((r, idx) => {
              var hdvItem = hdv[r.ankama_id]
              var ingName = hdvItem?.name || ('Item #' + r.ankama_id)
              var ingPrice = hdvItem?.price || 0
              var ingImg = hdvItem?.img_url
              return (
                <button key={idx}
                  onClick={() => onIngredientClick && onIngredientClick(r.ankama_id, ingName)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-blue-50/50 mb-1.5 hover:bg-blue-100/60 transition-all cursor-pointer text-left group">
                  <div className="flex items-center gap-2">
                    {ingImg
                      ? <img src={ingImg} alt="" className="w-8 h-8 object-contain rounded"
                          onError={e => { e.target.style.display = 'none' }} />
                      : <span className="text-sm">📦</span>}
                    <div>
                      <div className="font-semibold text-sm text-slate-800 group-hover:text-blue-700">{ingName}</div>
                      {ingPrice > 0 && (
                        <div className="text-[10px] text-slate-500">{ingPrice.toLocaleString('fr')} k × {r.quantity} = {(ingPrice * r.quantity).toLocaleString('fr')} k</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm px-2 py-0.5 rounded-lg bg-white" style={{ fontFamily: MN }}>×{r.quantity}</span>
                    <span className="text-[10px] text-blue-500 opacity-0 group-hover:opacity-100">voir →</span>
                  </div>
                </button>
              )
            }) : <p className="text-xs text-slate-400 italic">Pas de recette de craft</p>}
            {recipe.length > 0 && craftKnown && craftCost > 0 && (
              <div className="px-3 py-2 rounded-xl bg-slate-50 text-xs text-slate-600 font-semibold mt-1 text-right">
                Total craft : <span style={{ fontFamily: MN }}>{craftCost.toLocaleString('fr')} k</span>
              </div>
            )}
          </Sec>

          {/* Drops */}
          <Sec title="Obtention / Monstres">
            {drops.length > 0
              ? drops.map((d, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-50/50 mb-1.5">
                  <span className="text-lg">👹</span>
                  <span className="font-semibold text-sm text-slate-800">{d}</span>
                </div>
              ))
              : <p className="text-xs text-slate-500 italic">Craftable uniquement ou non référencé.</p>}
          </Sec>
        </div>
      </div>
    </div>
  )
}

// ─── DASHBOARD RENTABILITÉ ───────────────────────────────────
function Dash({ hdv, rp, coeff, show }) {
  var [all, setAll]       = useState([])
  var [lc, setLc]         = useState(0)
  var [done, setDone]     = useState(false)
  var [filter, setFilter] = useState('')
  var [typeF, setTypeF]   = useState('all')
  var [lvMin, setLvMin]   = useState(1)
  var [lvMax, setLvMax]   = useState(200)
  var [page, setPage]     = useState(1)
  var [showOnlyProfit, setShowOnlyProfit] = useState(false)
  var PS = 100

  useEffect(() => {
    getAllItems(c => setLc(c)).then(d => { setAll(d || []); setDone(true) })
  }, [])

  var ranked = useMemo(() => {
    var res = []
    for (var it of all) {
      if (filter && !it.name.toLowerCase().includes(filter.toLowerCase())) continue
      if (typeF !== 'all' && it.type !== typeF) continue
      if (it.level < lvMin || it.level > lvMax) continue

      var runes = computeRuneBreakdown(it.effects || [], it.level, coeff)
      var brisVal = computeEstimatedValue(runes, rp)
      if (brisVal <= 0) continue

      var hdvPrice = hdv[it.ankama_id]?.price || 0
      var craftCost = 0, craftKnown = (it.recipe || []).length > 0
      for (var r of (it.recipe || [])) {
        var p = hdv[r.ankama_id]?.price || 0
        if (!p) { craftKnown = false; break }
        craftCost += p * r.quantity
      }

      var bestCost = hdvPrice > 0 && craftCost > 0 ? Math.min(hdvPrice, craftCost) :
                     hdvPrice > 0 ? hdvPrice : craftCost > 0 ? craftCost : 0

      var profit = bestCost > 0 ? brisVal - bestCost : null
      var roi = bestCost > 0 ? ((brisVal - bestCost) / bestCost) * 100 : null

      if (showOnlyProfit && profit === null) continue

      res.push({ item: it, brisVal, hdvPrice, craftCost, craftKnown, bestCost, profit, roi })
    }
    res.sort((a, b) => {
      if (a.roi !== null && b.roi !== null) return b.roi - a.roi
      if (a.roi !== null) return -1
      if (b.roi !== null) return 1
      return b.brisVal - a.brisVal
    })
    return res
  }, [all, rp, coeff, hdv, filter, typeF, lvMin, lvMax, showOnlyProfit])

  var tp = Math.ceil(ranked.length / PS) || 1
  var pageItems = ranked.slice((page - 1) * PS, page * PS)

  if (!done) return (
    <div className="animate-fadeUp text-center py-16">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
      <h3 className="text-lg font-bold" style={{ fontFamily: FD }}>Chargement des items…</h3>
      <p className="text-sm text-slate-500 mt-1">{lc.toLocaleString('fr')} chargés</p>
      <div className="w-64 h-2 bg-slate-200 rounded-full mx-auto mt-4 overflow-hidden">
        <div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)', width: Math.min(100, lc / 50) + '%', transition: 'width .3s' }} />
      </div>
    </div>
  )

  return (
    <div className="animate-fadeUp">
      <h2 className="text-3xl font-bold" style={{ fontFamily: FD }}>Classement Rentabilité</h2>
      <p className="text-sm text-slate-500 mb-1">
        {all.length.toLocaleString('fr')} items · {ranked.length.toLocaleString('fr')} avec valeur de brisage · coef {coeff}%
      </p>
      <p className="text-xs text-slate-400 mb-5 italic">
        Coût optimal = min(prix HDV, coût craft). Sync HDV requis pour les prix en temps réel.
      </p>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-5">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={filter} onChange={e => { setFilter(e.target.value); setPage(1) }}
            placeholder="Filtrer par nom…"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/80 border border-white shadow text-sm outline-none" />
        </div>
        <select value={typeF} onChange={e => { setTypeF(e.target.value); setPage(1) }}
          className="px-2 py-2 rounded-xl bg-white/80 border border-white shadow text-xs font-semibold outline-none">
          <option value="all">Tous types</option>
          {EQUIPMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <div className="flex items-center gap-1 text-xs text-slate-600">
          <span>Niv</span>
          <input type="number" value={lvMin} min={1} max={200}
            onChange={e => { setLvMin(+e.target.value || 1); setPage(1) }}
            className="w-12 px-1.5 py-2 rounded-xl bg-white border border-slate-200 text-center font-semibold outline-none" />
          <span>—</span>
          <input type="number" value={lvMax} min={1} max={200}
            onChange={e => { setLvMax(+e.target.value || 200); setPage(1) }}
            className="w-12 px-1.5 py-2 rounded-xl bg-white border border-slate-200 text-center font-semibold outline-none" />
        </div>
        <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold cursor-pointer">
          <input type="checkbox" checked={showOnlyProfit} onChange={e => { setShowOnlyProfit(e.target.checked); setPage(1) }} />
          Avec prix seulement
        </label>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPI label="Rentables" value={ranked.length.toLocaleString('fr')} />
        <KPI label="Top brisage" value={ranked.length > 0 ? ranked[0].item.name : '—'} small />
        <KPI label="Meilleure valeur" value={ranked.length > 0 ? Math.round(ranked[0].brisVal).toLocaleString('fr') + ' k' : '—'} color="#047857" />
        <KPI label="Meilleur ROI" value={ranked.length > 0 && ranked[0].roi !== null ? (ranked[0].roi >= 0 ? '+' : '') + ranked[0].roi.toFixed(0) + '%' : '—'} color="#2D4AAF" />
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="px-3 py-3 w-8">#</th>
                <th className="px-3 py-3">Équipement</th>
                <th className="px-3 py-3 text-right">Niv</th>
                <th className="px-3 py-3 text-right">HDV</th>
                <th className="px-3 py-3 text-right">Craft</th>
                <th className="px-3 py-3 text-right">Brisage</th>
                <th className="px-3 py-3 text-right">Bénéfice</th>
                <th className="px-3 py-3 text-right">ROI</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((r, idx) => {
                var rank = (page - 1) * PS + idx + 1
                var icon = TYPE_ICONS[r.item.type] || '📦'
                return (
                  <tr key={r.item.id} className="border-b border-slate-50 last:border-0 hover:bg-blue-50/30 transition">
                    <td className="px-3 py-2 text-xs font-bold text-slate-400">{rank}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {r.item.img_url
                          ? <img src={r.item.img_url} alt="" className="w-7 h-7 object-contain rounded"
                              onError={e => { e.target.style.display = 'none' }} />
                          : <span>{icon}</span>}
                        <div>
                          <div className="font-semibold text-xs">{r.item.name}</div>
                          <div className="text-[10px] text-slate-400">{r.item.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-semibold text-slate-500">{r.item.level}</td>
                    <td className="px-3 py-2 text-right text-xs" style={{ fontFamily: MN, color: '#2D4AAF' }}>
                      {r.hdvPrice > 0 ? r.hdvPrice.toLocaleString('fr') : '—'}
                    </td>
                    <td className="px-3 py-2 text-right text-xs" style={{ fontFamily: MN, color: '#7E57C2' }}>
                      {r.craftKnown && r.craftCost > 0 ? r.craftCost.toLocaleString('fr') : '—'}
                    </td>
                    <td className="px-3 py-2 text-right text-xs font-bold" style={{ fontFamily: MN, color: '#8B6914' }}>
                      {Math.round(r.brisVal).toLocaleString('fr')}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {r.profit !== null
                        ? <span className="font-bold text-xs" style={{ fontFamily: MN, color: r.profit >= 0 ? '#047857' : '#B91C1C' }}>
                            {r.profit >= 0 ? '+' : ''}{Math.round(r.profit).toLocaleString('fr')}
                          </span>
                        : <span className="text-[10px] text-slate-300">—</span>}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {r.roi !== null
                        ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{ background: r.roi >= 0 ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.12)',
                                     color: r.roi >= 0 ? '#047857' : '#B91C1C' }}>
                            {r.roi >= 0 ? '+' : ''}{r.roi.toFixed(0)}%
                          </span>
                        : <span className="text-[10px] text-slate-300">—</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <Pag page={page} tp={tp} total={ranked.length} onPage={p => { setPage(p); window.scrollTo(0, 0) }} />
    </div>
  )
}

// ─── PAGE RUNES ──────────────────────────────────────────────
function RuneV({ rp, hdv, server, coeff, onCoeff, onSync, syncing }) {
  // Tente de détecter les runes dans le HDV
  var hdvRunes = useMemo(() => {
    var out = []
    Object.values(hdv).forEach(item => {
      if (item.name && item.name.startsWith('Rune ') && !item.name.startsWith('Rune de ')) {
        var code = item.name.slice(5).trim()
        out.push({ code, name: item.name, price: item.price, fromHdv: true })
      }
    })
    out.sort((a, b) => b.price - a.price)
    return out
  }, [hdv])

  var list = Object.entries(rp).sort((a, b) => b[1] - a[1])
  var hasHdvRunes = hdvRunes.length > 0

  return (
    <div className="animate-fadeUp">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-3xl font-bold" style={{ fontFamily: FD }}>Prix des Runes</h2>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
          style={{ background: 'rgba(15,27,61,.06)', color: '#4B5870' }}>
          <RefreshCw className="w-3.5 h-3.5 opacity-40" />
          <code className="text-[10px]">node populate.js hdv {server}</code>
        </div>
      </div>
      <p className="text-sm text-slate-500 mb-1">Serveur : {server}</p>
      <p className="text-xs text-slate-400 mb-5">
        Les prix des runes sont détectés automatiquement dans les données HDV (items nommés "Rune…").
        {!hasHdvRunes && ' Lance "Sync KamaMaster" pour charger les prix.'}
      </p>

      {/* Coefficient */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 border border-white shadow-md mb-5">
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Coefficient de brisage</div>
            <div className="text-xs text-slate-400">Oscille entre 1% et 4000% selon l'offre/demande en jeu</div>
          </div>
          <div className="flex items-center gap-2">
            <input type="range" min={1} max={400} value={Math.min(400, coeff)}
              onChange={e => onCoeff(e.target.value)}
              className="w-40 accent-blue-600" />
            <input type="number" value={coeff} min={1} max={4000}
              onChange={e => onCoeff(e.target.value)}
              className="w-20 text-center px-2 py-1.5 rounded-xl border border-slate-200 font-bold text-sm outline-none focus:ring-2 focus:ring-blue-300"
              style={{ fontFamily: MN }} />
            <span className="text-sm font-bold text-slate-500">%</span>
          </div>
        </div>
      </div>

      {/* Prix runes HDV */}
      {hasHdvRunes ? (
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Runes détectées dans HDV ({hdvRunes.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {hdvRunes.map(r => (
              <div key={r.code} className="card-hover bg-white/80 backdrop-blur-xl rounded-2xl p-3.5 border border-white shadow-md flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" style={{ color: '#8B6914' }} />
                  <div>
                    <div className="font-bold text-sm">{r.name}</div>
                    <div className="text-[9px] text-slate-400">kamas/unité · HDV en direct</div>
                  </div>
                </div>
                <div className="font-bold text-sm" style={{ fontFamily: MN, color: '#8B6914' }}>
                  {r.price.toLocaleString('fr')}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : list.length > 0 ? (
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
            Prix manuels (Sync HDV recommandé)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {list.map(([name, price]) => (
              <div key={name} className="bg-white/80 backdrop-blur-xl rounded-2xl p-3.5 border border-white shadow-md flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" style={{ color: '#8B6914' }} />
                  <div><div className="font-bold text-sm">Rune {name}</div><div className="text-[9px] text-slate-400">kamas/unité</div></div>
                </div>
                <div className="font-bold text-sm" style={{ fontFamily: MN, color: '#8B6914' }}>
                  {price.toLocaleString('fr')}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Emp icon="💎" title="Aucun prix de rune" msg='Lance "Sync KamaMaster" pour charger les prix HDV.' />
      )}
    </div>
  )
}

// ─── Composants partagés ─────────────────────────────────────
function Pag({ page, tp, total, onPage }) {
  if (tp <= 1) return null
  var pages = [], s = Math.max(1, page - 3), e = Math.min(tp, page + 3)
  for (var i = s; i <= e; i++) pages.push(i)
  return (
    <div className="flex justify-center items-center gap-1.5 mt-6 flex-wrap">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)}
        className="p-2 rounded-xl bg-white border border-slate-200 disabled:opacity-30 hover:bg-slate-50">
        <ChevronLeft className="w-4 h-4" />
      </button>
      {s > 1 && <button onClick={() => onPage(1)} className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-semibold">1</button>}
      {s > 2 && <span className="text-slate-400 text-xs">…</span>}
      {pages.map(p => (
        <button key={p} onClick={() => onPage(p)} className="px-2.5 py-1 rounded-xl text-xs font-semibold"
          style={{ background: p === page ? '#0F1B3D' : 'white', color: p === page ? 'white' : '#4B5870',
                   border: '1px solid ' + (p === page ? '#0F1B3D' : '#e2e8f0') }}>
          {p}
        </button>
      ))}
      {e < tp - 1 && <span className="text-slate-400 text-xs">…</span>}
      {e < tp && <button onClick={() => onPage(tp)} className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-semibold">{tp}</button>}
      <button disabled={page >= tp} onClick={() => onPage(page + 1)}
        className="p-2 rounded-xl bg-white border border-slate-200 disabled:opacity-30 hover:bg-slate-50">
        <ChevronRight className="w-4 h-4" />
      </button>
      <span className="text-[10px] text-slate-500 ml-1">{total.toLocaleString('fr')} items</span>
    </div>
  )
}

function Sec({ title, children }) {
  return <div><h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{title}</h3>{children}</div>
}
function KPI({ label, value, color, small }) {
  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-3 border border-white shadow-md">
      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{label}</div>
      <div className={'font-bold mt-0.5 ' + (small ? 'text-sm truncate' : 'text-xl')}
        style={{ fontFamily: FD, color: color || '#0A1A3A' }}>{value}</div>
    </div>
  )
}
function Spin({ text }) {
  return (
    <div className="flex items-center justify-center gap-2 py-12">
      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
      <span className="text-sm text-slate-600">{text}</span>
    </div>
  )
}
function Emp({ icon, title, msg }) {
  return (
    <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/80 shadow-sm p-10 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <h3 className="text-lg font-bold" style={{ fontFamily: FD }}>{title}</h3>
      <p className="text-sm text-slate-500 mt-1">{msg}</p>
    </div>
  )
}
