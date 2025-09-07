import { google } from 'googleapis'
import { TradeLog } from './schema'

export class SheetsClient {
  private sheets!: ReturnType<typeof google.sheets>
  private spreadsheetId: string

  constructor() {
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID || ''
    
    if (!this.spreadsheetId) {
      throw new Error('GOOGLE_SHEET_ID is required')
    }

    this.initializeSheets()
  }

  private async initializeSheets() {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      })

      this.sheets = google.sheets({ version: 'v4', auth })
    } catch (error) {
      console.error('Failed to initialize Google Sheets client:', error)
      throw error
    }
  }

  async appendTrade(trade: TradeLog): Promise<void> {
    try {
      const values = [
        [
          trade.timestamp,
          trade.ticker,
          trade.side,
          trade.strategy,
          trade.dte,
          trade.shortStrike,
          trade.longStrike,
          trade.width,
          trade.credit,
          trade.ocoTp,
          trade.ocoSl,
          trade.deltaShort,
          trade.provider,
          trade.notes || '',
          trade.status,
          trade.openedAt,
          trade.closedAt || '',
          trade.exitPrice || '',
          trade.pnl || '',
          trade.fees || '',
          trade.account,
          trade.feesEntry,
          trade.feesExit,
          trade.feesRoundTrip,
        ],
      ]

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: 'Trades!A:X', // Adjust range based on your sheet structure
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values },
      })
    } catch (error) {
      console.error('Failed to append trade to sheet:', error)
      throw error
    }
  }

  async getTrades(): Promise<TradeLog[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'Trades!A:X',
      })

      const rows = response.data.values || []
      if (rows.length <= 1) return [] // No data or just headers

      const headers = rows[0]
      const trades = rows.slice(1).map((row: string[]) => {
        const trade: Record<string, unknown> = {}
        headers.forEach((header: string, index: number) => {
          trade[header.toLowerCase().replace(/\s+/g, '')] = row[index] || ''
        })
        return trade as TradeLog
      })

      return trades
    } catch (error) {
      console.error('Failed to get trades from sheet:', error)
      throw error
    }
  }

  async updateTrade(tradeId: string, updates: Partial<TradeLog>): Promise<void> {
    try {
      // First, find the row with the matching trade ID
      const trades = await this.getTrades()
      const tradeIndex = trades.findIndex(trade => 
        trade.timestamp === tradeId || 
        `${trade.ticker}-${trade.openedAt}` === tradeId
      )

      if (tradeIndex === -1) {
        throw new Error('Trade not found')
      }

      const rowNumber = tradeIndex + 2 // +2 because of 1-based indexing and header row

      // Update specific cells based on the updates
      const updatesArray = Object.entries(updates).map(([key, value]) => ({
        range: `Trades!${this.getColumnLetter(key)}${rowNumber}`,
        values: [[value]],
      }))

      await this.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: this.spreadsheetId,
        requestBody: {
          valueInputOption: 'RAW',
          data: updatesArray,
        },
      })
    } catch (error) {
      console.error('Failed to update trade in sheet:', error)
      throw error
    }
  }

  private getColumnLetter(key: string): string {
    const columnMap: Record<string, string> = {
      'status': 'O',
      'closedat': 'Q',
      'exitprice': 'R',
      'pnl': 'S',
      'fees': 'T',
      'feesentry': 'U',
      'feesexit': 'V',
      'feesroundtrip': 'W',
    }
    
    return columnMap[key.toLowerCase()] || 'A'
  }

  async initializeSheet(): Promise<void> {
    try {
      // Create headers if they don't exist
      const headers = [
        'timestamp', 'ticker', 'side', 'strategy', 'dte', 'short_strike', 'long_strike',
        'width', 'credit', 'oco_tp', 'oco_sl', 'delta_short', 'provider', 'notes',
        'status', 'opened_at', 'closed_at', 'exit_price', 'pnl', 'fees', 'account',
        'fees_entry', 'fees_exit', 'fees_round_trip'
      ]

      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: 'Trades!A1:X1',
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers],
        },
      })
    } catch (error) {
      console.error('Failed to initialize sheet:', error)
      throw error
    }
  }
}

// Export a function to get the client instead of instantiating at module level
export function getSheetsClient(): SheetsClient {
  return new SheetsClient()
}
