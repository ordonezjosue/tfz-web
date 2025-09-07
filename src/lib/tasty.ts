import { OptionChain } from './schema'

const TASTY_BASE_URL = 'https://api.tastyworks.com'

export interface TastyCredentials {
  username: string
  password: string
  clientId: string
  clientSecret: string
}

export class TastyClient {
  private credentials: TastyCredentials
  private accessToken?: string
  private sessionToken?: string

  constructor() {
    this.credentials = {
      username: process.env.TASTY_USERNAME || '',
      password: process.env.TASTY_PASSWORD || '',
      clientId: process.env.TASTY_CLIENT_ID || '',
      clientSecret: process.env.TASTY_CLIENT_SECRET || '',
    }

    if (!this.credentials.username || !this.credentials.password || 
        !this.credentials.clientId || !this.credentials.clientSecret) {
      throw new Error('Tastytrade credentials are required')
    }
  }

  async authenticate(): Promise<void> {
    try {
      // Step 1: Get access token
      const tokenResponse = await fetch(`${TASTY_BASE_URL}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: this.credentials.clientId,
          client_secret: this.credentials.clientSecret,
        }),
      })

      if (!tokenResponse.ok) {
        throw new Error('Failed to get access token')
      }

      const tokenData = await tokenResponse.json()
      this.accessToken = tokenData.access_token

      // Step 2: Login with username/password
      const loginResponse = await fetch(`${TASTY_BASE_URL}/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          login: this.credentials.username,
          password: this.credentials.password,
        }),
      })

      if (!loginResponse.ok) {
        throw new Error('Failed to login to Tastytrade')
      }

      const loginData = await loginResponse.json()
      this.sessionToken = loginData.data.session_token
    } catch (error) {
      console.error('Tastytrade authentication failed:', error)
      throw error
    }
  }

  async getOptionChain(ticker: string, expiry: string): Promise<OptionChain> {
    if (!this.sessionToken) {
      await this.authenticate()
    }

    try {
      const response = await fetch(
        `${TASTY_BASE_URL}/option-chains/${ticker}/nested?expiration-date=${expiry}`,
        {
          headers: {
            'Authorization': `Bearer ${this.sessionToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch option chain for ${ticker}`)
      }

      const data = await response.json()
      return this.parseOptionChain(data, ticker, expiry)
    } catch (error) {
      console.error(`Error fetching option chain for ${ticker}:`, error)
      throw error
    }
  }

  private parseOptionChain(data: Record<string, unknown>, ticker: string, expiry: string): OptionChain {
    // Parse the Tastytrade API response into our schema
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dataItems = (data.data as any)?.items
    const firstItem = dataItems?.[0]
    
    const calls = firstItem?.call?.map((option: Record<string, unknown>) => ({
      strike: option.strike_price as number || 0,
      bid: option.bid_price as number || 0,
      ask: option.ask_price as number || 0,
      delta: option.delta as number || 0,
      gamma: option.gamma as number || 0,
      theta: option.theta as number || 0,
      vega: option.vega as number || 0,
      iv: option.volatility as number || 0,
      volume: option.volume as number || 0,
      openInterest: option.open_interest as number || 0,
    })) || []

    const puts = firstItem?.put?.map((option: Record<string, unknown>) => ({
      strike: option.strike_price as number || 0,
      bid: option.bid_price as number || 0,
      ask: option.ask_price as number || 0,
      delta: option.delta as number || 0,
      gamma: option.gamma as number || 0,
      theta: option.theta as number || 0,
      vega: option.vega as number || 0,
      iv: option.volatility as number || 0,
      volume: option.volume as number || 0,
      openInterest: option.open_interest as number || 0,
    })) || []

    return {
      ticker,
      expiry,
      calls,
      puts,
    }
  }

  async getExpirationDates(ticker: string): Promise<string[]> {
    if (!this.sessionToken) {
      await this.authenticate()
    }

    try {
      const response = await fetch(
        `${TASTY_BASE_URL}/option-chains/${ticker}/expiration-dates`,
        {
          headers: {
            'Authorization': `Bearer ${this.sessionToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch expiration dates for ${ticker}`)
      }

      const data = await response.json()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data.data as any)?.items?.map((item: Record<string, unknown>) => item.expiration_date) || []
    } catch (error) {
      console.error(`Error fetching expiration dates for ${ticker}:`, error)
      return []
    }
  }

  async placeOrder(orderData: Record<string, unknown>): Promise<Record<string, unknown>> {
    if (!this.sessionToken) {
      await this.authenticate()
    }

    try {
      const response = await fetch(`${TASTY_BASE_URL}/accounts/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.sessionToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })

      if (!response.ok) {
        throw new Error('Failed to place order')
      }

      return response.json()
    } catch (error) {
      console.error('Error placing order:', error)
      throw error
    }
  }
}

// Export a function to get the client instead of instantiating at module level
export function getTastyClient(): TastyClient {
  return new TastyClient()
}
