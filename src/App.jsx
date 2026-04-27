import { useState, useEffect, useMemo, useCallback, Component } from 'react'
import { Search, ArrowLeft, Sparkles, Hammer, BookOpen, BarChart3, Loader2, ChevronLeft, ChevronRight, ArrowUpDown, RefreshCw } from 'lucide-react'
import { db, getItems, getItemByName, getAllItems, getRunePrices, setRunePrice, bulkSetRunePrices, SERVERS } from './lib/supabase'
import { CHAR_MAP, TYPE_ICONS, EQUIPMENT_TYPES, computeRuneBreakdown, computeEstimatedValue } from './lib/constants'
import { fetchKamaMasterRunePrices, realCoefByLevel } from './lib/kamamaster'

class EB extends Component {
  constructor(p) { super(p); this.state = { e: false, err: null } }
  static getDerivedStateFromError(e) { return { e: true, err: e } }
  render() {
    if (this.state.e) return <div style={{ padding: '2rem', textAlign: 'center' }}><h2 style={{ color: '#ef4444' }}>Erreur</h2><p style={{ color: '#64748b' }}>{String(this.state.err)}</p><button onClick={function() { window.location.reload() }} style={{ marginTop: '1rem', padding: '0.5rem 1.5rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}>Recharger</button></div>
    return this.props.children
  }
}

function getSrv() { try { return localStorage.getItem('d_srv') || 'Imagiro' } catch (e) { return 'Imagiro' } }
function setSrv(s) { try { localStorage.setItem('d_srv', s) } catch (e) {} }
function getBP() { try { var s = localStorage.getItem('d_bp'); return s ? JSON.parse(s) : {} } catch (e) { return {} } }
function saveBP(id, p) { try { var o = getBP(); o[id] = p; localStorage.setItem('d_bp', JSON.stringify(o)) } catch (e) {} }

var MN = "'JetBrains Mono',monospace"
var FD = "'Bricolage Grotesque',serif"

export default function App() { return <EB><Inner /></EB> }

function Inner() {
  var [tab, setTab] = useState('encyclopedia')
  var [rp, setRp] = useState({})
  var [toast, setToast] = useState(null)
  var [ok, setOk] = useState(false)
  var [server, setServer] = useState(getSrv())
  var [kmSyncing, setKmSyncing] = useState(false)

  function show(m, t) { setToast({ m: m, t: t || 'ok' }); setTimeout(function() { setToast(null) }, 2500) }

  function loadPrices(srv) {
    getRunePrices(srv).then(function(data) {
      if (data && data.length > 0) {
        var map = {}; for (var i = 0; i < data.length; i++) { map[data[i].name] = data[i].price }
        setRp(map); setOk(true)
      }
    }).catch(function() {})
  }

  useEffect(function() { loadPrices(server) }, [server])

  function changeServer(s) { setServer(s); setSrv(s); loadPrices(s) }

  function updatePrice(name, price) {
    setRp(function(p) { var n = Object.assign({}, p); n[name] = price; return n })
    setRunePrice(name, price, server)
  }

  async function syncKamaMaster() {
    setKmSyncing(true)
    try {
      var prices = await fetchKamaMasterRunePrices(server)
      if (prices && Object.keys(prices).length > 0) {
        await bulkSetRunePrices(prices, server)
        setRp(function(prev) { return Object.assign({}, prev, prices) })
        show('KamaMaster : ' + Object.keys(prices).length + ' prix synchronisés !', 'ok')
      } else {
        show('KamaMaster indisponible — API inaccessible', 'err')
      }
    } catch (e) {
      show('Erreur KamaMaster : ' + e.message, 'err')
    }
    setKmSyncing(false)
  }

  var tabs = [
    { k: 'encyclopedia', l: 'Encyclopédie', I: BookOpen },
    { k: 'dashboard', l: 'Rentabilité', I: BarChart3 },
    { k: 'runes', l: 'Runes', I: Sparkles },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(1200px 600px at 10% -10%,#D9E3F7 0%,transparent 50%),radial-gradient(900px 500px at 90% 10%,#E8DEFB 0%,transparent 50%),linear-gradient(180deg,#F2F5FC,#FFF 60%)', fontFamily: "'Manrope',system-ui,sans-serif", color: '#0A1A3A' }}>
      {toast ? <div className="fixed top-4 right-4 z-50 animate-fadeUp"><div className="px-4 py-2.5 rounded-2xl shadow-2xl text-white font-semibold text-sm" style={{ background: toast.t === 'ok' ? 'rgba(16,185,129,.95)' : 'rgba(239,68,68,.95)' }}>{toast.m}</div></div> : null}

      <header className="sticky top-0 z-30 backdrop-blur-xl border-b border-white/60" style={{ background: 'rgba(242,245,252,.88)' }}>
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-md" style={{ background: 'linear-gradient(135deg,#0F1B3D,#2D4AAF)' }}>
              <Hammer className="w-4 h-4 text-white" strokeWidth={2.5} />
            </div>
            <div className="hidden sm:block"><div className="font-bold text-sm" style={{ fontFamily: FD }}>Concassage Lab</div><div className="text-[9px] text-slate-500 font-semibold tracking-widest uppercase">Dofus</div></div>
          </div>
          <div className="flex gap-0.5">
            {tabs.map(function(t) { return <button key={t.k} onClick={function() { setTab(t.k) }} className="px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1" style={{ background: tab === t.k ? '#0F1B3D' : 'transparent', color: tab === t.k ? '#fff' : '#4B5870' }}><t.I className="w-3.5 h-3.5" /><span className="hidden sm:inline">{t.l}</span></button> })}
          </div>
          <div className="flex items-center gap-2">
            <select value={server} onChange={function(e) { changeServer(e.target.value) }} className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-semibold text-slate-700 outline-none">
              {SERVERS.map(function(s) { return <option key={s} value={s}>{s}</option> })}
            </select>
            <button onClick={syncKamaMaster} disabled={kmSyncing} title="Synchroniser les prix depuis KamaMaster"
              className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-all">
              <RefreshCw className={'w-3.5 h-3.5 text-slate-500' + (kmSyncing ? ' animate-spin' : '')} />
            </button>
            <div className="hidden md:flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold" style={{ background: ok ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.12)', color: ok ? '#047857' : '#B91C1C' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: ok ? '#10b981' : '#ef4444' }}></span>
              {ok ? server : 'Hors-ligne'}
            </div>
          </div>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 pb-20">
        {tab === 'encyclopedia' ? <Ency rp={rp} show={show} /> : null}
        {tab === 'dashboard' ? <Dash rp={rp} show={show} /> : null}
        {tab === 'runes' ? <RuneV rp={rp} onUpdate={updatePrice} server={server} onSync={syncKamaMaster} kmSyncing={kmSyncing} /> : null}
      </main>
      <footer className="text-center text-[10px] text-slate-400 pb-8">{'Concassage Lab · ' + server + ' · données DofusDB & communautaires'}</footer>
    </div>
  )
}

// ═══════════════════════════════════════
// SORTS OPTIONS
// ═══════════════════════════════════════
var SORT_OPTS = [
  { k: 'level-asc',    label: 'Niveau ↑',    field: 'level', asc: true,  clientSide: false },
  { k: 'level-desc',   label: 'Niveau ↓',    field: 'level', asc: false, clientSide: false },
  { k: 'name-asc',     label: 'Nom A→Z',     field: 'name',  asc: true,  clientSide: false },
  { k: 'name-desc',    label: 'Nom Z→A',     field: 'name',  asc: false, clientSide: false },
  { k: 'type-asc',     label: 'Type A→Z',    field: 'type',  asc: true,  clientSide: false },
  { k: 'weight-desc',  label: 'Poids ↓',     field: null,    asc: false, clientSide: true  },
  { k: 'weight-asc',   label: 'Poids ↑',     field: null,    asc: true,  clientSide: true  },
]

function itemWeight(it) {
  var runes = computeRuneBreakdown(it.effects || [], it.level)
  var w = 0; for (var j = 0; j < runes.length; j++) w += runes[j].weight
  return w
}

// ═══════════════════════════════════════
// ENCYCLOPÉDIE
// ═══════════════════════════════════════
function Ency(props) {
  var [items, setItems] = useState([])
  var [total, setTotal] = useState(0)
  var [page, setPage] = useState(1)
  var [loading, setLoading] = useState(true)
  var [query, setQuery] = useState('')
  var [lvMin, setLvMin] = useState(1)
  var [lvMax, setLvMax] = useState(200)
  var [typeF, setTypeF] = useState('all')
  var [sel, setSel] = useState(null)
  var [sort, setSort] = useState('level-asc')
  var [allItems, setAllItems] = useState(null)

  var so = SORT_OPTS.find(function(o) { return o.k === sort }) || SORT_OPTS[0]

  // Mode client-side (sort par poids) : charge tout une fois
  var doLoadAll = useCallback(function() {
    if (allItems !== null) return
    setLoading(true)
    getAllItems().then(function(data) {
      setAllItems(data || [])
      setLoading(false)
    }).catch(function() { setLoading(false) })
  }, [allItems])

  // Mode server-side
  var doLoad = useCallback(function() {
    if (so.clientSide) return
    setLoading(true)
    getItems(query, lvMin, lvMax, typeF, page, so.field, so.asc).then(function(r) {
      setItems(r.data || []); setTotal(r.count || 0); setLoading(false)
    }).catch(function() { setLoading(false) })
  }, [query, lvMin, lvMax, typeF, page, sort, so])

  useEffect(function() {
    if (so.clientSide) { doLoadAll() }
    else { var t = setTimeout(doLoad, 350); return function() { clearTimeout(t) } }
  }, [sort, doLoad, doLoadAll, so.clientSide])

  // Re-déclencher server-side quand les filtres changent (sauf si on est en mode poids)
  useEffect(function() {
    if (!so.clientSide) { var t = setTimeout(doLoad, 350); return function() { clearTimeout(t) } }
  }, [query, lvMin, lvMax, typeF, page, doLoad])

  // Résultats en mode client-side (sort par poids)
  var clientResults = useMemo(function() {
    if (!so.clientSide || allItems === null) return null
    var filtered = allItems.filter(function(it) {
      if (query && it.name.toLowerCase().indexOf(query.toLowerCase()) < 0) return false
      if (it.level < lvMin || it.level > lvMax) return false
      if (typeF !== 'all' && it.type !== typeF) return false
      return true
    })
    filtered.sort(function(a, b) {
      var wa = itemWeight(a), wb = itemWeight(b)
      return so.asc ? wa - wb : wb - wa
    })
    return filtered
  }, [allItems, query, lvMin, lvMax, typeF, sort, so])

  var displayItems = so.clientSide ? (clientResults ? clientResults.slice((page - 1) * 100, page * 100) : []) : items
  var displayTotal = so.clientSide ? (clientResults ? clientResults.length : 0) : total
  var tp = Math.ceil(displayTotal / 100) || 1

  function goToIngredient(name) {
    setLoading(true)
    getItemByName(name).then(function(item) {
      if (item) { setSel(item) }
      else { props.show(name + ' — pas encore dans la base', 'err') }
      setLoading(false)
    }).catch(function() { setLoading(false) })
  }

  if (sel) return <Detail item={sel} onBack={function() { setSel(null) }} rp={props.rp} onIngredientClick={goToIngredient} />

  return (
    <div className="animate-fadeUp">
      <div className="text-center mb-6">
        <h1 className="text-4xl md:text-5xl font-bold" style={{ fontFamily: FD, letterSpacing: '-0.03em' }}>
          {"Encyclopédie "}<span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(120deg,#2D4AAF,#7E57C2 60%,#C49A3B)' }}>Dofus</span>
        </h1>
        <p className="text-slate-500 mt-2 text-sm">{displayTotal.toLocaleString('fr') + ' équipements'}</p>
      </div>
      <div className="max-w-3xl mx-auto mb-6 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={query} onChange={function(e) { setQuery(e.target.value); setPage(1) }} placeholder="Rechercher un équipement…"
            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/80 backdrop-blur-xl border border-white shadow-lg text-sm font-medium outline-none focus:ring-2 focus:ring-blue-300/60" />
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-center text-xs text-slate-600">
          <label className="flex items-center gap-1">{"Niv "}
            <input type="number" value={lvMin} onChange={function(e) { setLvMin(Number(e.target.value) || 1); setPage(1) }} className="w-12 px-1.5 py-1 rounded-lg bg-white border border-slate-200 text-center font-semibold" min={1} max={200} />
          </label>
          <span>—</span>
          <input type="number" value={lvMax} onChange={function(e) { setLvMax(Number(e.target.value) || 200); setPage(1) }} className="w-12 px-1.5 py-1 rounded-lg bg-white border border-slate-200 text-center font-semibold" min={1} max={200} />
          <select value={typeF} onChange={function(e) { setTypeF(e.target.value); setPage(1) }} className="px-2 py-1 rounded-lg bg-white border border-slate-200 font-semibold">
            <option value="all">Tous types</option>
            {EQUIPMENT_TYPES.map(function(t) { return <option key={t} value={t}>{t}</option> })}
          </select>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-200">
            <ArrowUpDown className="w-3 h-3 text-slate-400" />
            <select value={sort} onChange={function(e) { setSort(e.target.value); setPage(1) }} className="text-xs font-semibold bg-transparent outline-none">
              {SORT_OPTS.map(function(o) { return <option key={o.k} value={o.k}>{o.label}</option> })}
            </select>
          </div>
        </div>
      </div>
      {loading ? <Spin text={so.clientSide ? 'Chargement de tous les items…' : 'Chargement…'} /> : null}
      {!loading && displayItems.length === 0 ? <Emp icon="📖" title="Aucun résultat" msg="Change les filtres." /> : null}
      {!loading && displayItems.length > 0 ? (
        <div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {displayItems.map(function(item) { return <IC key={item.id} item={item} onClick={function() { setSel(item) }} rp={props.rp} /> })}
          </div>
          <Pag page={page} tp={tp} total={displayTotal} onPage={function(p) { setPage(p); window.scrollTo(0, 0) }} />
        </div>
      ) : null}
    </div>
  )
}

function IC(props) {
  var i = props.item, icon = TYPE_ICONS[i.type] || '📦'
  var rn = computeRuneBreakdown(i.effects || [], i.level)
  var tw = 0; for (var j = 0; j < rn.length; j++) tw += rn[j].weight
  var val = computeEstimatedValue(rn, props.rp || {})
  var coef = realCoefByLevel(i.level)
  return (
    <button onClick={props.onClick} className="card-hover bg-white/80 backdrop-blur-xl rounded-2xl p-3 border border-white/80 shadow-md text-left flex flex-col items-center gap-2 cursor-pointer">
      <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#EEF2FB,#E0E7F8)' }}>
        {i.img_url ? <img src={i.img_url} alt="" className="w-12 h-12 object-contain" onError={function(e) { e.target.style.display = 'none' }} /> : <span className="text-2xl">{icon}</span>}
      </div>
      <div className="text-center w-full">
        <div className="font-bold text-[11px] leading-tight truncate">{i.name}</div>
        <div className="text-[9px] text-slate-500 mt-0.5">{i.type + ' · Niv.' + i.level}</div>
        {tw > 0 ? <div className="text-[9px] font-bold mt-1 px-2 py-0.5 rounded-full inline-block" style={{ background: 'rgba(196,154,59,.12)', color: '#8B6914' }}>
          {val > 0 ? '≈' + Math.round(val * coef / 100).toLocaleString('fr') + ' k' : Math.round(tw) + ' pts'}
        </div> : null}
      </div>
    </button>
  )
}

// ═══════════════════════════════════════
// FICHE DÉTAILLÉE
// ═══════════════════════════════════════
function Detail(props) {
  var i = props.item, icon = TYPE_ICONS[i.type] || '📦'
  var effs = i.effects || []
  var runes = computeRuneBreakdown(effs, i.level)
  var tw = 0; for (var j = 0; j < runes.length; j++) tw += runes[j].weight
  var estVal = computeEstimatedValue(runes, props.rp)
  var recipe = i.recipe || [], drops = i.drops || []
  var coef = realCoefByLevel(i.level)

  // Filtre les ingrédients cassés (Item #undefined)
  var validRecipe = recipe.filter(function(r) {
    return r.n && r.n !== 'undefined' && !r.n.includes('#undefined') && r.q && r.q !== 'undefined'
  })
  var brokenRecipe = recipe.filter(function(r) {
    return !r.n || r.n.includes('#undefined') || !r.q || r.q === 'undefined'
  })

  return (
    <div className="animate-fadeUp">
      <button onClick={props.onBack} className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-4">
        <ArrowLeft className="w-4 h-4" /><span>Retour</span>
      </button>
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white shadow-xl overflow-hidden">
        {/* Hero */}
        <div className="p-6 md:p-8 flex flex-col md:flex-row items-center gap-6" style={{ background: 'linear-gradient(135deg,#EEF2FB,#E0E7F8)' }}>
          <div className="w-24 h-24 rounded-2xl bg-white/60 shadow-lg flex items-center justify-center">
            {i.img_url ? <img src={i.img_url} className="w-20 h-20 object-contain" onError={function(e) { e.target.style.display = 'none' }} alt="" /> : <span className="text-5xl">{icon}</span>}
          </div>
          <div className="flex-1 text-center md:text-left">
            <div className="text-[10px] font-bold text-blue-700 uppercase tracking-widest mb-1">{i.type + ' · Niveau ' + i.level}</div>
            <h2 className="text-3xl font-bold" style={{ fontFamily: FD }}>{i.name}</h2>
            {i.description ? <p className="text-sm text-slate-600 mt-2 max-w-xl">{i.description}</p> : null}
            <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
              <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(45,74,175,.1)', color: '#2D4AAF' }}>{'Poids total : ' + tw.toFixed(1)}</span>
              <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(16,185,129,.1)', color: '#047857' }}>{'Coef ≈ ' + coef + '%'}</span>
              {estVal > 0 ? <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(196,154,59,.15)', color: '#8B6914' }}>{'Val. 100% ≈ ' + Math.round(estVal).toLocaleString('fr') + ' k'}</span> : null}
              {estVal > 0 ? <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: 'rgba(196,154,59,.25)', color: '#8B6914' }}>{'Val. ' + coef + '% ≈ ' + Math.round(estVal * coef / 100).toLocaleString('fr') + ' k'}</span> : null}
            </div>
          </div>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stats */}
          <Sec title="Statistiques">
            {effs.filter(function(e) { return Math.max(e.f || 0, e.t || 0) !== 0 }).map(function(e, idx) {
              var ch = CHAR_MAP[e.c]; var label = ch ? ch.fr : ('#' + e.c)
              return <div key={idx} className="flex justify-between px-3 py-1.5 rounded-lg hover:bg-slate-50 text-sm">
                <span className="text-slate-700 font-medium">{label}</span>
                <span className="font-bold" style={{ fontFamily: MN, color: e.f < 0 ? '#B91C1C' : '#047857' }}>{e.t > 0 ? e.f + ' à ' + e.t : String(e.f)}</span>
              </div>
            })}
            {effs.length === 0 ? <p className="text-xs text-slate-400 italic">Aucune statistique</p> : null}
          </Sec>

          {/* Runes */}
          <Sec title={'Runes au concassage (coef ' + coef + '%)'}>
            {runes.length > 0 ? runes.map(function(r, idx) {
              var price = props.rp[r.name] || 0
              return <div key={idx} className="flex items-center justify-between px-3 py-2 rounded-xl bg-amber-50/60 mb-2">
                <div>
                  <span className="font-bold text-sm text-amber-900">{'Rune ' + r.name}</span>
                  <span className="text-[10px] text-slate-500 ml-2">{'(' + r.stat + ' : max ' + Math.round(r.maxVal) + ')'}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-xs" style={{ fontFamily: MN }}>{(r.weight * coef / 100).toFixed(1) + ' pts'}</div>
                  {price > 0 ? <div className="text-[10px] text-slate-500">{'≈ ' + Math.round(r.weight * coef / 100 * price).toLocaleString('fr') + ' k'}</div> : null}
                </div>
              </div>
            }) : <p className="text-xs text-slate-400 italic">Aucune rune (stats hors formule)</p>}
          </Sec>

          {/* Recette */}
          <Sec title={'Recette de craft' + (brokenRecipe.length > 0 ? ' ⚠️ ' + brokenRecipe.length + ' ingrédient(s) à réparer' : '')}>
            {validRecipe.length > 0 ? validRecipe.map(function(r, idx) {
              return (
                <button key={idx} onClick={function() { if (props.onIngredientClick) props.onIngredientClick(r.n) }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-blue-50/50 mb-1.5 hover:bg-blue-100/60 transition-all cursor-pointer text-left group">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">📦</span>
                    <span className="font-semibold text-sm text-slate-800 group-hover:text-blue-700 transition-colors">{r.n}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm px-2 py-0.5 rounded-lg bg-white" style={{ fontFamily: MN }}>{'×' + r.q}</span>
                    <span className="text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">{'voir →'}</span>
                  </div>
                </button>
              )
            }) : null}
            {brokenRecipe.length > 0 ? (
              <div className="px-3 py-2 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-700 mt-1">
                <strong>{brokenRecipe.length} ingrédient(s) non résolus</strong> — Lance <code>fix-recipes.html</code> pour réparer.
              </div>
            ) : null}
            {recipe.length === 0 ? <p className="text-xs text-slate-400 italic">Recette non renseignée</p> : null}
          </Sec>

          {/* Drops */}
          <Sec title="Obtention / Monstres">
            {drops.length > 0 ? drops.map(function(d, idx) {
              return <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-50/50 mb-1.5">
                <span className="text-lg">👹</span><span className="font-semibold text-sm text-slate-800">{d}</span>
              </div>
            }) : <p className="text-xs text-slate-500 italic">Craftable uniquement ou non référencé.</p>}
          </Sec>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
// DASHBOARD RENTABILITÉ
// ═══════════════════════════════════════
function Dash(props) {
  var [all, setAll] = useState([])
  var [lc, setLc] = useState(0)
  var [done, setDone] = useState(false)
  var [filter, setFilter] = useState('')
  var [typeF, setTypeF] = useState('all')
  var [lvMin, setLvMin] = useState(1)
  var [lvMax, setLvMax] = useState(200)
  var [page, setPage] = useState(1)
  var [bp, setBp] = useState(getBP())
  var PS = 100

  useEffect(function() {
    getAllItems(function(c) { setLc(c) }).then(function(d) { setAll(d || []); setDone(true) })
  }, [])

  var ranked = useMemo(function() {
    var res = []
    for (var i = 0; i < all.length; i++) {
      var it = all[i]
      if (filter && it.name.toLowerCase().indexOf(filter.toLowerCase()) < 0) continue
      if (typeF !== 'all' && it.type !== typeF) continue
      if (it.level < lvMin || it.level > lvMax) continue
      var runes = computeRuneBreakdown(it.effects || [], it.level)
      var rv100 = computeEstimatedValue(runes, props.rp)
      if (rv100 <= 0) continue
      var coef = realCoefByLevel(it.level)
      var adj = rv100 * coef / 100
      var buyP = bp[it.id] || 0
      var profit = buyP > 0 ? adj - buyP : null
      var roi = buyP > 0 ? ((adj - buyP) / buyP) * 100 : null
      res.push({ item: it, runes: runes, rv100: rv100, coef: coef, adj: adj, buyPrice: buyP, profit: profit, roi: roi })
    }
    res.sort(function(a, b) {
      if (a.roi !== null && b.roi !== null) return b.roi - a.roi
      if (a.roi !== null) return -1
      if (b.roi !== null) return 1
      return b.adj - a.adj
    })
    return res
  }, [all, props.rp, filter, typeF, lvMin, lvMax, bp])

  var tp = Math.ceil(ranked.length / PS) || 1
  var pageItems = ranked.slice((page - 1) * PS, page * PS)

  function handleBP(id, v) {
    var p = parseFloat(v) || 0; saveBP(id, p)
    setBp(function(prev) { var n = Object.assign({}, prev); n[id] = p; return n })
  }

  if (!done) return (
    <div className="animate-fadeUp text-center py-16">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
      <h3 className="text-lg font-bold" style={{ fontFamily: FD }}>Chargement des items…</h3>
      <p className="text-sm text-slate-500 mt-1">{lc.toLocaleString('fr') + ' chargés'}</p>
      <div className="w-64 h-2 bg-slate-200 rounded-full mx-auto mt-4 overflow-hidden"><div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#3b82f6,#8b5cf6)', width: Math.min(100, lc / 50) + '%', transition: 'width 0.3s' }}></div></div>
    </div>
  )

  return (
    <div className="animate-fadeUp">
      <h2 className="text-3xl font-bold" style={{ fontFamily: FD }}>Classement Rentabilité</h2>
      <p className="text-sm text-slate-500 mb-1">{all.length.toLocaleString('fr') + ' items · ' + ranked.length.toLocaleString('fr') + ' avec valeur de runes'}</p>
      <p className="text-xs text-slate-400 mb-4 italic">Coef réel par niveau (78–90%). Saisis un prix d'achat → bénéfice et ROI calculés.</p>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={filter} onChange={function(e) { setFilter(e.target.value); setPage(1) }} placeholder="Filtrer par nom…"
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/80 border border-white shadow text-sm outline-none" />
        </div>
        <select value={typeF} onChange={function(e) { setTypeF(e.target.value); setPage(1) }} className="px-2 py-2 rounded-xl bg-white/80 border border-white shadow text-xs font-semibold outline-none">
          <option value="all">Tous types</option>
          {EQUIPMENT_TYPES.map(function(t) { return <option key={t} value={t}>{t}</option> })}
        </select>
        <div className="flex items-center gap-1 text-xs text-slate-600">
          <span>Niv</span>
          <input type="number" value={lvMin} onChange={function(e) { setLvMin(Number(e.target.value) || 1); setPage(1) }} className="w-12 px-1.5 py-1.5 rounded-xl bg-white border border-slate-200 text-center font-semibold outline-none" min={1} max={200} />
          <span>—</span>
          <input type="number" value={lvMax} onChange={function(e) { setLvMax(Number(e.target.value) || 200); setPage(1) }} className="w-12 px-1.5 py-1.5 rounded-xl bg-white border border-slate-200 text-center font-semibold outline-none" min={1} max={200} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <KPI label="Items rentables" value={ranked.length.toLocaleString('fr')} />
        <KPI label="Top 1" value={ranked.length > 0 ? ranked[0].item.name : '—'} small />
        <KPI label="Meilleure valeur" value={ranked.length > 0 ? Math.round(ranked[0].adj).toLocaleString('fr') + ' k' : '—'} color="#047857" />
        <KPI label="Avec prix renseigné" value={Object.keys(bp).filter(function(k) { return bp[k] > 0 }).length.toString()} color="#2D4AAF" />
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm"><thead>
            <tr className="text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
              <th className="px-3 py-3 w-8">#</th>
              <th className="px-3 py-3">Équipement</th>
              <th className="px-3 py-3 text-right">Niv</th>
              <th className="px-3 py-3 text-right">Coef</th>
              <th className="px-3 py-3 text-right">Val. runes</th>
              <th className="px-3 py-3 text-right">Prix achat (k)</th>
              <th className="px-3 py-3 text-right">Bénéfice</th>
              <th className="px-3 py-3 text-right">ROI</th>
            </tr></thead><tbody>
            {pageItems.map(function(r, idx) {
              var rank = (page - 1) * PS + idx + 1
              var icon = TYPE_ICONS[r.item.type] || '📦'
              return (
                <tr key={r.item.id} className="border-b border-slate-50 last:border-0 hover:bg-blue-50/30 transition">
                  <td className="px-3 py-2 text-xs font-bold text-slate-400">{rank}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {r.item.img_url ? <img src={r.item.img_url} alt="" className="w-7 h-7 object-contain rounded" onError={function(e) { e.target.style.display = 'none' }} /> : <span className="text-base">{icon}</span>}
                      <div><div className="font-semibold text-xs">{r.item.name}</div><div className="text-[10px] text-slate-400">{r.item.type}</div></div>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right text-xs font-semibold text-slate-500">{r.item.level}</td>
                  <td className="px-3 py-2 text-right text-[10px] font-bold text-slate-500">{r.coef + '%'}</td>
                  <td className="px-3 py-2 text-right text-xs font-bold" style={{ fontFamily: MN, color: '#8B6914' }}>{Math.round(r.adj).toLocaleString('fr')}</td>
                  <td className="px-3 py-2 text-right">
                    <input type="number" value={r.buyPrice || ''} placeholder="—" onChange={function(e) { handleBP(r.item.id, e.target.value) }}
                      className="w-24 text-right bg-slate-50 rounded-lg px-2 py-1 text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-300" style={{ fontFamily: MN }} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    {r.profit !== null ? <span className="font-bold text-xs" style={{ fontFamily: MN, color: r.profit >= 0 ? '#047857' : '#B91C1C' }}>{(r.profit >= 0 ? '+' : '') + Math.round(r.profit).toLocaleString('fr')}</span>
                      : <span className="text-[10px] text-slate-300">—</span>}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {r.roi !== null ? <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: r.roi >= 0 ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.12)', color: r.roi >= 0 ? '#047857' : '#B91C1C' }}>{(r.roi >= 0 ? '+' : '') + r.roi.toFixed(1) + '%'}</span>
                      : <span className="text-[10px] text-slate-300">—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody></table>
        </div>
      </div>
      <Pag page={page} tp={tp} total={ranked.length} onPage={function(p) { setPage(p); window.scrollTo(0, 0) }} />
    </div>
  )
}

// ═══════════════════════════════════════
// RUNE PRICES
// ═══════════════════════════════════════
function RuneV(props) {
  var list = Object.entries(props.rp).sort(function(a, b) { return b[1] - a[1] })
  return (
    <div className="animate-fadeUp">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-3xl font-bold" style={{ fontFamily: FD }}>Prix des Runes</h2>
        <button onClick={props.onSync} disabled={props.kmSyncing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50 transition-all">
          <RefreshCw className={'w-3.5 h-3.5' + (props.kmSyncing ? ' animate-spin' : '')} />
          <span>Sync KamaMaster</span>
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-5">{'Serveur : ' + props.server + ' — modifie un prix → MAJ pour tous sur ce serveur'}</p>
      {list.length === 0 ? <Spin text="Chargement…" /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {list.map(function(e) {
            return (
              <div key={e[0]} className="card-hover bg-white/80 backdrop-blur-xl rounded-2xl p-3.5 border border-white shadow-md flex items-center justify-between">
                <div className="flex items-center gap-2"><Sparkles className="w-4 h-4" style={{ color: '#8B6914' }} /><div><div className="font-bold text-sm">{'Rune ' + e[0]}</div><div className="text-[9px] text-slate-400">kamas / poids</div></div></div>
                <input type="number" value={e[1]} onChange={function(ev) { props.onUpdate(e[0], parseFloat(ev.target.value) || 0) }}
                  className="w-24 text-right px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-sm outline-none focus:ring-2 focus:ring-amber-300" style={{ fontFamily: MN }} min={0} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════
// SHARED
// ═══════════════════════════════════════
function Pag(props) {
  if (props.tp <= 1) return null
  var pages = [], s = Math.max(1, props.page - 3), e = Math.min(props.tp, props.page + 3)
  for (var i = s; i <= e; i++) pages.push(i)
  return (
    <div className="flex justify-center items-center gap-1.5 mt-6 flex-wrap">
      <button disabled={props.page <= 1} onClick={function() { props.onPage(props.page - 1) }} className="p-2 rounded-xl bg-white border border-slate-200 disabled:opacity-30 hover:bg-slate-50"><ChevronLeft className="w-4 h-4" /></button>
      {s > 1 ? <button onClick={function() { props.onPage(1) }} className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-semibold">1</button> : null}
      {s > 2 ? <span className="text-slate-400 text-xs">…</span> : null}
      {pages.map(function(p) { return <button key={p} onClick={function() { props.onPage(p) }} className="px-2.5 py-1 rounded-xl text-xs font-semibold" style={{ background: p === props.page ? '#0F1B3D' : 'white', color: p === props.page ? 'white' : '#4B5870', border: '1px solid ' + (p === props.page ? '#0F1B3D' : '#e2e8f0') }}>{p}</button> })}
      {e < props.tp - 1 ? <span className="text-slate-400 text-xs">…</span> : null}
      {e < props.tp ? <button onClick={function() { props.onPage(props.tp) }} className="px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-xs font-semibold">{props.tp}</button> : null}
      <button disabled={props.page >= props.tp} onClick={function() { props.onPage(props.page + 1) }} className="p-2 rounded-xl bg-white border border-slate-200 disabled:opacity-30 hover:bg-slate-50"><ChevronRight className="w-4 h-4" /></button>
      <span className="text-[10px] text-slate-500 ml-1">{props.total.toLocaleString('fr') + ' items'}</span>
    </div>
  )
}

function Sec(p) { return <div><h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{p.title}</h3>{p.children}</div> }
function KPI(p) { return <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-3 border border-white shadow-md"><div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{p.label}</div><div className={"font-bold mt-0.5 " + (p.small ? "text-sm truncate" : "text-xl")} style={{ fontFamily: FD, color: p.color || '#0A1A3A' }}>{p.value}</div></div> }
function Spin(p) { return <div className="flex items-center justify-center gap-2 py-12"><Loader2 className="w-5 h-5 animate-spin text-blue-600" /><span className="text-sm text-slate-600">{p.text}</span></div> }
function Emp(p) { return <div className="bg-white/60 backdrop-blur-xl rounded-3xl border border-white/80 shadow-sm p-10 text-center"><div className="text-3xl mb-2">{p.icon}</div><h3 className="text-lg font-bold" style={{ fontFamily: FD }}>{p.title}</h3><p className="text-sm text-slate-500 mt-1">{p.msg}</p></div> }
