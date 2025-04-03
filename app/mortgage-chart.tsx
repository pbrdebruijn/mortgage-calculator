"use client"

import { useEffect, useState } from "react"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

interface MortgageChartProps {
  mortgageAmount: number
  interestRate: number
  mortgageTerm: number
  extraPayment: number
}

export function MortgageChart({ mortgageAmount, interestRate, mortgageTerm, extraPayment }: MortgageChartProps) {
  const [chartData, setChartData] = useState<any[]>([])

  useEffect(() => {
    // Calculate mortgage amortization schedule
    const monthlyRate = interestRate / 100 / 12
    const numberOfPayments = mortgageTerm * 12
    const monthlyPayment =
      (mortgageAmount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1)

    // Regular payment schedule
    let regularBalance = mortgageAmount

    // Extra payment schedule
    let extraBalance = mortgageAmount
    const totalMonthlyPayment = monthlyPayment + extraPayment

    const data = []

    for (let year = 0; year <= mortgageTerm; year++) {
      // Only calculate if we still have balance
      if (regularBalance > 0 || extraBalance > 0) {
        // For regular payment
        if (regularBalance > 0) {
          for (let i = 0; i < 12; i++) {
            const interestPayment = regularBalance * monthlyRate
            const principalPayment = monthlyPayment - interestPayment
            regularBalance = Math.max(0, regularBalance - principalPayment)
          }
        }

        // For extra payment
        if (extraBalance > 0) {
          for (let i = 0; i < 12; i++) {
            const interestPayment = extraBalance * monthlyRate
            const principalPayment = totalMonthlyPayment - interestPayment
            extraBalance = Math.max(0, extraBalance - principalPayment)
          }
        }

        data.push({
          year,
          regular: Math.round(regularBalance),
          extra: Math.round(extraBalance),
        })
      }
    }

    setChartData(data)
  }, [mortgageAmount, interestRate, mortgageTerm, extraPayment])

  // Format currency for tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mortgage Balance Over Time</CardTitle>
        <CardDescription>Compare regular payments vs. with extra payments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ChartContainer
            config={{
              regular: {
                label: "Regular Payment",
                color: "hsl(var(--chart-1))",
              },
              extra: {
                label: "With Extra Payment",
                color: "hsl(var(--chart-2))",
              },
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 30, bottom: 5 }}>
                <XAxis dataKey="year" label={{ value: "Years", position: "insideBottom", offset: -5 }} />
                <YAxis
                  tickFormatter={(value) => `€${Math.round(value / 1000)}k`}
                  label={{ value: "Balance", angle: -90, position: "insideLeft" }}
                />
                <ChartTooltip content={<ChartTooltipContent formatValue={(value) => formatCurrency(value)} />} />
                <Line
                  type="monotone"
                  dataKey="regular"
                  stroke="var(--color-regular)"
                  strokeWidth={2}
                  dot={false}
                  name="Regular Payment"
                />
                <Line
                  type="monotone"
                  dataKey="extra"
                  stroke="var(--color-extra)"
                  strokeWidth={2}
                  dot={false}
                  name="With Extra Payment"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}

