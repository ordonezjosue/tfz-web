'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TradeRecommendationSchema } from '@/lib/schema'
import { formatCurrency, formatPercent } from '@/lib/utils'

interface OptionStrike {
  strike: number
  bid: number
  ask: number
  delta: number
  gamma: number
  theta: number
  vega: number
  iv: number
  volume: number
  openInterest: number
}

interface RecommendationResult {
  ticker: string
  side: 'call' | 'put'
  shortStrike: OptionStrike
  longStrike: OptionStrike
  credit: number
  debit: number
  netCredit: number
  maxRisk: number
  maxProfit: number
  creditPercent: number
  riskRewardRatio: number
  breakeven: number
  fees: {
    entry: number
    exit: number
    roundTrip: number
  }
  ocoLevels: {
    takeProfit: number
    stopLoss: number
    timeStop: string
  }
}

export function RecommenderContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    ticker: searchParams.get('ticker') || '',
    side: 'call' as 'call' | 'put',
    dte: 8,
    targetDelta: 0.16,
    width: 2.5,
  })
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Validate form data
      const validatedData = TradeRecommendationSchema.parse(formData)

      // Get option chain
      const chainResponse = await fetch('/api/chains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: validatedData.ticker,
          expiry: getExpiryDate(validatedData.dte),
        }),
      })

      if (!chainResponse.ok) {
        throw new Error('Failed to fetch option chain')
      }

      const chainData = await chainResponse.json()
      const optionChain = chainData.data

      // Find best strikes based on target delta
      const options = validatedData.side === 'call' ? optionChain.calls : optionChain.puts
      const sortedOptions = options.sort((a: OptionStrike, b: OptionStrike) => 
        Math.abs(a.delta - validatedData.targetDelta) - Math.abs(b.delta - validatedData.targetDelta)
      )

      if (sortedOptions.length < 2) {
        throw new Error('Not enough options available')
      }

      const shortStrike = sortedOptions[0]
      const longStrike = sortedOptions.find((opt: OptionStrike) => 
        Math.abs(opt.strike - shortStrike.strike) === validatedData.width
      )

      if (!longStrike) {
        throw new Error('Could not find matching long strike')
      }

      // Calculate metrics
      const credit = (shortStrike.bid + shortStrike.ask) / 2
      const debit = (longStrike.bid + longStrike.ask) / 2
      const netCredit = credit - debit
      const maxRisk = validatedData.width - netCredit
      const maxProfit = netCredit
      const creditPercent = (netCredit / validatedData.width) * 100
      const riskRewardRatio = maxProfit / maxRisk
      const breakeven = validatedData.side === 'call' 
        ? shortStrike.strike + netCredit 
        : shortStrike.strike - netCredit

      // Calculate fees
      const feesResponse = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: validatedData.ticker,
          side: validatedData.side,
          quantity: 1,
        }),
      })

      const feesData = await feesResponse.json()
      const fees = feesData.data

      // Calculate OCO levels
      const ocoResponse = await fetch('/api/oco', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credit: netCredit,
        }),
      })

      const ocoData = await ocoResponse.json()
      const ocoLevels = ocoData.data

      setRecommendation({
        ticker: validatedData.ticker,
        side: validatedData.side,
        shortStrike,
        longStrike,
        credit,
        debit,
        netCredit,
        maxRisk,
        maxProfit,
        creditPercent,
        riskRewardRatio,
        breakeven,
        fees: fees.roundTrip,
        ocoLevels,
      })
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to generate recommendation')
    } finally {
      setLoading(false)
    }
  }

  const getExpiryDate = (dte: number): string => {
    const date = new Date()
    date.setDate(date.getDate() + dte)
    return date.toISOString().split('T')[0]
  }

  const handleLogTrade = async () => {
    if (!recommendation) return

    try {
      const tradeLog = {
        timestamp: new Date().toISOString(),
        ticker: recommendation.ticker,
        side: recommendation.side,
        strategy: `${recommendation.side} spread`,
        dte: formData.dte,
        shortStrike: recommendation.shortStrike.strike,
        longStrike: recommendation.longStrike.strike,
        width: formData.width,
        credit: recommendation.netCredit,
        ocoTp: recommendation.ocoLevels.takeProfit,
        ocoSl: recommendation.ocoLevels.stopLoss,
        deltaShort: recommendation.shortStrike.delta,
        provider: 'Tastytrade',
        status: 'OPEN' as const,
        openedAt: new Date().toISOString(),
        account: 'Main',
        feesEntry: recommendation.fees.entry,
        feesExit: recommendation.fees.exit,
        feesRoundTrip: recommendation.fees.roundTrip,
      }

      const response = await fetch('/api/trades/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tradeLog),
      })

      if (response.ok) {
        alert('Trade logged successfully!')
        router.push('/dashboard')
      } else {
        throw new Error('Failed to log trade')
      }
    } catch {
      setError('Failed to log trade')
    }
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="glass-card border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                Trade Recommender
              </h1>
              <p className="text-neutral-text mt-1">
                Get personalized options recommendations with advanced analytics
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-400 success-glow"
            >
              ← Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <Card className="trading-card">
            <CardHeader className="border-b border-green-500/20">
              <CardTitle className="text-xl font-semibold text-green-400">Trade Parameters</CardTitle>
              <CardDescription className="text-neutral-text">
                Specify your trade requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="ticker" className="text-sm font-medium text-green-300">Ticker Symbol</Label>
                  <Input
                    id="ticker"
                    value={formData.ticker}
                    onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                    placeholder="AAPL"
                    required
                    className="bg-slate-800/50 border-slate-600 text-white focus:border-green-400 focus:ring-green-400/20"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="side" className="text-sm font-medium text-green-300">Spread Side</Label>
                  <select
                    id="side"
                    className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:border-green-400 focus:ring-green-400/20"
                    value={formData.side}
                    onChange={(e) => setFormData({ ...formData, side: e.target.value as 'call' | 'put' })}
                  >
                    <option value="call">📈 Call Spread</option>
                    <option value="put">📉 Put Spread</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="dte" className="text-sm font-medium text-green-300">Days to Expiry</Label>
                  <Input
                    id="dte"
                    type="number"
                    min="1"
                    max="45"
                    value={formData.dte}
                    onChange={(e) => setFormData({ ...formData, dte: Number(e.target.value) })}
                    required
                    className="bg-slate-800/50 border-slate-600 text-white focus:border-green-400 focus:ring-green-400/20"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="targetDelta" className="text-sm font-medium text-green-300">Target Delta</Label>
                  <Input
                    id="targetDelta"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={formData.targetDelta}
                    onChange={(e) => setFormData({ ...formData, targetDelta: Number(e.target.value) })}
                    required
                    className="bg-slate-800/50 border-slate-600 text-white focus:border-green-400 focus:ring-green-400/20"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="width" className="text-sm font-medium text-green-300">Spread Width</Label>
                  <select
                    id="width"
                    className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:border-green-400 focus:ring-green-400/20"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: Number(e.target.value) })}
                  >
                    <option value="2.5">$2.50</option>
                    <option value="5">$5.00</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold py-3 rounded-lg success-glow transition-all duration-200"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Analyzing...
                    </div>
                  ) : (
                    '🎯 Get Recommendation'
                  )}
                </Button>
              </form>

              {error && (
                <div className="mt-6 bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg">
                  <div className="flex items-center">
                    <div className="text-red-400 mr-2">⚠️</div>
                    {error}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendation Results */}
          <Card className="trading-card">
            <CardHeader className="border-b border-green-500/20">
              <CardTitle className="text-xl font-semibold text-green-400">Recommendation</CardTitle>
              <CardDescription className="text-neutral-text">
                {recommendation ? 'Trade analysis and metrics' : 'Enter parameters to get a recommendation'}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {recommendation ? (
                <div className="space-y-6">
                  {/* Strike Information */}
                  <div className="glass-card p-6 rounded-xl border border-green-500/20">
                    <h3 className="text-lg font-semibold text-green-400 mb-4">Strike Details</h3>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <div className="text-sm text-neutral-text mb-1">Short Strike</div>
                        <div className="text-2xl font-bold text-white">${recommendation.shortStrike.strike}</div>
                        <div className="text-sm text-neutral-text">
                          Delta: {recommendation.shortStrike.delta.toFixed(3)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-neutral-text mb-1">Long Strike</div>
                        <div className="text-2xl font-bold text-white">${recommendation.longStrike.strike}</div>
                        <div className="text-sm text-neutral-text">
                          Delta: {recommendation.longStrike.delta.toFixed(3)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Financial Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card p-4 rounded-lg border border-green-500/20 text-center">
                      <div className="text-sm text-neutral-text mb-1">Net Credit</div>
                      <div className="text-xl font-bold profit-text">
                        {formatCurrency(recommendation.netCredit)}
                      </div>
                    </div>
                    <div className="glass-card p-4 rounded-lg border border-blue-500/20 text-center">
                      <div className="text-sm text-neutral-text mb-1">Credit %</div>
                      <div className="text-xl font-bold text-blue-400">
                        {formatPercent(recommendation.creditPercent / 100, 1)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card p-4 rounded-lg border border-red-500/20 text-center">
                      <div className="text-sm text-neutral-text mb-1">Max Risk</div>
                      <div className="text-xl font-bold loss-text">
                        {formatCurrency(recommendation.maxRisk)}
                      </div>
                    </div>
                    <div className="glass-card p-4 rounded-lg border border-green-500/20 text-center">
                      <div className="text-sm text-neutral-text mb-1">Max Profit</div>
                      <div className="text-xl font-bold profit-text">
                        {formatCurrency(recommendation.maxProfit)}
                      </div>
                    </div>
                  </div>

                  {/* Breakeven */}
                  <div className="glass-card p-4 rounded-lg border border-yellow-500/20 text-center">
                    <div className="text-sm text-neutral-text mb-1">Breakeven</div>
                    <div className="text-xl font-bold text-yellow-400">${recommendation.breakeven.toFixed(2)}</div>
                  </div>

                  {/* OCO Levels */}
                  <div className="glass-card p-6 rounded-xl border border-blue-500/20">
                    <h3 className="text-lg font-semibold text-blue-400 mb-4">OCO Levels</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-sm text-neutral-text mb-1">Take Profit</div>
                        <div className="font-semibold profit-text">{formatCurrency(recommendation.ocoLevels.takeProfit)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-neutral-text mb-1">Stop Loss</div>
                        <div className="font-semibold loss-text">{formatCurrency(recommendation.ocoLevels.stopLoss)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-neutral-text mb-1">Time Stop</div>
                        <div className="font-semibold text-yellow-400">{recommendation.ocoLevels.timeStop}</div>
                      </div>
                    </div>
                  </div>

                  {/* Fees */}
                  <div className="glass-card p-4 rounded-lg border border-slate-500/20">
                    <h3 className="text-lg font-semibold text-slate-400 mb-3">Fees</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-sm text-neutral-text mb-1">Entry</div>
                        <div className="font-semibold text-white">{formatCurrency(recommendation.fees.entry)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-neutral-text mb-1">Exit</div>
                        <div className="font-semibold text-white">{formatCurrency(recommendation.fees.exit)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-neutral-text mb-1">Round Trip</div>
                        <div className="font-semibold text-white">{formatCurrency(recommendation.fees.roundTrip)}</div>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleLogTrade}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 rounded-lg primary-glow transition-all duration-200"
                  >
                    📝 Log This Trade
                  </Button>
                </div>
              ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎯</div>
                    <p className="text-neutral-text text-lg mb-2">Ready to analyze your trade</p>
                    <p className="text-sm text-neutral-text">Enter your trade parameters and click &quot;Get Recommendation&quot; to see detailed analysis</p>
                  </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
