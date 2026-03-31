import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── AUTH HELPERS ────────────────────────────────────────────────────────────

export const signUp = async (email, password, name) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: name } }
  })
  if (error) throw error
  return data
}

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

// ─── WEDDING HELPERS ─────────────────────────────────────────────────────────

export const getOrCreateWedding = async (userId) => {
  let { data, error } = await supabase
    .from('weddings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!data) {
    const { data: newWedding, error: createError } = await supabase
      .from('weddings')
      .insert({ user_id: userId, title: 'Pernikahan Kami', budget_total: 100000000 })
      .select()
      .single()
    if (createError) throw createError
    return newWedding
  }
  return data
}

// ─── BUDGET HELPERS ──────────────────────────────────────────────────────────

export const getBudgetItems = async (weddingId) => {
  const { data, error } = await supabase
    .from('budget_items')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export const addBudgetItem = async (item) => {
  const { data, error } = await supabase
    .from('budget_items')
    .insert(item)
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateBudgetItem = async (id, updates) => {
  const { data, error } = await supabase
    .from('budget_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteBudgetItem = async (id) => {
  const { error } = await supabase.from('budget_items').delete().eq('id', id)
  if (error) throw error
}

// ─── GUEST HELPERS ────────────────────────────────────────────────────────────

export const getGuests = async (weddingId) => {
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export const addGuest = async (guest) => {
  const { data, error } = await supabase
    .from('guests')
    .insert(guest)
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateGuest = async (id, updates) => {
  const { data, error } = await supabase
    .from('guests')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteGuest = async (id) => {
  const { error } = await supabase.from('guests').delete().eq('id', id)
  if (error) throw error
}

// ─── CHECKLIST HELPERS ────────────────────────────────────────────────────────

export const getChecklistItems = async (weddingId) => {
  const { data, error } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('due_date', { ascending: true })
  if (error) throw error
  return data
}

export const addChecklistItem = async (item) => {
  const { data, error } = await supabase
    .from('checklist_items')
    .insert(item)
    .select()
    .single()
  if (error) throw error
  return data
}

export const toggleChecklistItem = async (id, is_done) => {
  const { data, error } = await supabase
    .from('checklist_items')
    .update({ is_done })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteChecklistItem = async (id) => {
  const { error } = await supabase.from('checklist_items').delete().eq('id', id)
  if (error) throw error
}

// ─── SESERAHAN HELPERS ────────────────────────────────────────────────────────

export const getSeserahanItems = async (weddingId) => {
  const { data, error } = await supabase
    .from('seserahan_items')
    .select('*')
    .eq('wedding_id', weddingId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data
}

export const addSeserahanItem = async (item) => {
  const { data, error } = await supabase
    .from('seserahan_items')
    .insert(item)
    .select()
    .single()
  if (error) throw error
  return data
}

export const updateSeserahanItem = async (id, updates) => {
  const { data, error } = await supabase
    .from('seserahan_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export const deleteSeserahanItem = async (id) => {
  const { error } = await supabase.from('seserahan_items').delete().eq('id', id)
  if (error) throw error
}

export const uploadSeserahanImage = async (file, weddingId) => {
  const ext  = file.name.split('.').pop()
  const path = `${weddingId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from('seserahan').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from('seserahan').getPublicUrl(path)
  return data.publicUrl
}

export const deleteSeserahanImage = async (publicUrl) => {
  // Extract path from public URL
  const parts = publicUrl.split('/seserahan/')
  if (parts.length < 2) return
  const { error } = await supabase.storage.from('seserahan').remove([parts[1]])
  if (error) console.warn('Could not delete image:', error.message)
}
