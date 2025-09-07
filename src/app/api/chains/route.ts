import { NextRequest, NextResponse } from 'next/server'
import { getTastyClient } from '@/lib/tasty'
import { z } from 'zod'

const ChainRequestSchema = z.object({
  ticker: z.string(),
  expiry: z.string(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { ticker, expiry } = ChainRequestSchema.parse(body)
    
    const tastyClient = getTastyClient()
    const optionChain = await tastyClient.getOptionChain(ticker, expiry)
    
    return NextResponse.json({ data: optionChain })
  } catch (error) {
    console.error('Option chain error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch option chain' },
      { status: 500 }
    )
  }
}
