import { z } from 'zod'

// Authentication schemas
export const LoginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

// Market data schemas
export const TickerSchema = z.object({
  ticker: z.string().min(1, 'Ticker is required').toUpperCase(),
})

export const MarketDataSchema = z.object({
  ticker: z.string(),
  price: z.number(),
  iv: z.number().optional(),
  ivr: z.number().optional(),
  ema10: z.number().optional(),
  rsi14: z.number().optional(),
  earningsDate: z.string().optional(),
  lastUpdated: z.string(),
})

// Scanner schemas
export const ScannerFiltersSchema = z.object({
  minDte: z.number().min(1).default(7),
  maxDte: z.number().min(1).default(10),
  minIvr: z.number().min(0).max(100).default(25),
  preferredIvr: z.number().min(0).max(100).default(35),
  targetDelta: z.number().min(0).max(1).default(0.16),
  deltaRange: z.number().min(0).max(1).default(0.05), // ±0.05 around target
  minCreditPercent: z.number().min(0).max(1).default(0.05), // 5%
  maxCreditPercent: z.number().min(0).max(1).default(0.07), // 7%
  spreadWidth: z.enum(['2.5', '5']).default('2.5'),
})

// Trade recommendation schemas
export const TradeRecommendationSchema = z.object({
  ticker: z.string(),
  side: z.enum(['call', 'put']),
  dte: z.number().min(1).max(45),
  targetDelta: z.number().min(0).max(1),
  width: z.number().min(1).max(10),
})

export const OptionChainSchema = z.object({
  ticker: z.string(),
  expiry: z.string(),
  calls: z.array(z.object({
    strike: z.number(),
    bid: z.number(),
    ask: z.number(),
    delta: z.number(),
    gamma: z.number(),
    theta: z.number(),
    vega: z.number(),
    iv: z.number(),
    volume: z.number(),
    openInterest: z.number(),
  })),
  puts: z.array(z.object({
    strike: z.number(),
    bid: z.number(),
    ask: z.number(),
    delta: z.number(),
    gamma: z.number(),
    theta: z.number(),
    vega: z.number(),
    iv: z.number(),
    volume: z.number(),
    openInterest: z.number(),
  })),
})

// Trade logging schemas
export const TradeLogSchema = z.object({
  timestamp: z.string(),
  ticker: z.string(),
  side: z.enum(['call', 'put']),
  strategy: z.string(),
  dte: z.number(),
  shortStrike: z.number(),
  longStrike: z.number(),
  width: z.number(),
  credit: z.number(),
  ocoTp: z.number(),
  ocoSl: z.number(),
  deltaShort: z.number(),
  provider: z.string(),
  notes: z.string().optional(),
  status: z.enum(['OPEN', 'CLOSED']),
  openedAt: z.string(),
  closedAt: z.string().optional(),
  exitPrice: z.number().optional(),
  pnl: z.number().optional(),
  fees: z.number().optional(),
  account: z.string(),
  feesEntry: z.number(),
  feesExit: z.number(),
  feesRoundTrip: z.number(),
})

export const CloseTradeSchema = z.object({
  tradeId: z.string(),
  exitPrice: z.number(),
  notes: z.string().optional(),
})

// OCO calculation schemas
export const OCOCalculationSchema = z.object({
  credit: z.number(),
  takeProfitPercent: z.number().min(0).max(1).default(0.5), // 50%
  stopLossMultiplier: z.number().min(1).default(2), // 2x credit
  timeStopDays: z.number().min(1).default(2), // T-2
})

// Fee calculation schemas
export const FeeCalculationSchema = z.object({
  ticker: z.string(),
  side: z.enum(['call', 'put']),
  quantity: z.number().min(1),
  isIndex: z.boolean().default(false),
  isFutures: z.boolean().default(false),
})

export type LoginInput = z.infer<typeof LoginSchema>
export type TickerInput = z.infer<typeof TickerSchema>
export type MarketData = z.infer<typeof MarketDataSchema>
export type ScannerFilters = z.infer<typeof ScannerFiltersSchema>
export type TradeRecommendation = z.infer<typeof TradeRecommendationSchema>
export type OptionChain = z.infer<typeof OptionChainSchema>
export type TradeLog = z.infer<typeof TradeLogSchema>
export type CloseTradeInput = z.infer<typeof CloseTradeSchema>
export type OCOCalculation = z.infer<typeof OCOCalculationSchema>
export type FeeCalculation = z.infer<typeof FeeCalculationSchema>
