import { NextRequest, NextResponse } from 'next/server'
import { calculateTastyFees } from '@/lib/fees'
import { FeeCalculationSchema } from '@/lib/schema'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticker, side, quantity, isIndex, isFutures } = FeeCalculationSchema.parse(body)
    
    const fees = calculateTastyFees(ticker, side, quantity, isIndex, isFutures)
    
    return NextResponse.json({ data: fees })
  } catch (error) {
    console.error('Fee calculation error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate fees' },
      { status: 500 }
    )
  }
}
