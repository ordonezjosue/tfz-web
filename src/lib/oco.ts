import { OCOCalculation } from './schema'

export interface OCOLevels {
  takeProfit: number
  stopLoss: number
  timeStop: string
}

export function calculateOCOLevels(
  credit: number,
  config: Partial<OCOCalculation> = {}
): OCOLevels {
  const {
    takeProfitPercent = 0.5, // 50% of credit
    stopLossMultiplier = 2, // 2x credit
    timeStopDays = 2, // T-2
  } = config

  const takeProfit = credit * takeProfitPercent
  const stopLoss = credit * stopLossMultiplier
  
  // Calculate time stop date (T-2)
  const timeStopDate = new Date()
  timeStopDate.setDate(timeStopDate.getDate() + timeStopDays)

  return {
    takeProfit,
    stopLoss,
    timeStop: timeStopDate.toISOString().split('T')[0],
  }
}

export function calculateSpreadMetrics(
  shortStrike: number,
  longStrike: number,
  credit: number,
  width: number
): {
  creditPercent: number
  maxRisk: number
  riskRewardRatio: number
  breakeven: number
} {
  const creditPercent = (credit / width) * 100
  const maxRisk = width - credit
  const riskRewardRatio = credit / maxRisk
  const breakeven = shortStrike + credit // For call spreads

  return {
    creditPercent,
    maxRisk,
    riskRewardRatio,
    breakeven,
  }
}

export function validateTradeRules(
  ticker: string,
  marketData: {
    price: number
    ivr?: number
    ema10?: number
    rsi14?: number
    earningsDate?: string
  },
  tradeData: {
    dte: number
    delta: number
    credit: number
    width: number
    side: 'call' | 'put'
  }
): {
  passes: boolean
  reasons: string[]
  score: number
} {
  const reasons: string[] = []
  let score = 0

  // DTE check (7-10 days)
  if (tradeData.dte >= 7 && tradeData.dte <= 10) {
    score += 20
  } else {
    reasons.push(`DTE ${tradeData.dte} outside preferred range (7-10)`)
  }

  // IVR check (≥25, prefer ≥35)
  if (marketData.ivr && marketData.ivr >= 35) {
    score += 25
  } else if (marketData.ivr && marketData.ivr >= 25) {
    score += 15
    reasons.push(`IVR ${marketData.ivr}% is acceptable but not optimal (prefer ≥35%)`)
  } else if (marketData.ivr) {
    reasons.push(`IVR ${marketData.ivr}% too low (need ≥25%)`)
  }

  // Delta check (0.15-0.20)
  if (tradeData.delta >= 0.15 && tradeData.delta <= 0.20) {
    score += 20
  } else {
    reasons.push(`Delta ${tradeData.delta} outside target range (0.15-0.20)`)
  }

  // Credit check (5-7% of width)
  const creditPercent = (tradeData.credit / tradeData.width) * 100
  if (creditPercent >= 5 && creditPercent <= 7) {
    score += 20
  } else {
    reasons.push(`Credit ${creditPercent.toFixed(1)}% outside preferred range (5-7%)`)
  }

  // Trend filter for call spreads
  if (tradeData.side === 'call') {
    if (marketData.ema10 && marketData.price < marketData.ema10) {
      score += 10
    } else if (marketData.rsi14 && marketData.rsi14 > 65) {
      score += 5
      reasons.push('Price above 10-EMA, RSI > 65 - consider put spreads instead')
    } else {
      reasons.push('Call spread not ideal - price above 10-EMA and RSI not overbought')
    }
  }

  // Earnings check
  if (marketData.earningsDate) {
    const earningsDate = new Date(marketData.earningsDate)
    const today = new Date()
    const daysToEarnings = Math.ceil((earningsDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysToEarnings >= 7 && daysToEarnings <= 14) {
      reasons.push(`Earnings in ${daysToEarnings} days - avoid trade`)
      score -= 30
    }
  }

  const passes = score >= 60 && reasons.length <= 2

  return {
    passes,
    reasons,
    score,
  }
}
