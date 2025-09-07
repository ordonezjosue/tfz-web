import { create } from 'zustand'
import { MarketData, TradeLog, ScannerFilters } from './schema'

interface AuthState {
  user: { username: string; isAuthenticated: boolean } | null
  setUser: (user: { username: string; isAuthenticated: boolean } | null) => void
  logout: () => void
}

interface MarketDataState {
  marketData: Map<string, MarketData>
  loading: boolean
  error: string | null
  setMarketData: (ticker: string, data: MarketData) => void
  setBulkMarketData: (data: MarketData[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearMarketData: () => void
}

interface ScannerState {
  filters: ScannerFilters
  results: unknown[]
  loading: boolean
  error: string | null
  setFilters: (filters: ScannerFilters) => void
  setResults: (results: unknown[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

interface TradesState {
  trades: TradeLog[]
  openTrades: TradeLog[]
  closedTrades: TradeLog[]
  loading: boolean
  error: string | null
  setTrades: (trades: TradeLog[]) => void
  addTrade: (trade: TradeLog) => void
  updateTrade: (tradeId: string, updates: Partial<TradeLog>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}))

export const useMarketDataStore = create<MarketDataState>((set, get) => ({
  marketData: new Map(),
  loading: false,
  error: null,
  setMarketData: (ticker, data) => {
    const newMap = new Map(get().marketData)
    newMap.set(ticker, data)
    set({ marketData: newMap })
  },
  setBulkMarketData: (data) => {
    const newMap = new Map()
    data.forEach((item) => {
      newMap.set(item.ticker, item)
    })
    set({ marketData: newMap })
  },
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearMarketData: () => set({ marketData: new Map() }),
}))

export const useScannerStore = create<ScannerState>((set) => ({
  filters: {
    minDte: 7,
    maxDte: 10,
    minIvr: 25,
    preferredIvr: 35,
    targetDelta: 0.16,
    deltaRange: 0.05,
    minCreditPercent: 0.05,
    maxCreditPercent: 0.07,
    spreadWidth: '2.5',
  },
  results: [],
  loading: false,
  error: null,
  setFilters: (filters) => set({ filters }),
  setResults: (results) => set({ results }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))

export const useTradesStore = create<TradesState>((set, get) => ({
  trades: [],
  openTrades: [],
  closedTrades: [],
  loading: false,
  error: null,
  setTrades: (trades) => {
    const openTrades = trades.filter(trade => trade.status === 'OPEN')
    const closedTrades = trades.filter(trade => trade.status === 'CLOSED')
    set({ trades, openTrades, closedTrades })
  },
  addTrade: (trade) => {
    const trades = [...get().trades, trade]
    const openTrades = trades.filter(t => t.status === 'OPEN')
    const closedTrades = trades.filter(t => t.status === 'CLOSED')
    set({ trades, openTrades, closedTrades })
  },
  updateTrade: (tradeId, updates) => {
    const trades = get().trades.map(trade => 
      trade.timestamp === tradeId ? { ...trade, ...updates } : trade
    )
    const openTrades = trades.filter(t => t.status === 'OPEN')
    const closedTrades = trades.filter(t => t.status === 'CLOSED')
    set({ trades, openTrades, closedTrades })
  },
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))
