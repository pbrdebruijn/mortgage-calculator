/**
 * Core mortgage calculation utilities
 * This module contains all the business logic for mortgage calculations,
 * eliminating duplication across components.
 */

import type { Mortgage, ScheduleEntry, MortgageDetails, MortgageCalculationResult } from "@/lib/types/mortgage"

/**
 * Calculates the monthly payment for a mortgage
 * @param principal - The loan amount
 * @param rate - Annual interest rate (as percentage, e.g., 3.5 for 3.5%)
 * @param years - Loan term in years
 * @param type - Mortgage type (annuity or linear)
 * @returns Monthly payment amount (for linear, this is the initial payment)
 */
export function calculateMonthlyPayment(
  principal: number,
  rate: number,
  years: number,
  type: string = 'annuity'
): number {
  if (
    isNaN(principal) ||
    isNaN(rate) ||
    isNaN(years) ||
    principal <= 0 ||
    rate <= 0 ||
    years <= 0
  ) {
    return 0
  }

  const monthlyRate = rate / 100 / 12
  const numberOfPayments = years * 12

  if (type === 'linear') {
    // For linear: fixed principal + initial interest payment
    const monthlyPrincipal = principal / numberOfPayments
    const initialInterest = principal * monthlyRate
    return monthlyPrincipal + initialInterest
  }

  // Annuity mortgage (default)
  if (monthlyRate === 0) {
    return principal / numberOfPayments
  }

  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
  )
}

/**
 * Creates a map of month index to total single payment amount for that month
 * This function determines when each single extra payment should be applied during the mortgage term
 *
 * @param mortgage - The mortgage with single payments
 * @param startDate - The mortgage start date (normalized to first of month)
 * @param numberOfPayments - Total number of monthly payments
 * @returns Map where key is month index and value is total single payment amount
 */
export function calculateSinglePaymentsByMonth(
  mortgage: Mortgage,
  startDate: Date,
  numberOfPayments: number
): Map<number, number> {
  const singlePaymentsByMonth = new Map<number, number>()

  mortgage.singlePayments.forEach(payment => {
    if (payment.amount > 0) {
      const paymentDate = new Date(payment.date)
      const monthsDiff =
        (paymentDate.getFullYear() - startDate.getFullYear()) * 12 +
        (paymentDate.getMonth() - startDate.getMonth())

      if (monthsDiff >= 0 && monthsDiff < numberOfPayments) {
        const existing = singlePaymentsByMonth.get(monthsDiff) || 0
        singlePaymentsByMonth.set(monthsDiff, existing + payment.amount)
      }
    }
  })

  return singlePaymentsByMonth
}

/**
 * Calculates comprehensive mortgage details including schedule
 * This is the core calculation function that handles:
 * - Monthly payments
 * - Extra payments (recurring and single)
 * - Interest savings
 * - Amortization schedule
 *
 * @param mortgage - The mortgage to calculate
 * @param includeSchedule - Whether to generate the full payment schedule (expensive operation)
 * @returns Detailed mortgage calculations
 */
export function calculateMortgageDetails(
  mortgage: Mortgage,
  includeSchedule: boolean = false
): MortgageDetails {
  const monthlyPayment = calculateMonthlyPayment(
    mortgage.amount,
    mortgage.interestRate,
    mortgage.term,
    mortgage.type
  )

  // Calculate total interest properly for each mortgage type
  let totalInterest: number
  if (mortgage.type === 'linear') {
    // For linear: sum of interest = (initial interest + final interest) / 2 * months
    const monthlyRate = mortgage.interestRate / 100 / 12
    const numberOfPayments = mortgage.term * 12
    const monthlyPrincipal = mortgage.amount / numberOfPayments
    // Total interest for linear mortgage
    totalInterest = (mortgage.amount * monthlyRate * (numberOfPayments + 1)) / 2
  } else {
    // For annuity: use standard calculation
    totalInterest = monthlyPayment * mortgage.term * 12 - mortgage.amount
  }

  const newMonthlyPayment = monthlyPayment + mortgage.extraPayment

  // Calculate new term with extra payments and single payments
  let newTerm = mortgage.term
  let totalPaidWithExtras = 0
  const schedule: ScheduleEntry[] = []

  if (
    !isNaN(mortgage.amount) &&
    !isNaN(mortgage.interestRate) &&
    !isNaN(mortgage.term) &&
    !isNaN(mortgage.extraPayment) &&
    mortgage.amount > 0 &&
    mortgage.interestRate > 0 &&
    mortgage.term > 0 &&
    mortgage.extraPayment >= 0
  ) {
    const monthlyRate = mortgage.interestRate / 100 / 12
    const numberOfPayments = mortgage.term * 12
    let balance = mortgage.amount
    let month = 0

    // Normalize start date to first of month
    const startDate = new Date(
      mortgage.startDate.getFullYear(),
      mortgage.startDate.getMonth(),
      1
    )

    // Calculate when single payments should be applied
    const singlePaymentsByMonth = calculateSinglePaymentsByMonth(
      mortgage,
      startDate,
      numberOfPayments
    )

    // Amortization loop
    while (balance > 0 && month < numberOfPayments) {
      const interestPayment = balance * monthlyRate
      let regularPrincipal: number
      let currentMonthlyPayment: number

      if (mortgage.type === 'linear') {
        // Linear: fixed principal payment
        regularPrincipal = mortgage.amount / numberOfPayments
        currentMonthlyPayment = regularPrincipal + interestPayment
      } else {
        // Annuity: calculated principal
        regularPrincipal = monthlyPayment - interestPayment
        currentMonthlyPayment = monthlyPayment
      }

      const extraPrincipal = mortgage.extraPayment
      const singlePaymentAmount = singlePaymentsByMonth.get(month) || 0

      const totalPrincipal = regularPrincipal + extraPrincipal + singlePaymentAmount
      const newBalance = Math.max(0, balance - totalPrincipal)

      // Adjust if payment would overpay
      const actualTotalPrincipal = balance - newBalance
      const totalPaymentAmount = interestPayment + actualTotalPrincipal

      // Only generate schedule if requested (performance optimization)
      if (includeSchedule) {
        const paymentDate = new Date(startDate)
        paymentDate.setMonth(paymentDate.getMonth() + month)

        schedule.push({
          month: month + 1,
          date: paymentDate,
          payment: currentMonthlyPayment,
          principal: regularPrincipal,
          interest: interestPayment,
          extraPayment: month < numberOfPayments ? mortgage.extraPayment : 0,
          singlePayment: singlePaymentAmount,
          totalPayment: totalPaymentAmount,
          balance: newBalance,
        })
      }

      balance = newBalance
      totalPaidWithExtras += totalPaymentAmount
      month++
    }

    newTerm = month / 12
  }

  const interestSaved = totalInterest - (totalPaidWithExtras - mortgage.amount)

  return {
    monthlyPayment,
    totalInterest,
    newMonthlyPayment,
    newTerm,
    interestSaved,
    schedule,
  }
}

