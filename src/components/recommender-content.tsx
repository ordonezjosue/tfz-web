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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Trade Recommender
              </h1>
              <p className="text-sm text-gray-500">
                Get personalized options recommendations
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle>Trade Parameters</CardTitle>
              <CardDescription>
                Specify your trade requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ticker">Ticker Symbol</Label>
                  <Input
                    id="ticker"
                    value={formData.ticker}
                    onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                    placeholder="AAPL"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="side">Spread Side</Label>
                  <select
                    id="side"
                    className="w-full p-2 border rounded-md"
                    value={formData.side}
                    onChange={(e) => setFormData({ ...formData, side: e.target.value as 'call' | 'put' })}
                  >
                    <option value="call">Call Spread</option>
                    <option value="put">Put Spread</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dte">Days to Expiry</Label>
                  <Input
                    id="dte"
                    type="number"
                    min="1"
                    max="45"
                    value={formData.dte}
                    onChange={(e) => setFormData({ ...formData, dte: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetDelta">Target Delta</Label>
                  <Input
                    id="targetDelta"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={formData.targetDelta}
                    onChange={(e) => setFormData({ ...formData, targetDelta: Number(e.target.value) })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="width">Spread Width</Label>
                  <select
                    id="width"
                    className="w-full p-2 border rounded-md"
                    value={formData.width}
                    onChange={(e) => setFormData({ ...formData, width: Number(e.target.value) })}
                  >
                    <option value="2.5">$2.50</option>
                    <option value="5">$5.00</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Analyzing...' : 'Get Recommendation'}
                </Button>
              </form>

              {error && (
                <div className="mt-4 text-red-600 text-sm">
                  {error}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recommendation Results */}
          <Card>
            <CardHeader>
              <CardTitle>Recommendation</CardTitle>
              <CardDescription>
                {recommendation ? 'Trade analysis and metrics' : 'Enter parameters to get a recommendation'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recommendation ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Short Strike</div>
                      <div className="font-medium">${recommendation.shortStrike.strike}</div>
                      <div className="text-sm text-gray-500">
                        Delta: {recommendation.shortStrike.delta.toFixed(3)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Long Strike</div>
                      <div className="font-medium">${recommendation.longStrike.strike}</div>
                      <div className="text-sm text-gray-500">
                        Delta: {recommendation.longStrike.delta.toFixed(3)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Net Credit</div>
                      <div className="font-medium text-green-600">
                        {formatCurrency(recommendation.netCredit)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Credit %</div>
                      <div className="font-medium">
                        {formatPercent(recommendation.creditPercent / 100, 1)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-500">Max Risk</div>
                      <div className="font-medium text-red-600">
                        {formatCurrency(recommendation.maxRisk)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Max Profit</div>
                      <div className="font-medium text-green-600">
                        {formatCurrency(recommendation.maxProfit)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Breakeven</div>
                    <div className="font-medium">${recommendation.breakeven.toFixed(2)}</div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">OCO Levels</div>
                    <div className="text-sm">
                      <div>Take Profit: {formatCurrency(recommendation.ocoLevels.takeProfit)}</div>
                      <div>Stop Loss: {formatCurrency(recommendation.ocoLevels.stopLoss)}</div>
                      <div>Time Stop: {recommendation.ocoLevels.timeStop}</div>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm text-gray-500">Fees</div>
                    <div className="text-sm">
                      <div>Entry: {formatCurrency(recommendation.fees.entry)}</div>
                      <div>Exit: {formatCurrency(recommendation.fees.exit)}</div>
                      <div>Round Trip: {formatCurrency(recommendation.fees.roundTrip)}</div>
                    </div>
                  </div>

                  <Button
                    onClick={handleLogTrade}
                    className="w-full"
                  >
                    Log This Trade
                  </Button>
                </div>
              ) : (
                  <div className="text-center py-8 text-gray-500">
                    Enter your trade parameters and click &quot;Get Recommendation&quot; to see analysis.
                  </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
