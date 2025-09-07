import { NextRequest, NextResponse } from 'next/server'
import { getMarketDataClient } from '@/lib/data'
import { TickerSchema } from '@/lib/schema'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const marketDataClient = getMarketDataClient()
    
    if (Array.isArray(body)) {
      // Bulk market data request
      const tickers = body.map(item => TickerSchema.parse(item).ticker)
      const marketData = await marketDataClient.getBulkMarketData(tickers)
      
      return NextResponse.json({ data: marketData })
    } else {
      // Single ticker request
      const { ticker } = TickerSchema.parse(body)
      const marketData = await marketDataClient.getMarketData(ticker)
      
      return NextResponse.json({ data: marketData })
    }
  } catch (error) {
    console.error('Market data error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch market data' },
      { status: 500 }
    )
  }
}
