import { NextRequest, NextResponse } from 'next/server'
import { LoginSchema } from '@/lib/schema'
import { createSession } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = LoginSchema.parse(body)

    // Check credentials against environment variables
    const validUsername = process.env.APP_USER
    const validPassword = process.env.APP_PASS

    if (!validUsername || !validPassword) {
      return NextResponse.json(
        { error: 'Authentication not configured' },
        { status: 500 }
      )
    }

    // For simplicity, we're using plain text comparison
    // In production, you'd want to hash the password
    if (username !== validUsername || password !== validPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Create session token
    const token = await createSession(username)
    
    // Set session cookie
    const response = NextResponse.json(
      { success: true, user: { username, isAuthenticated: true } }
    )
    
    response.cookies.set('session-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
