import { NextRequest, NextResponse } from 'next/server'
import { getTastyClient } from '@/lib/tasty'

export async function GET(request: NextRequest) {
  try {
    const tastyClient = getTastyClient()
    
    // Test getting option chain for SPY with next Friday expiry
    const today = new Date()
    const nextFriday = new Date(today)
    nextFriday.setDate(today.getDate() + (5 - today.getDay() + 7) % 7)
    const expiryDate = nextFriday.toISOString().split('T')[0]
    
    const optionChain = await tastyClient.getOptionChain('SPY', expiryDate)
    
    return NextResponse.json({ 
      success: true,
      message: 'Option chain fetch successful!',
      data: {
        ticker: optionChain.ticker,
        expiry: optionChain.expiry,
        callsCount: optionChain.calls.length,
        putsCount: optionChain.puts.length,
        sampleCall: optionChain.calls[0] || null,
        samplePut: optionChain.puts[0] || null
      }
    })
  } catch (error) {
    console.error('Option chain test error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Option chain fetch failed.'
      },
      { status: 500 }
    )
  }
}
