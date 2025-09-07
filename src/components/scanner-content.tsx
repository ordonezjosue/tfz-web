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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Options Scanner
              </h1>
              <p className="text-sm text-gray-500">
                Find high-probability options trades
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scanner Controls */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Scanner Filters</CardTitle>
                <CardDescription>
                  Configure your screening criteria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="minIvr">Min IVR (%)</Label>
                  <Input
                    id="minIvr"
                    type="number"
                    value={filters.minIvr}
                    onChange={(e) => updateFilter('minIvr', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferredIvr">Preferred IVR (%)</Label>
                  <Input
                    id="preferredIvr"
                    type="number"
                    value={filters.preferredIvr}
                    onChange={(e) => updateFilter('preferredIvr', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetDelta">Target Delta</Label>
                  <Input
                    id="targetDelta"
                    type="number"
                    step="0.01"
                    value={filters.targetDelta}
                    onChange={(e) => updateFilter('targetDelta', Number(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spreadWidth">Spread Width</Label>
                  <select
                    id="spreadWidth"
                    className="w-full p-2 border rounded-md"
                    value={filters.spreadWidth}
                    onChange={(e) => updateFilter('spreadWidth', e.target.value)}
                  >
                    <option value="2.5">$2.50</option>
                    <option value="5">$5.00</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Input Tickers</CardTitle>
                <CardDescription>
                  Enter tickers to scan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tickers">Comma-separated tickers</Label>
                  <Input
                    id="tickers"
                    placeholder="AAPL, MSFT, GOOGL"
                    value={tickerInput}
                    onChange={(e) => setTickerInput(e.target.value)}
                  />
                </div>

                <Button
                  onClick={handleTickerSubmit}
                  disabled={loading || !tickerInput.trim()}
                  className="w-full"
                >
                  {loading ? 'Scanning...' : 'Scan Tickers'}
                </Button>

                <div className="relative">
                  <Label htmlFor="csv-upload">Or upload CSV file</Label>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleCsvUpload}
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Scan Results</CardTitle>
                <CardDescription>
                  {results.length} tickers found
                </CardDescription>
              </CardHeader>
              <CardContent>
                {error && (
                  <div className="text-red-600 text-sm mb-4">
                    {error}
                  </div>
                )}

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-500">Scanning tickers...</p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No results found. Try adjusting your filters or scanning more tickers.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {results.map((result, index) => {
                      const typedResult = result as { ticker: string; price?: number; ivr?: number; rsi14?: number }
                      return (
                      <div key={index} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-lg">{typedResult.ticker}</div>
                          <div className="text-sm text-gray-500">
                            Price: ${typedResult.price?.toFixed(2) || 'N/A'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm">
                            IVR: {typedResult.ivr ? formatPercent(typedResult.ivr / 100, 1) : 'N/A'}
                          </div>
                          <div className="text-sm text-gray-500">
                            RSI: {typedResult.rsi14?.toFixed(1) || 'N/A'}
                          </div>
                        </div>
                        <div className="ml-4">
                          <Button
                            size="sm"
                            onClick={() => router.push(`/recommend?ticker=${typedResult.ticker}`)}
                          >
                            Analyze
                          </Button>
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
