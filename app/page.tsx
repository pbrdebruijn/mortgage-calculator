"use client"

import { useState, useEffect } from "react"
import { Calculator, Euro, Plus, Trash, TrendingDown, Share2, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MortgageChart } from "./mortgage-chart"
import { MortgageComparison } from "./mortgage-comparison"
import { MortgageSummary } from "./mortgage-summary"
import { MortgageTotalOverview } from "./mortgage-total-overview"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

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

  const [activeTab, setActiveTab] = useState("summary")
  const [activeMortgageId, setActiveMortgageId] = useState("mortgage-1")
  const [isCopied, setIsCopied] = useState(false)

  // Load shared data from URL on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sharedData = params.get('data')

    if (sharedData) {
      try {
        const decodedData = JSON.parse(atob(sharedData))
        if (Array.isArray(decodedData) && decodedData.length > 0) {
          // Ensure each mortgage has an ID
          const mortgagesWithIds = decodedData.map((mortgage, index) => ({
            ...mortgage,
            id: mortgage.id || `mortgage-${index + 1}`
          }))
          setMortgages(mortgagesWithIds)
          toast.success("Shared mortgage data loaded!")
        }
      } catch (error) {
        console.error('Error loading shared data:', error)
        toast.error("Failed to load shared data")
      }
    }
  }, [])

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

  // Handle number input changes
  const handleNumberChange = (id: string, field: keyof Mortgage, value: string) => {
    const numValue = value === '' ? 0 : Number(value)
    updateMortgage(id, field, numValue)
  }

  // Share current mortgage data
  const shareMortgages = () => {
    const shareData = mortgages.map(mortgage => ({
      id: mortgage.id,
      name: mortgage.name,
      amount: mortgage.amount,
      interestRate: mortgage.interestRate,
      term: mortgage.term,
      extraPayment: mortgage.extraPayment
    }))

    const encodedData = btoa(JSON.stringify(shareData))
    const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encodedData}`

    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
        toast.success("Share link copied to clipboard!")
      })
      .catch(() => {
        toast.error("Failed to copy share link")
      })
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null) return "€0"
    return new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" }).format(amount)
  }

  // Format number with fallback for NaN
  const formatNumber = (value: number, decimals = 1) => {
    if (isNaN(value) || value === null) return "0"
    return value.toFixed(decimals)
  }

  // Calculate monthly payment
  const calculateMonthlyPayment = (principal: number, rate: number, years: number) => {
    if (isNaN(principal) || isNaN(rate) || isNaN(years) || principal <= 0 || rate <= 0 || years <= 0) {
      return 0
    }

    const monthlyRate = rate / 100 / 12
    const numberOfPayments = years * 12

    if (monthlyRate === 0) {
      return principal / numberOfPayments
    }

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
    if (isNaN(activeMortgage.amount) || isNaN(activeMortgage.interestRate) ||
      isNaN(activeMortgage.term) || isNaN(activeMortgage.extraPayment) ||
      activeMortgage.amount <= 0 || activeMortgage.interestRate <= 0 ||
      activeMortgage.term <= 0 || activeMortgage.extraPayment < 0) {
      return activeMortgage.term
    }

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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-center">Dutch Mortgage Extra Payment Calculator</h1>
        <Button
          onClick={shareMortgages}
          variant={isCopied ? "default" : "outline"}
          size="sm"
          className={cn(
            "transition-all duration-300",
            isCopied && "bg-green-500 hover:bg-green-600"
          )}
        >
          {isCopied ? (
            <>
              <Check className="mr-2 h-4 w-4 animate-in fade-in zoom-in" />
              <span className="animate-in fade-in slide-in-from-left-2">Link copied!</span>
            </>
          ) : (
            <>
              <Share2 className="mr-2 h-4 w-4" />
              <span>Share</span>
            </>
          )}
        </Button>
      </div>
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
              className={`relative group flex items-center rounded-lg border px-3 py-2 cursor-pointer ${mortgage.id === activeMortgageId ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                }`}
              onClick={() => setActiveMortgageId(mortgage.id)}
            >
              <span>{mortgage.name}</span>
              <span className="ml-2 text-xs opacity-70">{formatCurrency(mortgage.amount)}</span>

              {mortgages.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-6 w-6 ml-2 p-0 opacity-0 group-hover:opacity-100 transition-opacity ${mortgage.id === activeMortgageId
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
                  value={activeMortgage.amount || ''}
                  onChange={(e) => handleNumberChange(activeMortgage.id, "amount", e.target.value)}
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
                  value={activeMortgage.interestRate || ''}
                  onChange={(e) => handleNumberChange(activeMortgage.id, "interestRate", e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mortgage-term">Mortgage Term (years)</Label>
              <Input
                id="mortgage-term"
                type="number"
                value={activeMortgage.term || ''}
                onChange={(e) => handleNumberChange(activeMortgage.id, "term", e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="extra-payment">Monthly Extra Payment</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="extra-payment"
                  type="number"
                  value={activeMortgage.extraPayment || ''}
                  onChange={(e) => handleNumberChange(activeMortgage.id, "extraPayment", e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardContent>
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
              <p className="text-2xl font-bold">{formatNumber(activeMortgage.term - newTerm)} years</p>
              <p className="text-sm text-muted-foreground mt-1">
                Pay off {formatNumber((activeMortgage.term - newTerm) * 12, 0)} months earlier
              </p>
            </div>

            <div>
              <p className="text-sm font-medium">Interest Saved</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(interestSaved)}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {formatNumber((interestSaved / totalInterest) * 100)}% of total interest
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

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
    </div>
  )
}

