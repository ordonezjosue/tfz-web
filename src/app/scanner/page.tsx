'use client'

import { AuthWrapper } from '@/components/auth-wrapper'
import { ScannerContent } from '@/components/scanner-content'

export default function ScannerPage() {
  return (
    <AuthWrapper>
      <ScannerContent />
    </AuthWrapper>
  )
}
