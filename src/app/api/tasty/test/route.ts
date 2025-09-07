import { NextRequest, NextResponse } from 'next/server'
import { getTastyClient } from '@/lib/tasty'

export async function GET(request: NextRequest) {
  try {
    const tastyClient = getTastyClient()
    
    // Test authentication
    await tastyClient.authenticate()
    
    // Test getting expiration dates for SPY
    const expirations = await tastyClient.getExpirationDates('SPY')
    
    return NextResponse.json({ 
      success: true,
      message: 'Tastytrade connection successful!',
      expirations: expirations.slice(0, 5) // Show first 5 expirations
    })
  } catch (error) {
    console.error('Tastytrade test error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Tastytrade connection failed. Check your credentials.'
      },
      { status: 500 }
    )
  }
}
