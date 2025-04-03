import { ArrowRight } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface MortgageComparisonProps {
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

export function MortgageComparison({
  mortgageAmount,
  interestRate,
  mortgageTerm,
  monthlyPayment,
  extraPayment,
  newTerm,
  interestSaved,
  totalInterest,
  formatCurrency,
}: MortgageComparisonProps) {
  // Calculate total payments
  const totalRegularPayments = monthlyPayment * mortgageTerm * 12
  const totalExtraPayments = (monthlyPayment + extraPayment) * newTerm * 12

  // Calculate percentages for visualization
  const regularPrincipalPercentage = (mortgageAmount / totalRegularPayments) * 100
  const regularInterestPercentage = 100 - regularPrincipalPercentage

  const extraPrincipalPercentage = (mortgageAmount / totalExtraPayments) * 100
  const extraInterestPercentage = 100 - extraPrincipalPercentage

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Regular Payment Plan</CardTitle>
            <CardDescription>Without extra payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <div>Monthly Payment</div>
                <div className="font-medium">{formatCurrency(monthlyPayment)}</div>
              </div>
              <div className="flex justify-between text-sm">
                <div>Total Payments</div>
                <div className="font-medium">{formatCurrency(totalRegularPayments)}</div>
              </div>
              <div className="flex justify-between text-sm">
                <div>Total Interest</div>
                <div className="font-medium">{formatCurrency(totalInterest)}</div>
              </div>
              <div className="flex justify-between text-sm">
                <div>Mortgage Term</div>
                <div className="font-medium">{mortgageTerm} years</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Payment Breakdown</div>
              <div className="flex h-4 items-center space-x-1 text-xs">
                <div className="h-2 bg-primary rounded-l-full" style={{ width: `${regularPrincipalPercentage}%` }} />
                <div className="h-2 bg-orange-500 rounded-r-full" style={{ width: `${regularInterestPercentage}%` }} />
              </div>
              <div className="flex justify-between">
                <div className="flex items-center text-xs">
                  <div className="mr-1 h-2 w-2 rounded-full bg-primary" />
                  <span>Principal ({regularPrincipalPercentage.toFixed(1)}%)</span>
                </div>
                <div className="flex items-center text-xs">
                  <div className="mr-1 h-2 w-2 rounded-full bg-orange-500" />
                  <span>Interest ({regularInterestPercentage.toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>With Extra Payments</CardTitle>
            <CardDescription>Adding {formatCurrency(extraPayment)} monthly</CardDescription>
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
              By adding just {formatCurrency(extraPayment)} to your monthly payment, you'll save{" "}
              {formatCurrency(interestSaved)} in interest and pay off your mortgage{" "}
              {(mortgageTerm - newTerm).toFixed(1)} years earlier. This is a return of
              {((interestSaved / (extraPayment * newTerm * 12)) * 100).toFixed(1)}% on your extra payments.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

