import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"

interface MortgageSummaryProps {
  mortgageAmount: number
  interestRate: number
  mortgageTerm: number
  monthlyPayment: number
  extraPayment: number
  newTerm: number
  interestSaved: number
  totalInterest: number
  formatCurrency: (amount: number) => string
}

export function MortgageSummary({
  mortgageAmount,
  interestRate,
  mortgageTerm,
  monthlyPayment,
  extraPayment,
  newTerm,
  interestSaved,
  totalInterest,
  formatCurrency,
}: MortgageSummaryProps) {
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
                <TableCell className="font-medium">Interest Rate</TableCell>
                <TableCell>{interestRate.toFixed(2)}%</TableCell>
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

