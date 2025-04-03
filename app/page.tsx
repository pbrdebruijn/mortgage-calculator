"use client"

import { useState } from "react"
import { Calculator, Euro, Plus, Trash, TrendingDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MortgageChart } from "./mortgage-chart"
import { MortgageComparison } from "./mortgage-comparison"
import { MortgageSummary } from "./mortgage-summary"
import { MortgageTotalOverview } from "./mortgage-total-overview"

// Define mortgage type
interface Mortgage {
  id: string
  name: string
  amount: number
  interestRate: number
  term: number
  extraPayment: number
}

export default function MortgageCalculator() {
  // State for multiple mortgages
  const [mortgages, setMortgages] = useState<Mortgage[]>([
    {
      id: "mortgage-1",
      name: "Primary Mortgage",
      amount: 300000,
      interestRate: 3.5,
      term: 30,
      extraPayment: 200,
    },
  ])

  const [calculationDone, setCalculationDone] = useState(false)
  const [activeTab, setActiveTab] = useState("summary")
  const [activeMortgageId, setActiveMortgageId] = useState("mortgage-1")

  // Get active mortgage
  const activeMortgage = mortgages.find((m) => m.id === activeMortgageId) || mortgages[0]

  // Add a new mortgage
  const addMortgage = () => {
    const newId = `mortgage-${mortgages.length + 1}`
    const newMortgage: Mortgage = {
      id: newId,
      name: `Mortgage ${mortgages.length + 1}`,
      amount: 200000,
      interestRate: 3.5,
      term: 30,
      extraPayment: 100,
    }

    setMortgages([...mortgages, newMortgage])
    setActiveMortgageId(newId)
  }

  // Remove a mortgage
  const removeMortgage = (id: string) => {
    if (mortgages.length <= 1) return // Don't remove the last mortgage

    const newMortgages = mortgages.filter((m) => m.id !== id)
    setMortgages(newMortgages)

    // If we removed the active mortgage, set a new active one
    if (id === activeMortgageId) {
      setActiveMortgageId(newMortgages[0].id)
    }
  }

  // Update mortgage details
  const updateMortgage = (id: string, field: keyof Mortgage, value: any) => {
    setMortgages(mortgages.map((mortgage) => (mortgage.id === id ? { ...mortgage, [field]: value } : mortgage)))
  }

  // Calculate mortgage details
  const calculateMortgage = () => {
    setCalculationDone(true)
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount)
  }

  // Calculate monthly payment
  const calculateMonthlyPayment = (principal: number, rate: number, years: number) => {
    const monthlyRate = rate / 100 / 12
    const numberOfPayments = years * 12
    return (
      (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
    )
  }

  // Calculate mortgage details for the active mortgage
  const monthlyPayment = calculateMonthlyPayment(
    activeMortgage.amount,
    activeMortgage.interestRate,
    activeMortgage.term,
  )

  // Calculate total interest
  const totalInterest = monthlyPayment * activeMortgage.term * 12 - activeMortgage.amount

  // Calculate new monthly payment with extra payment
  const newMonthlyPayment = monthlyPayment + activeMortgage.extraPayment

  // Calculate new mortgage term with extra payment (in months)
  const calculateNewTerm = () => {
    const monthlyRate = activeMortgage.interestRate / 100 / 12
    const numberOfPayments = activeMortgage.term * 12
    let balance = activeMortgage.amount
    let month = 0

    while (balance > 0 && month < numberOfPayments) {
      const interestPayment = balance * monthlyRate
      const principalPayment = newMonthlyPayment - interestPayment
      balance -= principalPayment
      month++
    }

    return month / 12
  }

  const newTerm = calculateNewTerm()

  // Calculate interest saved
  const interestSaved = totalInterest - (newMonthlyPayment * newTerm * 12 - activeMortgage.amount)

  // Calculate total mortgage amount for all mortgages
  const totalMortgageAmount = mortgages.reduce((sum, mortgage) => sum + mortgage.amount, 0)

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6 text-center">Dutch Mortgage Extra Payment Calculator</h1>
      <p className="text-center text-muted-foreground mb-10">
        See the impact of making extra payments on your annuity mortgage (annuïtaire hypotheek)
      </p>

      {/* Mortgage Selector */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Your Mortgages</h2>
          <Button onClick={addMortgage} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Mortgage
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {mortgages.map((mortgage) => (
            <div
              key={mortgage.id}
              className={`relative group flex items-center rounded-lg border px-3 py-2 cursor-pointer ${
                mortgage.id === activeMortgageId ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
              }`}
              onClick={() => setActiveMortgageId(mortgage.id)}
            >
              <span>{mortgage.name}</span>
              <span className="ml-2 text-xs opacity-70">{formatCurrency(mortgage.amount)}</span>

              {mortgages.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 ml-2 p-0 opacity-0 group-hover:opacity-100 transition-opacity ${
                    mortgage.id === activeMortgageId
                      ? "text-primary-foreground hover:bg-primary/90"
                      : "hover:bg-muted-foreground/20"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    removeMortgage(mortgage.id)
                  }}
                >
                  <Trash className="h-3 w-3" />
                  <span className="sr-only">Remove</span>
                </Button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Mortgage Details</CardTitle>
            <CardDescription>Enter your mortgage information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mortgage-name">Mortgage Name</Label>
              <Input
                id="mortgage-name"
                value={activeMortgage.name}
                onChange={(e) => updateMortgage(activeMortgage.id, "name", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mortgage-amount">Mortgage Amount</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="mortgage-amount"
                  type="number"
                  value={activeMortgage.amount}
                  onChange={(e) => updateMortgage(activeMortgage.id, "amount", Number(e.target.value))}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interest-rate">Interest Rate (%)</Label>
              <div className="relative">
                <TrendingDown className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="interest-rate"
                  type="number"
                  step="0.1"
                  value={activeMortgage.interestRate}
                  onChange={(e) => updateMortgage(activeMortgage.id, "interestRate", Number(e.target.value))}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mortgage-term">Mortgage Term (years)</Label>
              <Input
                id="mortgage-term"
                type="number"
                value={activeMortgage.term}
                onChange={(e) => updateMortgage(activeMortgage.id, "term", Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="extra-payment">Monthly Extra Payment</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="extra-payment"
                  type="number"
                  value={activeMortgage.extraPayment}
                  onChange={(e) => updateMortgage(activeMortgage.id, "extraPayment", Number(e.target.value))}
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={calculateMortgage} className="w-full">
              <Calculator className="mr-2 h-4 w-4" />
              Calculate Impact
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Payment</CardTitle>
            <CardDescription>Regular vs. with extra payment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium">Regular Monthly Payment</p>
              <p className="text-2xl font-bold">{formatCurrency(monthlyPayment)}</p>
            </div>

            <div>
              <p className="text-sm font-medium">With Extra Payment</p>
              <p className="text-2xl font-bold">{formatCurrency(newMonthlyPayment)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {formatCurrency(activeMortgage.extraPayment)} extra per month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Savings Summary</CardTitle>
            <CardDescription>The impact of your extra payments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-sm font-medium">Time Saved</p>
              <p className="text-2xl font-bold">{(activeMortgage.term - newTerm).toFixed(1)} years</p>
              <p className="text-sm text-muted-foreground mt-1">
                Pay off {((activeMortgage.term - newTerm) * 12).toFixed(0)} months earlier
              </p>
            </div>

            <div>
              <p className="text-sm font-medium">Interest Saved</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(interestSaved)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {((interestSaved / totalInterest) * 100).toFixed(1)}% of total interest
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {calculationDone && (
        <div className="mt-10">
          <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="chart">Payment Chart</TabsTrigger>
              <TabsTrigger value="comparison">Comparison</TabsTrigger>
              <TabsTrigger value="total">Total Overview</TabsTrigger>
            </TabsList>
            <TabsContent value="summary" className="mt-6">
              <MortgageSummary
                mortgageAmount={activeMortgage.amount}
                interestRate={activeMortgage.interestRate}
                mortgageTerm={activeMortgage.term}
                monthlyPayment={monthlyPayment}
                extraPayment={activeMortgage.extraPayment}
                newTerm={newTerm}
                interestSaved={interestSaved}
                totalInterest={totalInterest}
                formatCurrency={formatCurrency}
              />
            </TabsContent>
            <TabsContent value="chart" className="mt-6">
              <MortgageChart
                mortgageAmount={activeMortgage.amount}
                interestRate={activeMortgage.interestRate}
                mortgageTerm={activeMortgage.term}
                extraPayment={activeMortgage.extraPayment}
              />
            </TabsContent>
            <TabsContent value="comparison" className="mt-6">
              <MortgageComparison
                mortgageAmount={activeMortgage.amount}
                interestRate={activeMortgage.interestRate}
                mortgageTerm={activeMortgage.term}
                monthlyPayment={monthlyPayment}
                extraPayment={activeMortgage.extraPayment}
                newTerm={newTerm}
                interestSaved={interestSaved}
                totalInterest={totalInterest}
                formatCurrency={formatCurrency}
              />
            </TabsContent>
            <TabsContent value="total" className="mt-6">
              <MortgageTotalOverview
                mortgages={mortgages}
                calculateMonthlyPayment={calculateMonthlyPayment}
                formatCurrency={formatCurrency}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}

