import { NextRequest, NextResponse } from 'next/server'
import { getSheetsClient } from '@/lib/sheets'
import { TradeLogSchema } from '@/lib/schema'
import { getCurrentUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const trade = TradeLogSchema.parse(body)
    const sheetsClient = getSheetsClient()
    
    await sheetsClient.appendTrade(trade)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Trade logging error:', error)
    return NextResponse.json(
      { error: 'Failed to log trade' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const sheetsClient = getSheetsClient()
    const trades = await sheetsClient.getTrades()
    
    return NextResponse.json({ data: trades })
  } catch (error) {
    console.error('Trade fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    )
  }
}
