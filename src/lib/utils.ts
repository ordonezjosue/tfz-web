import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatPercent(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`
}

export function formatNumber(value: number, decimals: number = 2): string {
  return value.toFixed(decimals)
}

export function calculateDaysToExpiry(expiryDate: string): number {
  const expiry = new Date(expiryDate)
  const today = new Date()
  const diffTime = expiry.getTime() - today.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function isWithinEarningsWindow(ticker: string, earningsDate?: string): boolean {
  if (!earningsDate) return false
  
  const earnings = new Date(earningsDate)
  const today = new Date()
  const diffTime = earnings.getTime() - today.getTime()
  const daysDiff = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return daysDiff >= 7 && daysDiff <= 14
}
