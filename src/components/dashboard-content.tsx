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
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="glass-card border-b border-blue-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-600 bg-clip-text text-transparent">
                TFZ Trading Assistant
              </h1>
              <p className="text-neutral-text mt-1">
                Welcome back, {user?.username} • Your options trading command center
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => router.push('/scanner')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-6 py-2 rounded-lg primary-glow transition-all duration-200"
              >
                🔍 Scanner
              </Button>
              <Button
                onClick={() => router.push('/recommend')}
                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold px-6 py-2 rounded-lg success-glow transition-all duration-200"
              >
                🎯 Recommender
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-400 danger-glow"
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
          <Card className="trading-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-blue-300 flex items-center">
                📊 Open Trades
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{openTrades.length}</div>
              <div className="text-xs text-neutral-text mt-1">Active positions</div>
            </CardContent>
          </Card>

          <Card className="trading-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-300 flex items-center">
                💰 Total P&L
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stats.totalPnL >= 0 ? 'profit-text' : 'loss-text'}`}>
                {formatCurrency(stats.totalPnL)}
              </div>
              <div className="text-xs text-neutral-text mt-1">All time</div>
            </CardContent>
          </Card>

          <Card className="trading-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-yellow-300 flex items-center">
                🎯 Win Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">{formatPercent(stats.winRate)}</div>
              <div className="text-xs text-neutral-text mt-1">{stats.winningTrades}/{stats.totalTrades} trades</div>
            </CardContent>
          </Card>

          <Card className="trading-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-300 flex items-center">
                💸 Total Fees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold loss-text">
                {formatCurrency(stats.totalFees)}
              </div>
              <div className="text-xs text-neutral-text mt-1">Commissions paid</div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Trades */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="trading-card">
            <CardHeader className="border-b border-blue-500/20">
              <CardTitle className="text-xl font-semibold text-blue-400">Open Trades</CardTitle>
              <CardDescription className="text-neutral-text">
                Currently active positions
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
                  <p className="mt-2 text-neutral-text">Loading trades...</p>
                </div>
              ) : openTrades.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📈</div>
                  <p className="text-neutral-text">No open trades</p>
                  <p className="text-sm text-neutral-text mt-1">Start by scanning for opportunities</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {openTrades.slice(0, 5).map((trade, index) => (
                    <div key={index} className="glass-card p-4 rounded-lg border border-blue-500/20 hover:border-blue-400/40 transition-all duration-200">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="font-bold text-lg text-white">{trade.ticker}</div>
                          <div className="text-sm text-neutral-text">
                            {trade.side} spread • {trade.dte} DTE
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-400">{formatCurrency(trade.credit)}</div>
                          <div className="text-sm text-neutral-text">
                            {trade.shortStrike}/{trade.longStrike}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="trading-card">
            <CardHeader className="border-b border-green-500/20">
              <CardTitle className="text-xl font-semibold text-green-400">Recent Closed Trades</CardTitle>
              <CardDescription className="text-neutral-text">
                Last 5 completed positions
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
                  <p className="mt-2 text-neutral-text">Loading trades...</p>
                </div>
              ) : closedTrades.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📊</div>
                  <p className="text-neutral-text">No closed trades</p>
                  <p className="text-sm text-neutral-text mt-1">Your trading history will appear here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {closedTrades.slice(0, 5).map((trade, index) => (
                    <div key={index} className="glass-card p-4 rounded-lg border border-green-500/20 hover:border-green-400/40 transition-all duration-200">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <div className="font-bold text-lg text-white">{trade.ticker}</div>
                          <div className="text-sm text-neutral-text">
                            {trade.side} spread • Closed {new Date(trade.closedAt || '').toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${(trade.pnl || 0) >= 0 ? 'profit-text' : 'loss-text'}`}>
                            {formatCurrency(trade.pnl || 0)}
                          </div>
                          <div className="text-sm text-neutral-text">
                            {formatCurrency(trade.credit)}
                          </div>
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
