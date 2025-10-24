"use client"

import { useEffect, useState } from "react"
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Legend } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartTooltip } from "@/components/ui/chart"

interface MortgageChartProps {
  mortgages: Array<{
    id: string
    name: string
    amount: number
    interestRate: number
    term: number
    extraPayment: number
  }>
}

interface ChartDataPoint {
  year: number
  total: number
  [key: string]: number
}

export function MortgageChart({ mortgages = [] }: MortgageChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])

  useEffect(() => {
    if (!mortgages || mortgages.length === 0) {
      setChartData([{ year: 0, total: 0 }])
      return
    }

    // Find the longest mortgage term
    const maxTerm = Math.max(...mortgages.map(m => m.term))

    // Initialize data array with years
    const data: ChartDataPoint[] = Array.from({ length: maxTerm + 1 }, (_, i) => ({
      year: i,
      total: 0,
      ...Object.fromEntries(mortgages.map(m => [m.id, 0]))
    }))

    // Calculate balance over time for each mortgage
    mortgages.forEach(mortgage => {
      const monthlyRate = mortgage.interestRate / 100 / 12
      const numberOfPayments = mortgage.term * 12
      const monthlyPayment = mortgage.amount > 0 && mortgage.interestRate > 0 ?
        (mortgage.amount * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
        (Math.pow(1 + monthlyRate, numberOfPayments) - 1) : 0

      const totalMonthlyPayment = monthlyPayment + mortgage.extraPayment
      let balance = mortgage.amount

      for (let year = 0; year <= mortgage.term && year <= maxTerm; year++) {
        if (balance > 0) {
          // Calculate balance after one year of payments
          for (let i = 0; i < 12 && balance > 0; i++) {
            const interestPayment = balance * monthlyRate
            const principalPayment = totalMonthlyPayment - interestPayment
            balance = Math.max(0, balance - principalPayment)
          }
        }

        // Update data for this mortgage
        data[year][mortgage.id] = Math.round(balance)
      }
    })

    // Calculate totals after all mortgages are processed
    data.forEach(point => {
      point.total = mortgages.reduce((sum, mortgage) => sum + (point[mortgage.id] || 0), 0)
    })

    setChartData(data)
  }, [mortgages])

  // Format currency for tooltip
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(value)
  }

  // Generate colors for each mortgage
  const getLineColor = (index: number) => {
    const colors = [
      "hsl(var(--chart-1))",
      "hsl(var(--chart-2))",
      "hsl(var(--chart-3))",
      "hsl(var(--chart-4))",
      "hsl(var(--chart-5))",
    ]
    return colors[index % colors.length]
  }

  if (!mortgages || mortgages.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Mortgage Balance Over Time</CardTitle>
          <CardDescription>Add a mortgage to see the balance reduction over time</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          No mortgage data to display
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Mortgage Balance Over Time</CardTitle>
        <CardDescription>Compare balance reduction for each mortgage</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 0, right: 50, bottom: 20, left: 0 }}>
            <XAxis
              dataKey="year"
              label={{ value: "Years", position: "insideBottom", offset: -15 }}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value) => `€${Math.round(value / 1000)}k`}
              label={{ value: "Balance", angle: -90, position: "insideLeft", offset: 15 }}
              tick={{ fontSize: 12 }}
              width={70}
            />
            <ChartTooltip
              formatter={(value: number) => formatCurrency(value)}
              labelFormatter={(label: number) => `Year ${label}`}
            />
            <Legend verticalAlign="top" height={36} />
            {/* Line for total balance - only show when there are multiple mortgages */}
            {mortgages.length > 1 && (
              <Line
                type="monotone"
                dataKey="total"
                stroke="hsl(var(--primary))"
                strokeWidth={3}
                dot={false}
                name="Total Balance"
              />
            )}
            {/* Lines for individual mortgages */}
            {mortgages.map((mortgage, index) => (
              <Line
                key={mortgage.id}
                type="monotone"
                dataKey={mortgage.id}
                stroke={mortgages.length === 1 ? "hsl(var(--primary))" : getLineColor(index)}
                strokeWidth={mortgages.length === 1 ? 3 : 2}
                strokeDasharray={mortgages.length > 1 && index > 0 ? "5 5" : undefined}
                dot={false}
                name={mortgage.name}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card >
  )
}

