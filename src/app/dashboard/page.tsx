'use client'

import { AuthWrapper } from '@/components/auth-wrapper'
import { DashboardContent } from '@/components/dashboard-content'

export default function DashboardPage() {
  return (
    <AuthWrapper>
      <DashboardContent />
    </AuthWrapper>
  )
}
