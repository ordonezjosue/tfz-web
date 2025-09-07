import { NextRequest, NextResponse } from 'next/server'
import { getSheetsClient } from '@/lib/sheets'
import { CloseTradeSchema } from '@/lib/schema'
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
    const { tradeId, exitPrice, notes } = CloseTradeSchema.parse(body)
    const sheetsClient = getSheetsClient()
    
    const updates = {
      status: 'CLOSED' as const,
      closedAt: new Date().toISOString(),
      exitPrice,
      notes: notes || '',
    }
    
    await sheetsClient.updateTrade(tradeId, updates)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Trade close error:', error)
    return NextResponse.json(
      { error: 'Failed to close trade' },
      { status: 500 }
    )
  }
}
