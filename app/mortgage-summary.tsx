import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"

// Import shared types and utilities
import type { Mortgage } from "@/lib/types/mortgage"
import { calculateMonthlyPayment, calculateNewTermAndTotalPaid } from "@/lib/calculations/mortgageCalculations"
import { formatCurrency } from "@/lib/formatting/formatters"

interface MortgageSummaryProps {
  mortgages: Mortgage[]
}

export function MortgageSummary({ mortgages }: MortgageSummaryProps) {
  // Calculate details for each mortgage using shared utilities
  const mortgageDetails = mortgages.map((mortgage) => {
    const monthlyPayment = calculateMonthlyPayment(mortgage.amount, mortgage.interestRate, mortgage.term)
    const totalInterest = monthlyPayment * mortgage.term * 12 - mortgage.amount
    const newMonthlyPayment = monthlyPayment + mortgage.extraPayment

    // Use shared calculation utility
    const { newTerm, totalPaidWithExtras } = calculateNewTermAndTotalPaid(mortgage, monthlyPayment)

    // Calculate interest saved using exact total paid
    const newTotalInterest = totalPaidWithExtras - mortgage.amount
    const interestSaved = totalInterest - newTotalInterest

    return {
      monthlyPayment,
      totalInterest,
      newMonthlyPayment,
      newTerm,
      interestSaved,
      actualTotalPaid: totalPaidWithExtras,
      newTotalInterest,
    }
  })

  // Calculate aggregate values
  const mortgageAmount = mortgages.reduce((sum, m) => sum + m.amount, 0)
  const monthlyPayment = mortgageDetails.reduce((sum, d) => sum + d.monthlyPayment, 0)
  const extraPayment = mortgages.reduce((sum, m) => sum + m.extraPayment, 0)
  const totalInterest = mortgageDetails.reduce((sum, d) => sum + d.totalInterest, 0)
  const interestSaved = mortgageDetails.reduce((sum, d) => sum + d.interestSaved, 0)
  const actualTotalPaid = mortgageDetails.reduce((sum, d) => sum + d.actualTotalPaid, 0)
  const newTotalInterest = mortgageDetails.reduce((sum, d) => sum + d.newTotalInterest, 0)

  // Calculate weighted average terms based on mortgage amounts (guard against division by zero)
  const mortgageTerm = mortgageAmount > 0
    ? mortgages.reduce((sum, m) => sum + (m.term * m.amount), 0) / mortgageAmount
    : 0
  const newTerm = mortgageAmount > 0
    ? mortgageDetails.reduce((sum, d, idx) => sum + (d.newTerm * mortgages[idx].amount), 0) / mortgageAmount
    : 0

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
                <TableCell>{formatCurrency(actualTotalPaid)}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">New Total Interest</TableCell>
                <TableCell>{formatCurrency(newTotalInterest)}</TableCell>
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

