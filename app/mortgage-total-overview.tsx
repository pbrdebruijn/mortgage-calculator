"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js"

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend)

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

interface MortgageTotalOverviewProps {
  mortgages: Mortgage[]
  calculateMonthlyPayment: (principal: number, rate: number, years: number) => number
  formatCurrency: (amount: number) => string
}

export function MortgageTotalOverview({
  mortgages,
  calculateMonthlyPayment,
  formatCurrency,
}: MortgageTotalOverviewProps) {
  // Calculate total mortgage amount
  const totalMortgageAmount = mortgages.reduce((sum, mortgage) => sum + mortgage.amount, 0)

  // Calculate mortgage details for each mortgage
  const mortgageDetails = mortgages.map((mortgage) => {
    const monthlyPayment = calculateMonthlyPayment(mortgage.amount, mortgage.interestRate, mortgage.term)

    const totalInterest = monthlyPayment * mortgage.term * 12 - mortgage.amount

    // Calculate new monthly payment with extra payment
    const newMonthlyPayment = monthlyPayment + mortgage.extraPayment

    // Calculate new mortgage term with extra payment and single payments
    const calculateNewTermAndTotalPaid = () => {
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
    const newTotalInterest = totalPaidWithExtras - mortgage.amount
    const interestSaved = totalInterest - newTotalInterest

    return {
      ...mortgage,
      monthlyPayment,
      totalInterest,
      newMonthlyPayment,
      newTerm,
      interestSaved,
      totalCost: mortgage.amount + totalInterest,
      newTotalCost: totalPaidWithExtras,
    }
  })

  // Calculate totals
  const totalMonthlyPayment = mortgageDetails.reduce((sum, m) => sum + m.monthlyPayment, 0)
  const totalNewMonthlyPayment = mortgageDetails.reduce((sum, m) => sum + m.newMonthlyPayment, 0)
  const totalInterest = mortgageDetails.reduce((sum, m) => sum + m.totalInterest, 0)
  const totalInterestSaved = mortgageDetails.reduce((sum, m) => sum + m.interestSaved, 0)
  const totalCost = mortgageDetails.reduce((sum, m) => sum + m.totalCost, 0)
  const totalNewCost = mortgageDetails.reduce((sum, m) => sum + m.newTotalCost, 0)

  // Prepare data for pie chart
  const chartData = {
    labels: mortgages.map((m) => m.name),
    datasets: [
      {
        label: "Mortgage Amount",
        data: mortgages.map((m) => m.amount),
        backgroundColor: [
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 99, 132, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
        ],
        borderColor: [
          "rgba(54, 162, 235, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Total Mortgage Overview</CardTitle>
            <CardDescription>Combined summary of all your mortgages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm font-medium">Total Mortgage Amount</p>
                <p className="text-2xl font-bold">{formatCurrency(totalMortgageAmount)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Total Monthly Payment</p>
                <p className="text-2xl font-bold">{formatCurrency(totalMonthlyPayment)}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(totalNewMonthlyPayment)} with extra payments
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Total Interest</p>
                <p className="text-2xl font-bold">{formatCurrency(totalInterest)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Total Interest Saved</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalInterestSaved)}</p>
                <p className="text-sm text-muted-foreground">
                  {((totalInterestSaved / totalInterest) * 100).toFixed(1)}% saved
                </p>
              </div>
            </div>

            <div className="h-64">
              <Doughnut
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: "bottom",
                    },
                    tooltip: {
                      callbacks: {
                        label: (context) => {
                          const label = context.label || ""
                          const value = context.raw as number
                          return `${label}: ${formatCurrency(value)}`
                        },
                      },
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Cost Analysis</CardTitle>
            <CardDescription>Combined cost of all your mortgages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium">Total Cost (Principal + Interest)</p>
              <p className="text-2xl font-bold">{formatCurrency(totalCost)}</p>
              <p className="text-sm text-muted-foreground">Without extra payments</p>
            </div>

            <div>
              <p className="text-sm font-medium">New Total Cost</p>
              <p className="text-2xl font-bold">{formatCurrency(totalNewCost)}</p>
              <p className="text-sm text-muted-foreground">With extra payments</p>
            </div>

            <div>
              <p className="text-sm font-medium">Total Savings</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalCost - totalNewCost)}</p>
              <p className="text-sm text-muted-foreground">
                {(((totalCost - totalNewCost) / totalCost) * 100).toFixed(1)}% of total cost
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mortgage Breakdown</CardTitle>
          <CardDescription>Detailed view of each mortgage</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mortgage</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Interest Rate</TableHead>
                <TableHead>Monthly Payment</TableHead>
                <TableHead>Term</TableHead>
                <TableHead>Total Interest</TableHead>
                <TableHead>Interest Saved</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mortgageDetails.map((mortgage) => (
                <TableRow key={mortgage.id}>
                  <TableCell className="font-medium">{mortgage.name}</TableCell>
                  <TableCell>{formatCurrency(mortgage.amount)}</TableCell>
                  <TableCell>{mortgage.interestRate.toFixed(2)}%</TableCell>
                  <TableCell>
                    {formatCurrency(mortgage.monthlyPayment)}
                    <span className="block text-xs text-muted-foreground">
                      {formatCurrency(mortgage.newMonthlyPayment)} with extra
                    </span>
                  </TableCell>
                  <TableCell>
                    {mortgage.term} years
                    <span className="block text-xs text-muted-foreground">
                      {mortgage.newTerm.toFixed(1)} with extra
                    </span>
                  </TableCell>
                  <TableCell>{formatCurrency(mortgage.totalInterest)}</TableCell>
                  <TableCell className="text-green-600">{formatCurrency(mortgage.interestSaved)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold bg-muted/50">
                <TableCell>Total</TableCell>
                <TableCell>{formatCurrency(totalMortgageAmount)}</TableCell>
                <TableCell>-</TableCell>
                <TableCell>{formatCurrency(totalMonthlyPayment)}</TableCell>
                <TableCell>-</TableCell>
                <TableCell>{formatCurrency(totalInterest)}</TableCell>
                <TableCell className="text-green-600">{formatCurrency(totalInterestSaved)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

