import { createClient } from '@supabase/supabase-js'

var db = null
try {
  var u = import.meta.env.VITE_SUPABASE_URL
  var k = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (u && k) db = createClient(u, k)
} catch (e) { console.error('Supabase init:', e) }

export { db }

// ─── Équipements ─────────────────────────────────────────────

export async function getItems(search, lvMin, lvMax, type, page, sortField, sortAsc) {
  if (!db) return { data: [], count: 0 }
  try {
    var ps = 100, from = ((page || 1) - 1) * ps, to = from + ps - 1
    var sf = sortField || 'level', asc = sortAsc !== undefined ? sortAsc : true
    var q = db.from('items').select('*', { count: 'exact' })
      .gte('level', lvMin || 1).lte('level', lvMax || 200)
      .order(sf, { ascending: asc }).range(from, to)
    if (search) q = q.ilike('name', '%' + search + '%')
    if (type && type !== 'all') q = q.eq('type', type)
    var r = await q
    return { data: r.data || [], count: r.count || 0 }
  } catch (e) { return { data: [], count: 0 } }
}

export async function getItemByAnkamaId(ankamaId) {
  if (!db || !ankamaId) return null
  try {
    var r = await db.from('items').select('*').eq('ankama_id', ankamaId).limit(1).single()
    return r.data || null
  } catch (e) { return null }
}

export async function getItemByName(name) {
  if (!db || !name) return null
  try {
    var r = await db.from('items').select('*').ilike('name', '%' + name + '%').limit(1).single()
    return r.data || null
  } catch (e) { return null }
}

export async function getAllItems(onProgress) {
  if (!db) return []
  var all = [], bs = 1000, off = 0, more = true
  while (more) {
    try {
      var r = await db.from('items').select('*').order('level', { ascending: false }).range(off, off + bs - 1)
      var b = r.data || []; all = all.concat(b); off += bs
      if (onProgress) onProgress(all.length)
      if (b.length < bs) more = false
    } catch (e) { more = false }
  }
  return all
}

// ─── Prix HDV ────────────────────────────────────────────────

// Retourne un map ankama_id → {name, price, img_url, type, level}
export async function getHdvPrices(server) {
  if (!db) return {}
  try {
    var all = [], off = 0, limit = 1000, more = true
    while (more) {
      var r = await db.from('hdv_prices').select('ankama_id,name,price,img_url,type,level')
        .eq('server', server).range(off, off + limit - 1)
      var b = r.data || []; all = all.concat(b); off += limit
      if (b.length < limit) more = false
    }
    var map = {}
    for (var i = 0; i < all.length; i++) {
      var item = all[i]
      map[item.ankama_id] = item
    }
    return map
  } catch (e) { console.error('getHdvPrices:', e); return {} }
}

export async function bulkUpsertHdvPrices(rows) {
  if (!db || !rows || !rows.length) return
  var bs = 500
  for (var i = 0; i < rows.length; i += bs) {
    try {
      await db.from('hdv_prices').upsert(rows.slice(i, i + bs), { onConflict: 'ankama_id,server' })
    } catch (e) { console.error('bulkUpsertHdvPrices batch:', e) }
  }
}

// ─── Prix runes (table legacy, pour overrides manuels) ───────

export async function getRunePrices(server) {
  if (!db) return []
  try {
    var q = db.from('rune_prices').select('*').order('price', { ascending: false })
    if (server) q = q.eq('server', server)
    var r = await q; return r.data || []
  } catch (e) { return [] }
}

export async function setRunePrice(name, price, server) {
  if (!db) return
  try {
    await db.from('rune_prices').upsert(
      { name, price, server: server || 'Imagiro' },
      { onConflict: 'name,server' }
    )
  } catch (e) { console.error('setRunePrice:', e) }
}
