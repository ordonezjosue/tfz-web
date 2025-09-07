// import { FeeCalculation } from './schema'

export interface FeeBreakdown {
  commission: number
  clearingFee: number
  regulatoryFees: number
  total: number
}

export interface TradeFees {
  entry: FeeBreakdown
  exit: FeeBreakdown
  roundTrip: FeeBreakdown
}

export function calculateTastyFees(
  ticker: string,
  side: 'call' | 'put',
  quantity: number,
  isIndex: boolean = false,
  isFutures: boolean = false
): TradeFees {
  // Tastytrade commission structure
  const baseCommission = 0 // $0 commission for equity options
  
  // Clearing fees
  const clearingFeePerContract = 0.65 // $0.65 per contract
  
  // Regulatory fees
  const orfFee = 0.000119 // ORF fee per contract
  const tafFee = 0.000119 // TAF fee per contract
  
  // Index options have different fees
  const indexCommission = isIndex ? 0 : 0 // Still $0 for index options
  const indexClearingFee = isIndex ? 0.65 : clearingFeePerContract
  
  // Futures options
  const futuresCommission = isFutures ? 0 : 0 // $0 for futures options
  const futuresClearingFee = isFutures ? 0.65 : clearingFeePerContract
  
  // Calculate fees per leg
  const commissionPerLeg = isFutures ? futuresCommission : (isIndex ? indexCommission : baseCommission)
  const clearingFeePerLeg = isFutures ? futuresClearingFee : (isIndex ? indexClearingFee : clearingFeePerContract)
  const regulatoryFeesPerLeg = orfFee + tafFee
  
  const totalPerLeg = commissionPerLeg + clearingFeePerLeg + regulatoryFeesPerLeg
  
  // For spreads, we have 2 legs (short + long)
  const legsPerTrade = 2
  const totalFeesPerTrade = totalPerLeg * legsPerTrade * quantity
  
  const entryFees: FeeBreakdown = {
    commission: commissionPerLeg * legsPerTrade * quantity,
    clearingFee: clearingFeePerLeg * legsPerTrade * quantity,
    regulatoryFees: regulatoryFeesPerLeg * legsPerTrade * quantity,
    total: totalFeesPerTrade,
  }
  
  const exitFees: FeeBreakdown = {
    commission: commissionPerLeg * legsPerTrade * quantity,
    clearingFee: clearingFeePerLeg * legsPerTrade * quantity,
    regulatoryFees: regulatoryFeesPerLeg * legsPerTrade * quantity,
    total: totalFeesPerTrade,
  }
  
  const roundTripFees: FeeBreakdown = {
    commission: entryFees.commission + exitFees.commission,
    clearingFee: entryFees.clearingFee + exitFees.clearingFee,
    regulatoryFees: entryFees.regulatoryFees + exitFees.regulatoryFees,
    total: entryFees.total + exitFees.total,
  }
  
  return {
    entry: entryFees,
    exit: exitFees,
    roundTrip: roundTripFees,
  }
}

export function calculatePnL(
  credit: number,
  debit: number,
  fees: number,
  quantity: number = 1
): number {
  // For credit spreads: P&L = Credit - Debit - Fees
  // Positive P&L = profit, Negative P&L = loss
  return (credit - debit - fees) * quantity
}

export function calculateMaxLoss(
  width: number,
  credit: number,
  fees: number,
  quantity: number = 1
): number {
  // Max loss = Width - Credit + Fees
  return (width - credit + fees) * quantity
}

export function calculateMaxProfit(
  credit: number,
  fees: number,
  quantity: number = 1
): number {
  // Max profit = Credit - Fees
  return (credit - fees) * quantity
}

export function calculateReturnOnRisk(
  credit: number,
  width: number,
  fees: number
): number {
  const maxProfit = credit - fees
  const maxLoss = width - credit + fees
  return maxProfit / maxLoss
}
