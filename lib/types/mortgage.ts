/**
 * Shared type definitions for mortgage calculations
 */

export interface SinglePayment {
  id: string
  amount: number
  date: Date
}

export interface Mortgage {
  id: string
  name: string
  amount: number
  interestRate: number
  term: number
  extraPayment: number
  startDate: Date
  singlePayments: SinglePayment[]
  isExpanded?: boolean
}

export interface ScheduleEntry {
  month: number
  date: Date
  payment: number
  principal: number
  interest: number
  extraPayment: number
  singlePayment: number
  totalPayment: number
  balance: number
}

export interface MortgageDetails {
  monthlyPayment: number
  totalInterest: number
  newMonthlyPayment: number
  newTerm: number
  interestSaved: number
  schedule: ScheduleEntry[]
}

export interface MortgageCalculationResult {
  newTerm: number
  totalPaidWithExtras: number
  totalInterestPaid: number
  monthsSaved: number
}

export interface TimelineEntry {
  date: Date
  mortgageId: string
  mortgageName: string
  balance: number
  cumulativePaid: number
}
