'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useScannerStore } from '@/lib/store'
import { ScannerFilters } from '@/lib/schema'
import { formatPercent } from '@/lib/utils'

export function ScannerContent() {
  const router = useRouter()
  const { filters, setFilters, results, setResults, loading, setLoading, error, setError } = useScannerStore()
  const [tickerInput, setTickerInput] = useState('')
  const [, setCsvFile] = useState<File | null>(null)

  const handleTickerSubmit = async () => {
    if (!tickerInput.trim()) return

    const tickers = tickerInput.split(',').map(t => t.trim().toUpperCase()).filter(Boolean)
    await scanTickers(tickers)
  }

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setCsvFile(file)
    
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      
      const tickerIndex = headers.findIndex(h => h === 'ticker' || h === 'symbol')
      if (tickerIndex === -1) {
        setError('CSV must have a "ticker" or "symbol" column')
        return
      }

      const tickers = lines.slice(1).map(line => {
        const values = line.split(',')
        return values[tickerIndex]?.trim().toUpperCase()
      }).filter(Boolean)

      await scanTickers(tickers)
    } catch {
      setError('Failed to parse CSV file')
    }
  }

  const scanTickers = async (tickers: string[]) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tickers),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch market data')
      }

      const data = await response.json()
      
      // Apply scanner filters
      const filteredResults = data.data.filter((marketData: { price: number; ivr?: number }) => {
        // Basic filtering logic - you'd implement the full scanner engine here
        return marketData.price > 0 && 
               (marketData.ivr === undefined || marketData.ivr >= filters.minIvr)
      })

      setResults(filteredResults)
    } catch {
      setError('Failed to scan tickers')
    } finally {
      setLoading(false)
    }
  }

  const updateFilter = (key: keyof ScannerFilters, value: unknown) => {
    setFilters({ ...filters, [key]: value })
  }

  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="glass-card border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                Options Scanner
              </h1>
              <p className="text-neutral-text mt-1">
                Find high-probability options trades with advanced filtering
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400 primary-glow"
            >
              ← Back to Dashboard
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Scanner Controls */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="trading-card">
              <CardHeader className="border-b border-blue-500/20">
                <CardTitle className="text-xl font-semibold text-blue-400">Scanner Filters</CardTitle>
                <CardDescription className="text-neutral-text">
                  Configure your screening criteria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-3">
                  <Label htmlFor="minIvr" className="text-sm font-medium text-blue-300">Min IVR (%)</Label>
                  <Input
                    id="minIvr"
                    type="number"
                    value={filters.minIvr}
                    onChange={(e) => updateFilter('minIvr', Number(e.target.value))}
                    className="bg-slate-800/50 border-slate-600 text-white focus:border-blue-400 focus:ring-blue-400/20"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="preferredIvr" className="text-sm font-medium text-blue-300">Preferred IVR (%)</Label>
                  <Input
                    id="preferredIvr"
                    type="number"
                    value={filters.preferredIvr}
                    onChange={(e) => updateFilter('preferredIvr', Number(e.target.value))}
                    className="bg-slate-800/50 border-slate-600 text-white focus:border-blue-400 focus:ring-blue-400/20"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="targetDelta" className="text-sm font-medium text-blue-300">Target Delta</Label>
                  <Input
                    id="targetDelta"
                    type="number"
                    step="0.01"
                    value={filters.targetDelta}
                    onChange={(e) => updateFilter('targetDelta', Number(e.target.value))}
                    className="bg-slate-800/50 border-slate-600 text-white focus:border-blue-400 focus:ring-blue-400/20"
                  />
                </div>

                <div className="space-y-3">
                  <Label htmlFor="spreadWidth" className="text-sm font-medium text-blue-300">Spread Width</Label>
                  <select
                    id="spreadWidth"
                    className="w-full p-3 bg-slate-800/50 border border-slate-600 rounded-lg text-white focus:border-blue-400 focus:ring-blue-400/20"
                    value={filters.spreadWidth}
                    onChange={(e) => updateFilter('spreadWidth', e.target.value)}
                  >
                    <option value="2.5">$2.50</option>
                    <option value="5">$5.00</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card className="trading-card">
              <CardHeader className="border-b border-blue-500/20">
                <CardTitle className="text-xl font-semibold text-blue-400">Input Tickers</CardTitle>
                <CardDescription className="text-neutral-text">
                  Enter tickers to scan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-3">
                  <Label htmlFor="tickers" className="text-sm font-medium text-blue-300">Comma-separated tickers</Label>
                  <Input
                    id="tickers"
                    placeholder="AAPL, MSFT, GOOGL"
                    value={tickerInput}
                    onChange={(e) => setTickerInput(e.target.value)}
                    className="bg-slate-800/50 border-slate-600 text-white focus:border-blue-400 focus:ring-blue-400/20"
                  />
                </div>

                <Button
                  onClick={handleTickerSubmit}
                  disabled={loading || !tickerInput.trim()}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-3 rounded-lg primary-glow transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Scanning...
                    </div>
                  ) : (
                    '🔍 Scan Tickers'
                  )}
                </Button>

                <div className="relative">
                  <Label htmlFor="csv-upload" className="text-sm font-medium text-blue-300">Or upload CSV file</Label>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="mt-3 bg-slate-800/50 border-slate-600 text-white focus:border-blue-400 focus:ring-blue-400/20"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            <Card className="trading-card">
              <CardHeader className="border-b border-blue-500/20">
                <CardTitle className="text-xl font-semibold text-blue-400">Scan Results</CardTitle>
                <CardDescription className="text-neutral-text">
                  {results.length} tickers found
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-lg mb-6">
                    <div className="flex items-center">
                      <div className="text-red-400 mr-2">⚠️</div>
                      {error}
                    </div>
                  </div>
                )}

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
                    <p className="mt-4 text-neutral-text text-lg">Scanning tickers...</p>
                    <p className="text-sm text-neutral-text mt-2">This may take a few moments</p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔍</div>
                    <p className="text-neutral-text text-lg mb-2">No results found</p>
                    <p className="text-sm text-neutral-text">Try adjusting your filters or scanning more tickers</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {results.map((result, index) => {
                      const typedResult = result as { ticker: string; price?: number; ivr?: number; rsi14?: number }
                      return (
                      <div key={index} className="glass-card p-6 rounded-xl border border-blue-500/20 hover:border-blue-400/40 transition-all duration-200">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <div className="font-bold text-2xl text-white mb-2">{typedResult.ticker}</div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="text-neutral-text">Price</div>
                                <div className="font-semibold text-white">${typedResult.price?.toFixed(2) || 'N/A'}</div>
                              </div>
                              <div>
                                <div className="text-neutral-text">IVR</div>
                                <div className="font-semibold text-blue-400">
                                  {typedResult.ivr ? formatPercent(typedResult.ivr / 100, 1) : 'N/A'}
                                </div>
                              </div>
                              <div>
                                <div className="text-neutral-text">RSI(14)</div>
                                <div className="font-semibold text-white">{typedResult.rsi14?.toFixed(1) || 'N/A'}</div>
                              </div>
                            </div>
                          </div>
                          <div className="ml-6">
                            <Button
                              onClick={() => router.push(`/recommend?ticker=${typedResult.ticker}`)}
                              className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-6 py-3 rounded-lg success-glow transition-all duration-200"
                            >
                              📊 Analyze
                            </Button>
                          </div>
                        </div>
                      </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
