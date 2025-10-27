import { ArrowRight } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useLanguage } from "@/lib/i18n/language-context"

interface Mortgage {
  id: string
  name: string
  amount: number
  interestRate: number
  term: number
  extraPayment: number
  startDate: Date
  singlePayments: Array<{
    id: string
    date: string
    amount: number
  }>
}

interface MortgageComparisonProps {
  mortgages: Mortgage[]
  calculateMonthlyPayment: (principal: number, rate: number, years: number) => number
  formatCurrency: (amount: number) => string
}

export function MortgageComparison({
  mortgages,
  calculateMonthlyPayment,
  formatCurrency,
}: MortgageComparisonProps) {
  const { t } = useLanguage()
  // Calculate details for each mortgage
  const mortgageDetails = mortgages.map((mortgage) => {
    const monthlyPayment = calculateMonthlyPayment(mortgage.amount, mortgage.interestRate, mortgage.term)
    const totalInterest = monthlyPayment * mortgage.term * 12 - mortgage.amount
    const newMonthlyPayment = monthlyPayment + mortgage.extraPayment

    // Calculate new term with extra payment and single payments
    const calculateNewTermAndTotalPaid = () => {
      if (mortgage.amount <= 0 || mortgage.interestRate <= 0 || mortgage.term <= 0 || mortgage.extraPayment < 0) {
        return { newTerm: mortgage.term, totalPaidWithExtras: mortgage.amount }
      }

      const monthlyRate = mortgage.interestRate / 100 / 12
      const numberOfPayments = mortgage.term * 12
      let balance = mortgage.amount
      let month = 0
      let totalPaidWithExtras = 0

      // Create a map of month index to total single payment amount for that month
      const startDate = new Date(mortgage.startDate.getFullYear(), mortgage.startDate.getMonth(), 1)
      const singlePaymentsByMonth = new Map<number, number>()

      mortgage.singlePayments.forEach(payment => {
        if (payment.amount > 0) {
          const paymentDate = new Date(payment.date)
          const monthsDiff = (paymentDate.getFullYear() - startDate.getFullYear()) * 12 +
                            (paymentDate.getMonth() - startDate.getMonth())
          if (monthsDiff >= 0 && monthsDiff < numberOfPayments) {
            const existing = singlePaymentsByMonth.get(monthsDiff) || 0
            singlePaymentsByMonth.set(monthsDiff, existing + payment.amount)
          }
        }
      })

      while (balance > 0 && month < numberOfPayments) {
        const interestPayment = balance * monthlyRate
        const regularPrincipal = newMonthlyPayment - interestPayment
        const singlePaymentAmount = singlePaymentsByMonth.get(month) || 0
        const totalPrincipal = regularPrincipal + singlePaymentAmount
        const newBalance = Math.max(0, balance - totalPrincipal)

        // Accumulate actual total paid (interest + actual principal paid)
        const actualTotalPrincipal = balance - newBalance
        const totalPaymentAmount = interestPayment + actualTotalPrincipal
        totalPaidWithExtras += totalPaymentAmount

        balance = newBalance
        month++
      }

      return { newTerm: month / 12, totalPaidWithExtras }
    }

    const { newTerm, totalPaidWithExtras } = calculateNewTermAndTotalPaid()

    // Calculate interest saved using exact total paid
    const interestSaved = totalInterest - (totalPaidWithExtras - mortgage.amount)

    return {
      monthlyPayment,
      totalInterest,
      newMonthlyPayment,
      newTerm,
      interestSaved,
      regularTotalPayments: monthlyPayment * mortgage.term * 12,
      extraTotalPayments: totalPaidWithExtras,
    }
  })

  // Calculate aggregate totals
  const mortgageAmount = mortgages.reduce((sum, m) => sum + m.amount, 0)
  const monthlyPayment = mortgageDetails.reduce((sum, d) => sum + d.monthlyPayment, 0)
  const extraPayment = mortgages.reduce((sum, m) => sum + m.extraPayment, 0)
  const totalInterest = mortgageDetails.reduce((sum, d) => sum + d.totalInterest, 0)
  const interestSaved = mortgageDetails.reduce((sum, d) => sum + d.interestSaved, 0)
  const totalRegularPayments = mortgageDetails.reduce((sum, d) => sum + d.regularTotalPayments, 0)
  const totalExtraPayments = mortgageDetails.reduce((sum, d) => sum + d.extraTotalPayments, 0)

  // Calculate weighted average terms based on mortgage amounts (guard against division by zero)
  const mortgageTerm = mortgageAmount > 0
    ? mortgages.reduce((sum, m) => sum + (m.term * m.amount), 0) / mortgageAmount
    : 0
  const newTerm = mortgageAmount > 0
    ? mortgageDetails.reduce((sum, d, idx) => sum + (d.newTerm * mortgages[idx].amount), 0) / mortgageAmount
    : 0

  // Calculate percentages for visualization (guard against division by zero)
  const regularPrincipalPercentage = totalRegularPayments > 0
    ? (mortgageAmount / totalRegularPayments) * 100
    : 0
  const regularInterestPercentage = 100 - regularPrincipalPercentage

  const extraPrincipalPercentage = totalExtraPayments > 0
    ? (mortgageAmount / totalExtraPayments) * 100
    : 0
  const extraInterestPercentage = 100 - extraPrincipalPercentage

  // Calculate total extra payments actually made across all mortgages
  const totalExtraPaymentsMade = mortgageDetails.reduce((sum, detail, index) => {
    return sum + (mortgages[index].extraPayment * detail.newTerm * 12)
  }, 0)

  // Calculate total single payments across all mortgages
  const totalSinglePayments = mortgages.reduce((sum, mortgage) => {
    return sum + mortgage.singlePayments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0)
  }, 0)

  // Calculate total of both monthly extra payments AND single payments
  const totalAllExtraPayments = totalExtraPaymentsMade + totalSinglePayments

  // Calculate return on extra payments (guard against division by zero)
  const returnOnExtraPayments = totalAllExtraPayments > 0
    ? (interestSaved / totalAllExtraPayments) * 100
    : 0

  // Find the mortgage with the biggest time reduction for the key takeaway
  const mortgageWithBiggestReduction = mortgages.reduce((max, mortgage, index) => {
    const reduction = mortgage.term - mortgageDetails[index].newTerm
    if (!max || reduction > max.reduction) {
      return {
        mortgage,
        detail: mortgageDetails[index],
        reduction,
        index
      }
    }
    return max
  }, null as { mortgage: Mortgage; detail: any; reduction: number; index: number } | null)

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('regularPaymentPlan')}</CardTitle>
            <CardDescription>{t('withoutExtraPayments')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <div>{t('monthlyPayment')}</div>
                <div className="font-medium">{formatCurrency(monthlyPayment)}</div>
              </div>
              <div className="flex justify-between text-sm">
                <div>{t('totalPayments')}</div>
                <div className="font-medium">{formatCurrency(totalRegularPayments)}</div>
              </div>
              <div className="flex justify-between text-sm">
                <div>{t('totalInterest')}</div>
                <div className="font-medium">{formatCurrency(totalInterest)}</div>
              </div>
              <div className="flex justify-between text-sm">
                <div>{t('mortgageTerm')}</div>
                <div className="font-medium">{mortgageTerm} {t('years')}</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">{t('paymentBreakdown')}</div>
              <div className="flex h-4 items-center space-x-1 text-xs">
                <div className="h-2 bg-primary rounded-l-full" style={{ width: `${regularPrincipalPercentage}%` }} />
                <div className="h-2 bg-orange-500 rounded-r-full" style={{ width: `${regularInterestPercentage}%` }} />
              </div>
              <div className="flex justify-between">
                <div className="flex items-center text-xs">
                  <div className="mr-1 h-2 w-2 rounded-full bg-primary" />
                  <span>{t('principal')} ({regularPrincipalPercentage.toFixed(1)}%)</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="mr-1 h-2 w-2 rounded-full bg-orange-500" />
                  <span>{t('interest')} ({regularInterestPercentage.toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('withExtraPayments')}</CardTitle>
            <CardDescription>
              {extraPayment > 0 && `${formatCurrency(extraPayment)} ${t('monthly')}`}
              {extraPayment > 0 && totalSinglePayments > 0 && ' + '}
              {totalSinglePayments > 0 && `${formatCurrency(totalSinglePayments)} ${t('lumpSum')}`}
              {extraPayment === 0 && totalSinglePayments === 0 && t('noExtraPayments')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <div>Monthly Payment</div>
                <div className="font-medium">{formatCurrency(monthlyPayment + extraPayment)}</div>
              </div>
              <div className="flex justify-between text-sm">
                <div>Total Payments</div>
                <div className="font-medium">{formatCurrency(totalExtraPayments)}</div>
              </div>
              <div className="flex justify-between text-sm">
                <div>Total Interest</div>
                <div className="font-medium">{formatCurrency(totalInterest - interestSaved)}</div>
              </div>
              <div className="flex justify-between text-sm">
                <div>Mortgage Term</div>
                <div className="font-medium">{newTerm.toFixed(1)} years</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Payment Breakdown</div>
              <div className="flex h-4 items-center space-x-1 text-xs">
                <div className="h-2 bg-primary rounded-l-full" style={{ width: `${extraPrincipalPercentage}%` }} />
                <div className="h-2 bg-orange-500 rounded-r-full" style={{ width: `${extraInterestPercentage}%` }} />
              </div>
              <div className="flex justify-between">
                <div className="flex items-center text-xs">
                  <div className="mr-1 h-2 w-2 rounded-full bg-primary" />
                  <span>Principal ({extraPrincipalPercentage.toFixed(1)}%)</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="mr-1 h-2 w-2 rounded-full bg-orange-500" />
                  <span>Interest ({extraInterestPercentage.toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Savings</CardTitle>
          <CardDescription>The benefits of making extra payments</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <div className="text-sm font-medium">Interest Saved</div>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(interestSaved)}</div>
              <Progress value={(interestSaved / totalInterest) * 100} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {((interestSaved / totalInterest) * 100).toFixed(1)}% of total interest
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Time Saved</div>
              <div className="text-2xl font-bold">{(mortgageTerm - newTerm).toFixed(1)} years</div>
              <Progress value={((mortgageTerm - newTerm) / mortgageTerm) * 100} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {(((mortgageTerm - newTerm) / mortgageTerm) * 100).toFixed(1)}% of original term
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Total Savings</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalRegularPayments - totalExtraPayments)}
              </div>
              <Progress
                value={((totalRegularPayments - totalExtraPayments) / totalRegularPayments) * 100}
                className="h-2"
              />
              <div className="text-xs text-muted-foreground">
                {(((totalRegularPayments - totalExtraPayments) / totalRegularPayments) * 100).toFixed(1)}% of total cost
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center gap-2 font-medium mb-2">
              <ArrowRight className="h-4 w-4 text-green-600" />
              Key Takeaway
            </div>
            <p className="text-sm text-muted-foreground">
              By adding {extraPayment > 0 ? `${formatCurrency(extraPayment)} to your monthly payment` : 'extra payments'}
              {totalSinglePayments > 0 && extraPayment > 0 && ' and '}
              {totalSinglePayments > 0 && `${formatCurrency(totalSinglePayments)} in lump-sum payments`}, you'll save{" "}
              {formatCurrency(interestSaved)} in interest and pay off your mortgages{" "}
              {(mortgageTerm - newTerm).toFixed(1)} years earlier overall.
              {mortgageWithBiggestReduction && mortgageWithBiggestReduction.reduction > 0 && (
                <>
                  {" "}Most dramatically, your <strong>{mortgageWithBiggestReduction.mortgage.name}</strong> will be paid off in just{" "}
                  <strong>{mortgageWithBiggestReduction.detail.newTerm.toFixed(1)} years</strong> instead of{" "}
                  {mortgageWithBiggestReduction.mortgage.term} years — essentially turning a {mortgageWithBiggestReduction.mortgage.term}-year loan into a {mortgageWithBiggestReduction.detail.newTerm.toFixed(1)}-year loan!
                </>
              )}
              {" "}This is a return of {returnOnExtraPayments.toFixed(1)}% on your {totalSinglePayments > 0 ? 'combined ' : ''}extra payments.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

