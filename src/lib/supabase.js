import { createClient } from '@supabase/supabase-js'

var db = null
try {
  var u = import.meta.env.VITE_SUPABASE_URL
  var k = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (u && k) { db = createClient(u, k) }
} catch (e) { console.error('Supabase init:', e) }

export { db }

export var SERVERS = ['Imagiro', 'Ilyzaelle', 'Draconiros', 'Tylezia', 'Hell Mina', 'Oshimo', 'Herdegrize', 'Brutas']

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

export async function getItemByName(name) {
  if (!db || !name) return null
  try {
    var r = await db.from('items').select('*').ilike('name', '%' + name + '%').limit(1).single()
    return r.data || null
  } catch (e) { return null }
}

export async function getItemById(id) {
  if (!db) return null
  try {
    var r = await db.from('items').select('*').eq('id', id).single()
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

export async function getRunePrices(server) {
  if (!db) return []
  try {
    var q = db.from('rune_prices').select('*').order('price', { ascending: false })
    if (server) q = q.eq('server', server)
    var r = await q
    return r.data || []
  } catch (e) { return [] }
}

export async function setRunePrice(name, price, server) {
  if (!db) return
  try {
    await db.from('rune_prices').upsert(
      { name: name, price: price, server: server || 'Imagiro' },
      { onConflict: 'name,server' }
    )
  } catch (e) { console.error('setRunePrice:', e) }
}

export async function bulkSetRunePrices(priceMap, server) {
  if (!db || !priceMap) return
  var srv = server || 'Imagiro'
  var rows = Object.entries(priceMap).map(function(e) {
    return { name: e[0], price: Math.round(e[1]), server: srv }
  })
  if (!rows.length) return
  try {
    await db.from('rune_prices').upsert(rows, { onConflict: 'name,server' })
  } catch (e) { console.error('bulkSetRunePrices:', e) }
}
