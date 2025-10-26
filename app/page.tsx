"use client"

import { Calendar as CalendarIcon, Check, ChevronDown, ChevronRight, Euro, Plus, Share2, Trash, TrendingDown, X } from "lucide-react"
import { useEffect, useState } from "react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { ThemeToggle } from "@/components/theme-toggle"
import { MortgageChart } from "./mortgage-chart"
import { MortgageComparison } from "./mortgage-comparison"
import { MortgageSummary } from "./mortgage-summary"
import { MortgageTotalOverview } from "./mortgage-total-overview"

// Define single payment type
interface SinglePayment {
  id: string
  amount: number
  date: Date
}

// Define mortgage type
interface Mortgage {
  id: string
  name: string
  amount: number
  interestRate: number
  term: number
  extraPayment: number
  singlePayments: SinglePayment[]
  isExpanded?: boolean
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
      singlePayments: [],
      isExpanded: true,
    },
  ])

  const [activeTab, setActiveTab] = useState("summary")
  const [isCopied, setIsCopied] = useState(false)

  // Load shared data from URL on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sharedData = params.get('data')

    if (sharedData) {
      try {
        const decodedData = JSON.parse(atob(sharedData))
        if (Array.isArray(decodedData) && decodedData.length > 0) {
          // Ensure each mortgage has an ID and convert date strings back to Date objects
          const mortgagesWithIds = decodedData.map((mortgage, index) => ({
            ...mortgage,
            id: mortgage.id || `mortgage-${index + 1}`,
            singlePayments: (mortgage.singlePayments || []).map((p: any) => ({
              ...p,
              date: new Date(p.date)
            })),
            isExpanded: index === 0 // Expand only the first mortgage
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
      singlePayments: [],
      isExpanded: true,
    }

    // Collapse all other mortgages
    const updatedMortgages = mortgages.map(m => ({ ...m, isExpanded: false }))
    setMortgages([...updatedMortgages, newMortgage])
  }

  // Add a single payment to a mortgage
  const addSinglePayment = (mortgageId: string) => {
    setMortgages(mortgages.map(mortgage => {
      if (mortgage.id === mortgageId) {
        const newPayment: SinglePayment = {
          id: `payment-${Date.now()}`,
          amount: 0,
          date: new Date()
        }
        return {
          ...mortgage,
          singlePayments: [...mortgage.singlePayments, newPayment]
        }
      }
      return mortgage
    }))
  }

  // Remove a single payment from a mortgage
  const removeSinglePayment = (mortgageId: string, paymentId: string) => {
    setMortgages(mortgages.map(mortgage => {
      if (mortgage.id === mortgageId) {
        return {
          ...mortgage,
          singlePayments: mortgage.singlePayments.filter(p => p.id !== paymentId)
        }
      }
      return mortgage
    }))
  }

  // Update a single payment
  const updateSinglePayment = (mortgageId: string, paymentId: string, field: keyof SinglePayment, value: any) => {
    setMortgages(mortgages.map(mortgage => {
      if (mortgage.id === mortgageId) {
        return {
          ...mortgage,
          singlePayments: mortgage.singlePayments.map(payment =>
            payment.id === paymentId ? { ...payment, [field]: value } : payment
          )
        }
      }
      return mortgage
    }))
  }

  // Remove a mortgage
  const removeMortgage = (id: string) => {
    if (mortgages.length <= 1) return // Don't remove the last mortgage

    const newMortgages = mortgages.filter((m) => m.id !== id)
    setMortgages(newMortgages)
  }

  // Update mortgage details
  const updateMortgage = (id: string, field: keyof Mortgage, value: any) => {
    setMortgages(mortgages.map((mortgage) => (mortgage.id === id ? { ...mortgage, [field]: value } : mortgage)))
  }

  // Toggle mortgage expansion
  const toggleMortgageExpansion = (id: string) => {
    setMortgages(mortgages.map(mortgage =>
      mortgage.id === id
        ? { ...mortgage, isExpanded: !mortgage.isExpanded }
        : mortgage
    ))
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
      extraPayment: mortgage.extraPayment,
      singlePayments: mortgage.singlePayments.map(p => ({
        id: p.id,
        amount: p.amount,
        date: p.date.toISOString()
      }))
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

  // Calculate mortgage details for a specific mortgage
  const calculateMortgageDetails = (mortgage: Mortgage) => {
    const monthlyPayment = calculateMonthlyPayment(
      mortgage.amount,
      mortgage.interestRate,
      mortgage.term,
    )

    const totalInterest = monthlyPayment * mortgage.term * 12 - mortgage.amount
    const newMonthlyPayment = monthlyPayment + mortgage.extraPayment

    // Calculate new term with extra payments and single payments
    let newTerm = mortgage.term
    let totalPaidWithExtras = 0

    if (!isNaN(mortgage.amount) && !isNaN(mortgage.interestRate) &&
      !isNaN(mortgage.term) && !isNaN(mortgage.extraPayment) &&
      mortgage.amount > 0 && mortgage.interestRate > 0 &&
      mortgage.term > 0 && mortgage.extraPayment >= 0) {

      const monthlyRate = mortgage.interestRate / 100 / 12
      const numberOfPayments = mortgage.term * 12
      let balance = mortgage.amount
      let month = 0

      // Calculate the month when each single payment should be applied
      const currentDate = new Date()
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

      // Create a map of month index to total single payment amount for that month
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
        let principalPayment = newMonthlyPayment - interestPayment

        // Apply any single extra payments at this month
        const singlePaymentAmount = singlePaymentsByMonth.get(month) || 0
        principalPayment += singlePaymentAmount

        balance -= principalPayment
        totalPaidWithExtras += newMonthlyPayment + singlePaymentAmount
        month++
      }

      newTerm = month / 12
    }

    const interestSaved = totalInterest - (totalPaidWithExtras - mortgage.amount)

    return {
      monthlyPayment,
      totalInterest,
      newMonthlyPayment,
      newTerm,
      interestSaved
    }
  }

  // Calculate total mortgage amount for all mortgages
  const totalMortgageAmount = mortgages.reduce((sum, mortgage) => sum + mortgage.amount, 0)

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-center">Mortgage (Extra) Payment Calculator</h1>
        <div className="flex items-center gap-2">
          <ThemeToggle />
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
                <span className="animate-in fade-in slide-in-from-left-2">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                <span>Share</span>
              </>
            )}
          </Button>
        </div>
      </div>
      <p className="text-center text-muted-foreground mb-10">
        See the impact of making extra payments on your annuity mortgage (annuïtaire hypotheek)
      </p>

      {/* Mortgage Cards */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold mb-4">Your Mortgages</h2>
          <Button onClick={addMortgage} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Mortgage
          </Button>
        </div>

        <div className="space-y-4">
          {mortgages.map((mortgage) => {
            const details = calculateMortgageDetails(mortgage)

            return (
              <Card key={mortgage.id} className="overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleMortgageExpansion(mortgage.id)}
                >
                  <div className="flex items-center gap-2">
                    {mortgage.isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <h3 className="font-medium">{mortgage.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(mortgage.amount)} • {mortgage.interestRate}% • {mortgage.term} years
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {mortgage.isExpanded && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{formatCurrency(details.monthlyPayment)}</span> / month
                      </div>
                    )}
                    {mortgages.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeMortgage(mortgage.id)
                        }}
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Remove</span>
                      </Button>
                    )}
                  </div>
                </div>

                {mortgage.isExpanded && (
                  <CardContent className="pt-0">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor={`mortgage-name-${mortgage.id}`}>Mortgage Name</Label>
                          <Input
                            id={`mortgage-name-${mortgage.id}`}
                            value={mortgage.name}
                            onChange={(e) => updateMortgage(mortgage.id, "name", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`mortgage-amount-${mortgage.id}`}>Mortgage Amount</Label>
                          <div className="relative">
                            <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id={`mortgage-amount-${mortgage.id}`}
                              type="number"
                              value={mortgage.amount || ''}
                              onChange={(e) => handleNumberChange(mortgage.id, "amount", e.target.value)}
                              className="pl-9"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`interest-rate-${mortgage.id}`}>Interest Rate (%)</Label>
                          <div className="relative">
                            <TrendingDown className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id={`interest-rate-${mortgage.id}`}
                              type="number"
                              step="0.1"
                              value={mortgage.interestRate || ''}
                              onChange={(e) => handleNumberChange(mortgage.id, "interestRate", e.target.value)}
                              className="pl-9"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`mortgage-term-${mortgage.id}`}>Mortgage Term (years)</Label>
                          <Input
                            id={`mortgage-term-${mortgage.id}`}
                            type="number"
                            value={mortgage.term || ''}
                            onChange={(e) => handleNumberChange(mortgage.id, "term", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`extra-payment-${mortgage.id}`}>Monthly Extra Payment</Label>
                          <div className="relative">
                            <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              id={`extra-payment-${mortgage.id}`}
                              type="number"
                              value={mortgage.extraPayment || ''}
                              onChange={(e) => handleNumberChange(mortgage.id, "extraPayment", e.target.value)}
                              className="pl-9"
                            />
                          </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t">
                          <div className="flex items-center justify-between">
                            <Label>Single Extra Payments</Label>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addSinglePayment(mortgage.id)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Payment
                            </Button>
                          </div>

                          {mortgage.singlePayments.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No single payments added</p>
                          ) : (
                            <div className="space-y-3">
                              {mortgage.singlePayments.map((payment) => (
                                <Card key={payment.id} className="p-3">
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <Label className="text-sm">Payment Amount</Label>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => removeSinglePayment(mortgage.id, payment.id)}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                    <div className="relative">
                                      <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                      <Input
                                        type="number"
                                        value={payment.amount || ''}
                                        onChange={(e) => {
                                          const value = e.target.value === '' ? 0 : Number(e.target.value)
                                          updateSinglePayment(mortgage.id, payment.id, "amount", value)
                                        }}
                                        className="pl-9"
                                        placeholder="0"
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-sm mb-2 block">Payment Date</Label>
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <Button
                                            variant="outline"
                                            className={cn(
                                              "w-full justify-start text-left font-normal",
                                              !payment.date && "text-muted-foreground"
                                            )}
                                          >
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {payment.date ? format(payment.date, "PPP") : <span>Pick a date</span>}
                                          </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                          <Calendar
                                            mode="single"
                                            selected={payment.date}
                                            onSelect={(date) => {
                                              if (date) {
                                                updateSinglePayment(mortgage.id, payment.id, "date", date)
                                              }
                                            }}
                                            initialFocus
                                          />
                                        </PopoverContent>
                                      </Popover>
                                    </div>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <p className="text-sm font-medium">Regular Monthly Payment</p>
                          <p className="text-2xl font-bold">{formatCurrency(details.monthlyPayment)}</p>
                        </div>

                        <div>
                          <p className="text-sm font-medium">With Extra Payment</p>
                          <p className="text-2xl font-bold">{formatCurrency(details.newMonthlyPayment)}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatCurrency(mortgage.extraPayment)} extra per month
                          </p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <p className="text-sm font-medium">Time Saved</p>
                          <p className="text-2xl font-bold">{formatNumber(mortgage.term - details.newTerm)} years</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Pay off {formatNumber((mortgage.term - details.newTerm) * 12, 0)} months earlier
                          </p>
                        </div>

                        <div>
                          <p className="text-sm font-medium">Interest Saved</p>
                          <p className="text-2xl font-bold text-green-600">{formatCurrency(details.interestSaved)}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {formatNumber((details.interestSaved / details.totalInterest) * 100)}% of total interest
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      </div>

      {/* Summary Sections - All visible at once */}
      <div className="mt-10 space-y-10">
        {/* Summary Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Summary</h2>
          <MortgageSummary
            mortgages={mortgages}
            calculateMonthlyPayment={calculateMonthlyPayment}
            formatCurrency={formatCurrency}
          />
        </div>

        {/* Chart Section */}
        <div>
          <MortgageChart mortgages={mortgages} />
        </div>

        {/* Comparison Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Comparison</h2>
          <MortgageComparison
            mortgages={mortgages}
            calculateMonthlyPayment={calculateMonthlyPayment}
            formatCurrency={formatCurrency}
          />
        </div>

        {/* Total Overview Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Total Overview</h2>
          <MortgageTotalOverview
            mortgages={mortgages}
            calculateMonthlyPayment={calculateMonthlyPayment}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>
    </div>
  )
}

