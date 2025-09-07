'use client'

import { AuthWrapper } from '@/components/auth-wrapper'
import { RecommenderContent } from '@/components/recommender-content'

export default function RecommenderPage() {
  return (
    <AuthWrapper>
      <RecommenderContent />
    </AuthWrapper>
  )
}