/**
 * Calculates the new term and total paid with extra payments
 * This is a simplified version of calculateMortgageDetails that returns only
 * the key metrics without generating the full schedule.
 *
 * @param mortgage - The mortgage to calculate
 * @param monthlyPayment - The base monthly payment amount
 * @returns Calculation result with new term, total paid, interest paid, and months saved
 */
export function calculateNewTermAndTotalPaid(
  mortgage: Mortgage,
  monthlyPayment: number
): MortgageCalculationResult {
  let newTerm = mortgage.term
  let totalPaidWithExtras = 0
  let totalInterestPaid = 0
  let monthsSaved = 0

  if (
    !isNaN(mortgage.amount) &&
    !isNaN(mortgage.interestRate) &&
    !isNaN(mortgage.term) &&
    !isNaN(mortgage.extraPayment) &&
    mortgage.amount > 0 &&
    mortgage.interestRate > 0 &&
    mortgage.term > 0 &&
    mortgage.extraPayment >= 0
  ) {
    const monthlyRate = mortgage.interestRate / 100 / 12
    const numberOfPayments = mortgage.term * 12
    let balance = mortgage.amount
    let month = 0

    // Normalize start date to first of month
    const startDate = new Date(
      mortgage.startDate.getFullYear(),
      mortgage.startDate.getMonth(),
      1
    )

    // Calculate when single payments should be applied
    const singlePaymentsByMonth = calculateSinglePaymentsByMonth(
      mortgage,
      startDate,
      numberOfPayments
    )

    // Amortization loop
    while (balance > 0 && month < numberOfPayments) {
      const interestPayment = balance * monthlyRate
      let regularPrincipal: number

      if (mortgage.type === 'linear') {
        // Linear: fixed principal payment
        regularPrincipal = mortgage.amount / numberOfPayments
      } else {
        // Annuity: calculated principal
        regularPrincipal = monthlyPayment - interestPayment
      }

      const singlePaymentAmount = singlePaymentsByMonth.get(month) || 0

      const totalPrincipal = regularPrincipal + mortgage.extraPayment + singlePaymentAmount
      const newBalance = Math.max(0, balance - totalPrincipal)

      // Adjust if payment would overpay
      const actualTotalPrincipal = balance - newBalance
      const totalPaymentAmount = interestPayment + actualTotalPrincipal

      balance = newBalance
      totalPaidWithExtras += totalPaymentAmount
      totalInterestPaid += interestPayment
      month++
    }

    newTerm = month / 12
    monthsSaved = numberOfPayments - month
  }

  return {
    newTerm,
    totalPaidWithExtras,
    totalInterestPaid,
    monthsSaved,
  }
}

/**
 * Validates if mortgage parameters are valid for calculations
 * @param mortgage - The mortgage to validate
 * @returns true if valid, false otherwise
 */
export function isValidMortgage(mortgage: Mortgage): boolean {
  return (
    !isNaN(mortgage.amount) &&
    !isNaN(mortgage.interestRate) &&
    !isNaN(mortgage.term) &&
    !isNaN(mortgage.extraPayment) &&
    mortgage.amount > 0 &&
    mortgage.interestRate > 0 &&
    mortgage.term > 0 &&
    mortgage.extraPayment >= 0
  )
}
