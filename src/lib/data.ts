import { MarketData } from './schema'

const POLYGON_BASE_URL = 'https://api.polygon.io'

export class MarketDataClient {
  private apiKey: string

  constructor() {
    this.apiKey = process.env.POLYGON_API_KEY || ''
    if (!this.apiKey) {
      throw new Error('POLYGON_API_KEY is required')
    }
  }

  async getStockQuote(ticker: string): Promise<number> {
    const response = await fetch(
      `${POLYGON_BASE_URL}/v2/last/trade/${ticker}?apikey=${this.apiKey}`
    )
    
    if (!response.ok) {
      throw new Error(`Failed to fetch quote for ${ticker}`)
    }
    
      const responseData = await response.json()
      return responseData.results?.p || 0
  }

  async getMarketData(ticker: string): Promise<MarketData> {
    try {
      const [quote, optionsData, earningsData] = await Promise.all([
        this.getStockQuote(ticker),
        this.getOptionsData(ticker),
        this.getEarningsData(ticker),
      ])

      return {
        ticker,
        price: quote,
        iv: optionsData.iv,
        ivr: optionsData.ivr,
        ema10: optionsData.ema10,
        rsi14: optionsData.rsi14,
        earningsDate: earningsData.date,
        lastUpdated: new Date().toISOString(),
      }
    } catch (error) {
      console.error(`Error fetching market data for ${ticker}:`, error)
      throw error
    }
  }

  private async getOptionsData(ticker: string): Promise<{
    iv?: number
    ivr?: number
    ema10?: number
    rsi14?: number
  }> {
    try {
      // For now, return mock data since Polygon's options data requires premium
      // In production, you'd want to integrate with a proper options data provider
      return {
        iv: Math.random() * 0.5 + 0.2, // Mock IV between 20-70%
        ivr: Math.random() * 100, // Mock IVR between 0-100%
        ema10: 0, // Would need technical analysis library
        rsi14: Math.random() * 100, // Mock RSI between 0-100
      }
    } catch (error) {
      console.error(`Error fetching options data for ${ticker}:`, error)
      return {}
    }
  }

  private async getEarningsData(ticker: string): Promise<{ date?: string }> {
    try {
      const response = await fetch(
        `${POLYGON_BASE_URL}/v3/reference/dividends?ticker=${ticker}&apikey=${this.apiKey}`
      )
      
      if (!response.ok) {
        return {}
      }
      
      // This is a simplified approach - you'd want to use a proper earnings calendar API
      return {}
    } catch (error) {
      console.error(`Error fetching earnings data for ${ticker}:`, error)
      return {}
    }
  }

  async getBulkMarketData(tickers: string[]): Promise<MarketData[]> {
    const promises = tickers.map(ticker => 
      this.getMarketData(ticker).catch(error => {
        console.error(`Failed to fetch data for ${ticker}:`, error)
        return {
          ticker,
          price: 0,
          lastUpdated: new Date().toISOString(),
        } as MarketData
      })
    )

    return Promise.all(promises)
  }
}

// Export a function to get the client instead of instantiating at module level
export function getMarketDataClient(): MarketDataClient {
  return new MarketDataClient()
}
