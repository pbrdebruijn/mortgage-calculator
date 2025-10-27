import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"

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
    date: Date
    amount: number
  }>
}

interface MortgageSummaryProps {
  mortgages: Mortgage[]
  calculateMonthlyPayment: (principal: number, rate: number, years: number) => number
  formatCurrency: (amount: number) => string
}

export function MortgageSummary({
  mortgages,
  calculateMonthlyPayment,
  formatCurrency,
}: MortgageSummaryProps) {
  // Calculate details for each mortgage
  const mortgageDetails = mortgages.map((mortgage) => {
    const monthlyPayment = calculateMonthlyPayment(mortgage.amount, mortgage.interestRate, mortgage.term)
    const totalInterest = monthlyPayment * mortgage.term * 12 - mortgage.amount
    const newMonthlyPayment = monthlyPayment + mortgage.extraPayment

    // Calculate new term with extra payment and single payments
    const calculateNewTerm = () => {
      if (mortgage.amount <= 0 || mortgage.interestRate <= 0 || mortgage.term <= 0 || mortgage.extraPayment < 0) {
        return mortgage.term
      }

      const monthlyRate = mortgage.interestRate / 100 / 12
      const numberOfPayments = mortgage.term * 12
      let balance = mortgage.amount
      let month = 0

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
        balance = Math.max(0, balance - totalPrincipal)
        month++
      }

      return month / 12
    }

    const newTerm = calculateNewTerm()
    const interestSaved = totalInterest - (newMonthlyPayment * newTerm * 12 - mortgage.amount)

    return {
      monthlyPayment,
      totalInterest,
      newMonthlyPayment,
      newTerm,
      interestSaved,
    }
  })

  // Calculate aggregate values
  const mortgageAmount = mortgages.reduce((sum, m) => sum + m.amount, 0)
  const monthlyPayment = mortgageDetails.reduce((sum, d) => sum + d.monthlyPayment, 0)
  const extraPayment = mortgages.reduce((sum, m) => sum + m.extraPayment, 0)
  const totalInterest = mortgageDetails.reduce((sum, d) => sum + d.totalInterest, 0)
  const interestSaved = mortgageDetails.reduce((sum, d) => sum + d.interestSaved, 0)
  const mortgageTerm = Math.max(...mortgages.map(m => m.term))
  const newTerm = Math.max(...mortgageDetails.map(d => d.newTerm))

  // Calculate weighted average interest rate (guard against division by zero)
  const weightedInterestRate = mortgageAmount > 0
    ? mortgages.reduce((sum, m) => sum + (m.interestRate * m.amount), 0) / mortgageAmount
    : 0
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Mortgage Overview</CardTitle>
          <CardDescription>Summary of your mortgage details</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Mortgage Amount</TableCell>
                <TableCell>{formatCurrency(mortgageAmount)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Weighted Avg Interest Rate</TableCell>
                <TableCell>{weightedInterestRate.toFixed(2)}%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Original Term</TableCell>
                <TableCell>{mortgageTerm} years</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Monthly Payment</TableCell>
                <TableCell>{formatCurrency(monthlyPayment)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Extra Payment</TableCell>
                <TableCell>{formatCurrency(extraPayment)}/month</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">New Term</TableCell>
                <TableCell>{newTerm.toFixed(1)} years</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Financial Impact</CardTitle>
          <CardDescription>How extra payments affect your mortgage</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Original Total Cost</TableCell>
                <TableCell>{formatCurrency(mortgageAmount + totalInterest)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Original Total Interest</TableCell>
                <TableCell>{formatCurrency(totalInterest)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">New Total Cost</TableCell>
                <TableCell>{formatCurrency(mortgageAmount + totalInterest - interestSaved)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">New Total Interest</TableCell>
                <TableCell>{formatCurrency(totalInterest - interestSaved)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Interest Saved</TableCell>
                <TableCell className="text-green-600 font-bold">{formatCurrency(interestSaved)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Time Saved</TableCell>
                <TableCell>{(mortgageTerm - newTerm).toFixed(1)} years</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

