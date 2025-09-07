'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore, useTradesStore } from '@/lib/store'
// import { TradeLog } from '@/lib/schema'
import { formatCurrency, formatPercent } from '@/lib/utils'

export function DashboardContent() {
  const { user, logout } = useAuthStore()
  const { openTrades, closedTrades, setTrades } = useTradesStore()
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        const response = await fetch('/api/trades/log')
        if (response.ok) {
          const data = await response.json()
          setTrades(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch trades:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTrades()
  }, [setTrades])

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  const calculateStats = () => {
    const totalTrades = closedTrades.length
    const winningTrades = closedTrades.filter(trade => (trade.pnl || 0) > 0).length
    const totalPnL = closedTrades.reduce((sum, trade) => sum + (trade.pnl || 0), 0)
    const totalFees = closedTrades.reduce((sum, trade) => sum + (trade.fees || 0), 0)
    const winRate = totalTrades > 0 ? winningTrades / totalTrades : 0

    return {
      totalTrades,
      winningTrades,
      totalPnL,
      totalFees,
      winRate,
    }
  }

  const stats = calculateStats()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                TFZ Trading Assistant
              </h1>
              <p className="text-sm text-gray-500">
                Welcome back, {user?.username}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/scanner')}
              >
                Scanner
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/recommend')}
              >
                Recommender
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Stats Cards */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Open Trades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openTrades.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total P&L
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(stats.totalPnL)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatPercent(stats.winRate)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Fees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(stats.totalFees)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Trades */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Open Trades</CardTitle>
              <CardDescription>
                Currently active positions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : openTrades.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No open trades
                </div>
              ) : (
                <div className="space-y-3">
                  {openTrades.slice(0, 5).map((trade, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{trade.ticker}</div>
                        <div className="text-sm text-gray-500">
                          {trade.side} spread • {trade.dte} DTE
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatCurrency(trade.credit)}</div>
                        <div className="text-sm text-gray-500">
                          {trade.shortStrike}/{trade.longStrike}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Closed Trades</CardTitle>
              <CardDescription>
                Last 5 completed positions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-4">Loading...</div>
              ) : closedTrades.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  No closed trades
                </div>
              ) : (
                <div className="space-y-3">
                  {closedTrades.slice(0, 5).map((trade, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{trade.ticker}</div>
                        <div className="text-sm text-gray-500">
                          {trade.side} spread • Closed {new Date(trade.closedAt || '').toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${(trade.pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(trade.pnl || 0)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(trade.credit)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
