import { MarketData, ScannerFilters } from './schema'
import { isWithinEarningsWindow } from './utils'

export interface ScannerResult {
  ticker: string
  marketData: MarketData
  passes: boolean
  score: number
  reasons: string[]
  recommendations: string[]
}

export class ScannerEngine {
  private filters: ScannerFilters

  constructor(filters: ScannerFilters) {
    this.filters = filters
  }

  async scanTickers(tickers: string[], marketDataMap: Map<string, MarketData>): Promise<ScannerResult[]> {
    const results: ScannerResult[] = []

    for (const ticker of tickers) {
      const marketData = marketDataMap.get(ticker)
      if (!marketData) {
        results.push({
          ticker,
          marketData: { ticker, price: 0, lastUpdated: new Date().toISOString() },
          passes: false,
          score: 0,
          reasons: ['No market data available'],
          recommendations: [],
        })
        continue
      }

      const result = this.evaluateTicker(ticker, marketData)
      results.push(result)
    }

    return results.sort((a, b) => b.score - a.score)
  }

  private evaluateTicker(ticker: string, marketData: MarketData): ScannerResult {
    const reasons: string[] = []
    const recommendations: string[] = []
    let score = 0

    // Price check
    if (marketData.price <= 0) {
      reasons.push('Invalid or missing price data')
      return { ticker, marketData, passes: false, score: 0, reasons, recommendations }
    }

    // IVR check
    if (marketData.ivr !== undefined) {
      if (marketData.ivr >= this.filters.preferredIvr) {
        score += 30
      } else if (marketData.ivr >= this.filters.minIvr) {
        score += 20
        reasons.push(`IVR ${marketData.ivr.toFixed(1)}% acceptable but not optimal (prefer ≥${this.filters.preferredIvr}%)`)
      } else {
        reasons.push(`IVR ${marketData.ivr.toFixed(1)}% too low (need ≥${this.filters.minIvr}%)`)
      }
    } else {
      reasons.push('IVR data not available')
    }

    // Trend analysis
    if (marketData.ema10 !== undefined && marketData.rsi14 !== undefined) {
      const isBelowEMA = marketData.price < marketData.ema10
      const isOverbought = marketData.rsi14 > 65
      
      if (isBelowEMA) {
        score += 15
        recommendations.push('Consider call spreads - price below 10-EMA')
      } else if (isOverbought) {
        score += 10
        recommendations.push('Consider put spreads - RSI overbought')
      } else {
        reasons.push('Neutral trend - price above 10-EMA, RSI not overbought')
      }
    } else {
      reasons.push('Technical indicators not available')
    }

    // Earnings check
    if (marketData.earningsDate && isWithinEarningsWindow(ticker, marketData.earningsDate)) {
      reasons.push('Within earnings window - avoid trading')
      score -= 50
    }

    // Overall assessment
    const passes = score >= 40 && reasons.length <= 3

    if (passes) {
      recommendations.push(`Strong candidate for ${this.filters.spreadWidth}-wide spreads`)
      recommendations.push(`Target delta around ${this.filters.targetDelta}`)
      recommendations.push(`Look for ${this.filters.minCreditPercent * 100}-${this.filters.maxCreditPercent * 100}% credit`)
    }

    return {
      ticker,
      marketData,
      passes,
      score,
      reasons,
      recommendations,
    }
  }

  generateRecommendations(result: ScannerResult): string[] {
    const recommendations: string[] = []

    if (!result.passes) {
      recommendations.push('❌ Does not meet criteria')
      return recommendations
    }

    recommendations.push('✅ Meets basic criteria')

    if (result.marketData.ivr && result.marketData.ivr >= this.filters.preferredIvr) {
      recommendations.push('🔥 High IVR - excellent for premium selling')
    }

    if (result.marketData.price < (result.marketData.ema10 || 0)) {
      recommendations.push('📈 Price below 10-EMA - good for call spreads')
    }

    if (result.marketData.rsi14 && result.marketData.rsi14 > 65) {
      recommendations.push('📉 RSI overbought - good for put spreads')
    }

    recommendations.push(`🎯 Target ${this.filters.spreadWidth}-wide spreads`)
    recommendations.push(`💰 Look for ${this.filters.minCreditPercent * 100}-${this.filters.maxCreditPercent * 100}% credit`)

    return recommendations
  }
}

export function createDefaultFilters(): ScannerFilters {
  return {
    minDte: 7,
    maxDte: 10,
    minIvr: 25,
    preferredIvr: 35,
    targetDelta: 0.16,
    deltaRange: 0.05,
    minCreditPercent: 0.05,
    maxCreditPercent: 0.07,
    spreadWidth: '2.5',
  }
}

export function validateFilters(filters: ScannerFilters): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (filters.minDte < 1 || filters.minDte > 45) {
    errors.push('Min DTE must be between 1 and 45 days')
  }

  if (filters.maxDte < filters.minDte) {
    errors.push('Max DTE must be greater than min DTE')
  }

  if (filters.minIvr < 0 || filters.minIvr > 100) {
    errors.push('Min IVR must be between 0 and 100')
  }

  if (filters.preferredIvr < filters.minIvr) {
    errors.push('Preferred IVR must be greater than min IVR')
  }

  if (filters.targetDelta < 0 || filters.targetDelta > 1) {
    errors.push('Target delta must be between 0 and 1')
  }

  if (filters.minCreditPercent < 0 || filters.minCreditPercent > 1) {
    errors.push('Min credit percent must be between 0 and 1')
  }

  if (filters.maxCreditPercent < filters.minCreditPercent) {
    errors.push('Max credit percent must be greater than min credit percent')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
