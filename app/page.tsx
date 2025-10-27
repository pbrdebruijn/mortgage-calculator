"use client"

import { Calendar as CalendarIcon, Check, ChevronDown, ChevronRight, Euro, Plus, Share2, Trash, TrendingDown, X } from "lucide-react"
import { useState, useMemo } from "react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSelector } from "@/components/language-selector"
import { useLanguage } from "@/lib/i18n/language-context"
import { MortgageChart } from "./mortgage-chart"
import { MortgageComparison } from "./mortgage-comparison"
import { MortgageSummary } from "./mortgage-summary"
import { MortgageTotalOverview } from "./mortgage-total-overview"

// Import shared types
import type { Mortgage, SinglePayment } from "@/lib/types/mortgage"

// Import utilities
import { calculateMortgageDetails } from "@/lib/calculations/mortgageCalculations"
import { formatCurrency, formatNumber } from "@/lib/formatting/formatters"
import { useMortgageState } from "@/hooks/useMortgageState"

export default function MortgageCalculator() {
  const { t } = useLanguage()

  // Use custom hook for all mortgage state management
  const {
    mortgages,
    isModalOpen,
    draftSinglePayments,
    addMortgage,
    removeMortgage,
    updateMortgage,
    toggleMortgageExpansion,
    handleNumberChange,
    openPaymentsModal,
    closePaymentsModal,
    saveSinglePayments,
    addDraftPayment,
    removeDraftPayment,
    updateDraftPayment,
    shareMortgages,
  } = useMortgageState()

  // Local UI state
  const [isCopied, setIsCopied] = useState(false)
  const [isTimelineOpen, setIsTimelineOpen] = useState(false)

  // Handle share button with local state
  const handleShare = () => {
    shareMortgages(
      () => {
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      },
      () => {
        // Error already handled in hook
      }
    )
  }

  // Unified schedule entry interface
  interface UnifiedScheduleEntry {
    date: Date
    mortgageId: string
    mortgageName: string
    payment: number
    principal: number
    interest: number
    extraPayment: number
    singlePayment: number
    totalPayment: number
    balance: number
  }

  // Generate unified timeline from all mortgages (memoized and only when timeline is open)
  const unifiedTimeline = useMemo(() => {
    if (!isTimelineOpen) {
      return []
    }

    const allEntries: UnifiedScheduleEntry[] = []

    mortgages.forEach(mortgage => {
      const details = calculateMortgageDetails(mortgage, true) // Include schedule
      details.schedule.forEach(entry => {
        allEntries.push({
          date: entry.date,
          mortgageId: mortgage.id,
          mortgageName: mortgage.name,
          payment: entry.payment,
          principal: entry.principal,
          interest: entry.interest,
          extraPayment: entry.extraPayment,
          singlePayment: entry.singlePayment,
          totalPayment: entry.totalPayment,
          balance: entry.balance
        })
      })
    })

    // Sort by date
    return allEntries.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [mortgages, isTimelineOpen])

  // Calculate total payment count efficiently (without generating full schedule)
  const totalPaymentCount = useMemo(() => {
    return mortgages.reduce((count, mortgage) => {
      const details = calculateMortgageDetails(mortgage, false) // Don't include schedule
      return count + Math.ceil(details.newTerm * 12)
    }, 0)
  }, [mortgages])

  // Calculate total mortgage amount for all mortgages
  const totalMortgageAmount = mortgages.reduce((sum, mortgage) => sum + mortgage.amount, 0)

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-center">{t('title')}</h1>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
          <Button
            onClick={handleShare}
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
                <span className="animate-in fade-in slide-in-from-left-2">{t('copied')}</span>
              </>
            ) : (
              <>
                <Share2 className="mr-2 h-4 w-4" />
                <span>{t('share')}</span>
              </>
            )}
          </Button>
        </div>
      </div>
      <p className="text-center text-muted-foreground mb-10">
        {t('description')}
      </p>

      {/* Mortgage Cards */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold mb-4">{t('yourMortgages')}</h2>
          <Button onClick={addMortgage} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {t('addMortgage')}
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
                        {formatCurrency(mortgage.amount)} • {mortgage.interestRate}% • {mortgage.term} {t('years')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {mortgage.isExpanded && (
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{formatCurrency(details.monthlyPayment)}</span> / {t('month')}
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
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Left Column: Form Inputs */}
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`mortgage-name-${mortgage.id}`}>{t('mortgageName')}</Label>
                          <Input
                            id={`mortgage-name-${mortgage.id}`}
                            value={mortgage.name}
                            onChange={(e) => updateMortgage(mortgage.id, "name", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`start-date-${mortgage.id}`}>{t('startDate')}</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                id={`start-date-${mortgage.id}`}
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !mortgage.startDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {mortgage.startDate ? format(mortgage.startDate, "PP") : <span>{t('pickDate')}</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={mortgage.startDate}
                                onSelect={(date) => {
                                  if (date) {
                                    updateMortgage(mortgage.id, "startDate", date)
                                  }
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="grid gap-3 grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`mortgage-amount-${mortgage.id}`}>{t('mortgageAmount')}</Label>
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
                            <Label htmlFor={`mortgage-term-${mortgage.id}`}>{t('mortgageTerm')}</Label>
                            <Input
                              id={`mortgage-term-${mortgage.id}`}
                              type="number"
                              value={mortgage.term || ''}
                              onChange={(e) => handleNumberChange(mortgage.id, "term", e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="grid gap-3 grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor={`interest-rate-${mortgage.id}`}>{t('interestRate')}</Label>
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
                            <Label htmlFor={`extra-payment-${mortgage.id}`}>{t('monthlyExtraPayment')}</Label>
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
                        </div>

                        <div className="space-y-2 pt-2 border-t">
                          <Label>{t('singleExtraPayments')}</Label>
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => openPaymentsModal(mortgage.id)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            {t('manageExtraPayments')}
                            {mortgage.singlePayments.length > 0 && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full">
                                {mortgage.singlePayments.length}
                              </span>
                            )}
                          </Button>
                          {mortgage.singlePayments.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {t('total')}: {formatCurrency(mortgage.singlePayments.reduce((sum, p) => sum + p.amount, 0))}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right Column: Summary Stats */}
                      <div className="grid gap-4 grid-cols-2 content-start">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground">{t('regularMonthlyPayment')}</p>
                          <p className="text-xl font-bold mt-1">{formatCurrency(details.monthlyPayment)}</p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-muted-foreground">{t('withExtraPayment')}</p>
                          <p className="text-xl font-bold mt-1">{formatCurrency(details.newMonthlyPayment)}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatCurrency(mortgage.extraPayment)} {t('extra')}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-muted-foreground">{t('timeSaved')}</p>
                          <p className="text-xl font-bold mt-1">{formatNumber(mortgage.term - details.newTerm)} {t('years')}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatNumber((mortgage.term - details.newTerm) * 12, 0)} {t('months')} {t('earlier')}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-muted-foreground">{t('interestSaved')}</p>
                          <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(details.interestSaved)}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatNumber((details.interestSaved / details.totalInterest) * 100)}% {t('ofTotal')}
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
          <h2 className="text-2xl font-bold mb-4">{t('summary')}</h2>
          <MortgageSummary mortgages={mortgages} />
        </div>

        {/* Chart Section */}
        <div>
          <MortgageChart mortgages={mortgages} />
        </div>

        {/* Unified Payment Timeline Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">{t('paymentTimeline')}</h2>
          <Card>
            <CardContent className="pt-6">
              <Collapsible open={isTimelineOpen} onOpenChange={setIsTimelineOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span className="font-semibold">
                      {isTimelineOpen ? t('hideFullTimeline') : t('showFullTimeline')} ({t('totalPayments_count', { count: totalPaymentCount })})
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-4">
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-32">{t('date')}</TableHead>
                          <TableHead>{t('mortgageName')}</TableHead>
                          <TableHead className="text-right">{t('payment')}</TableHead>
                          <TableHead className="text-right">{t('principal')}</TableHead>
                          <TableHead className="text-right">{t('interest')}</TableHead>
                          <TableHead className="text-right bg-blue-50 dark:bg-blue-950">{t('extra')}</TableHead>
                          <TableHead className="text-right bg-purple-50 dark:bg-purple-950">{t('single')}</TableHead>
                          <TableHead className="text-right font-semibold">{t('total')}</TableHead>
                          <TableHead className="text-right font-semibold">{t('balance')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {unifiedTimeline.map((entry, index) => (
                          <TableRow
                            key={`${entry.mortgageId}-${index}`}
                            className={index % 2 === 0 ? "bg-muted/30" : ""}
                          >
                            <TableCell className="text-sm font-medium">{format(entry.date, "MMM yyyy")}</TableCell>
                            <TableCell className="text-sm">
                              <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                                {entry.mortgageName}
                              </span>
                            </TableCell>
                            <TableCell className="text-right text-sm">{formatCurrency(entry.payment)}</TableCell>
                            <TableCell className="text-right text-sm">{formatCurrency(entry.principal)}</TableCell>
                            <TableCell className="text-right text-sm">{formatCurrency(entry.interest)}</TableCell>
                            <TableCell className={cn(
                              "text-right text-sm font-medium",
                              entry.extraPayment > 0 && "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                            )}>
                              {entry.extraPayment > 0 ? formatCurrency(entry.extraPayment) : "-"}
                            </TableCell>
                            <TableCell className={cn(
                              "text-right text-sm font-medium",
                              entry.singlePayment > 0 && "bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300"
                            )}>
                              {entry.singlePayment > 0 ? formatCurrency(entry.singlePayment) : "-"}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-sm">{formatCurrency(entry.totalPayment)}</TableCell>
                            <TableCell className="text-right font-semibold text-sm">{formatCurrency(entry.balance)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        </div>

        {/* Comparison Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">{t('comparison')}</h2>
          <MortgageComparison mortgages={mortgages} />
        </div>

        {/* Total Overview Section */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Total Overview</h2>
          <MortgageTotalOverview mortgages={mortgages} />
        </div>
      </div>

      {/* Extra Payments Modal */}
      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) closePaymentsModal()
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('manageSingleExtraPayments')}</DialogTitle>
            <DialogDescription>
              {t('addOnetimePayments')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">{t('paymentSchedule')}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addDraftPayment}
              >
                <Plus className="h-4 w-4 mr-1" />
                {t('addPayment')}
              </Button>
            </div>

            {draftSinglePayments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t('noExtraPaymentsYet')}</p>
                <p className="text-sm mt-1">{t('clickAddPayment')}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {draftSinglePayments.map((payment, index) => (
                  <Card key={payment.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">{t('paymentNumber', { number: index + 1 })}</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removeDraftPayment(payment.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm">{t('amount')}</Label>
                          <div className="relative mt-1">
                            <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              value={payment.amount || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : Number(e.target.value)
                                updateDraftPayment(payment.id, "amount", value)
                              }}
                              className="pl-9"
                              placeholder="0"
                            />
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm">{t('paymentDate')}</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal mt-1",
                                  !payment.date && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {payment.date ? format(payment.date, "PP") : <span>{t('pickDate')}</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={payment.date}
                                onSelect={(date) => {
                                  if (date) {
                                    updateDraftPayment(payment.id, "date", date)
                                  }
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {draftSinglePayments.length > 0 && (
              <div className="flex items-center justify-between pt-3 border-t">
                <Label className="text-sm font-semibold">{t('totalExtraPayments')}</Label>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(draftSinglePayments.reduce((sum, p) => sum + p.amount, 0))}
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closePaymentsModal}>
              {t('cancel')}
            </Button>
            <Button onClick={saveSinglePayments} className="bg-purple-600 hover:bg-purple-700">
              {t('saveAndRecalculate')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

