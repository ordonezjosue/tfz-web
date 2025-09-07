import { NextRequest, NextResponse } from 'next/server'
import { calculateOCOLevels } from '@/lib/oco'
import { OCOCalculationSchema } from '@/lib/schema'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { credit, ...config } = OCOCalculationSchema.parse(body)
    
    const ocoLevels = calculateOCOLevels(credit, config)
    
    return NextResponse.json({ data: ocoLevels })
  } catch (error) {
    console.error('OCO calculation error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate OCO levels' },
      { status: 500 }
    )
  }
}
