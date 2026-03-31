import { create } from 'zustand'

// Initialize theme from localStorage or default to 'dark'
const getInitialTheme = () => {
  try {
    const saved = localStorage.getItem('wedding-planner-theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch {}
  return 'dark'
}

// Apply theme to DOM
const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme)
  try { localStorage.setItem('wedding-planner-theme', theme) } catch {}
}

// Apply initial theme immediately
applyTheme(getInitialTheme())

export const useAppStore = create((set, get) => ({
  // ─── Auth ─────────────────────────────────────────────────
  user: null,
  session: null,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session, user: session?.user ?? null }),
  // Wipe all data on sign-out — prevents data from leaking between sessions
  clearAll: () => set({
    user: null, session: null,
    wedding: null,
    budgetItems: [], guests: [], checklistItems: [], seserahanItems: [],
    engagementItems: [], preweddingItems: [], adminDocs: [], weddingBudgetItems: [],
  }),

  // ─── Wedding ──────────────────────────────────────────────
  wedding: null,
  setWedding: (wedding) => set({ wedding }),
  updateWedding: (updates) => set((s) => ({ wedding: { ...s.wedding, ...updates } })),

  // ─── Budget ───────────────────────────────────────────────
  budgetItems: [],
  setBudgetItems: (budgetItems) => set({ budgetItems }),
  addBudgetItem: (item) => set((s) => ({ budgetItems: [...s.budgetItems, item] })),
  updateBudgetItem: (id, updates) =>
    set((s) => ({
      budgetItems: s.budgetItems.map((i) => (i.id === id ? { ...i, ...updates } : i))
    })),
  removeBudgetItem: (id) =>
    set((s) => ({ budgetItems: s.budgetItems.filter((i) => i.id !== id) })),

  // ─── Guests ───────────────────────────────────────────────
  guests: [],
  setGuests: (guests) => set({ guests }),
  addGuest: (guest) => set((s) => ({ guests: [...s.guests, guest] })),
  updateGuest: (id, updates) =>
    set((s) => ({
      guests: s.guests.map((g) => (g.id === id ? { ...g, ...updates } : g))
    })),
  removeGuest: (id) =>
    set((s) => ({ guests: s.guests.filter((g) => g.id !== id) })),

  // ─── Checklist ────────────────────────────────────────────
  checklistItems: [],
  setChecklistItems: (checklistItems) => set({ checklistItems }),
  addChecklistItem: (item) => set((s) => ({ checklistItems: [...s.checklistItems, item] })),
  toggleChecklistItem: (id, is_done) =>
    set((s) => ({
      checklistItems: s.checklistItems.map((i) => (i.id === id ? { ...i, is_done } : i))
    })),
  removeChecklistItem: (id) =>
    set((s) => ({ checklistItems: s.checklistItems.filter((i) => i.id !== id) })),

  // ─── Seserahan ────────────────────────────────────────────────────────────────
  seserahanItems: [],
  setSeserahanItems: (seserahanItems) => set({ seserahanItems }),
  addSeserahanItem: (item) => set((s) => ({ seserahanItems: [...s.seserahanItems, item] })),
  updateSeserahanItem: (id, updates) =>
    set((s) => ({
      seserahanItems: s.seserahanItems.map((i) => (i.id === id ? { ...i, ...updates } : i))
    })),
  removeSeserahanItem: (id) =>
    set((s) => ({ seserahanItems: s.seserahanItems.filter((i) => i.id !== id) })),

  // ─── Engagement ───────────────────────────────────────────────────────────────
  engagementItems: [],
  setEngagementItems: (engagementItems) => set({ engagementItems }),

  // ─── Pre-Wedding ──────────────────────────────────────────────────────────────
  preweddingItems: [],
  setPreweddingItems: (preweddingItems) => set({ preweddingItems }),

  // ─── Admin Documents ──────────────────────────────────────────────────────────
  adminDocs: [],
  setAdminDocs: (adminDocs) => set({ adminDocs }),

  // ─── Wedding Budget ───────────────────────────────────────────────────────────
  weddingBudgetItems: [],
  setWeddingBudgetItems: (weddingBudgetItems) => set({ weddingBudgetItems }),

  // ─── Theme ────────────────────────────────────────────────────────────────────
  theme: getInitialTheme(),
  toggleTheme: () => set((s) => {
    const next = s.theme === 'dark' ? 'light' : 'dark'
    applyTheme(next)
    return { theme: next }
  }),
}))
