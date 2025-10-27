"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import type { Mortgage, SinglePayment } from "@/lib/types/mortgage"

/**
 * Custom hook for managing mortgage state and operations
 * Encapsulates all state management logic for mortgages, including:
 * - Multiple mortgage management
 * - Extra payments modal state
 * - URL sharing/loading
 * - CRUD operations for mortgages and single payments
 */
export function useMortgageState() {
  // State for multiple mortgages
  const [mortgages, setMortgages] = useState<Mortgage[]>([
    {
      id: "mortgage-1",
      name: "Primary Mortgage",
      amount: 300000,
      interestRate: 3.5,
      term: 30,
      extraPayment: 200,
      startDate: new Date(),
      singlePayments: [],
      isExpanded: true,
    },
  ])

  // State for managing extra payments modal
  const [editingMortgageId, setEditingMortgageId] = useState<string | null>(null)
  const [draftSinglePayments, setDraftSinglePayments] = useState<SinglePayment[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Load shared data from URL on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sharedData = params.get("data")

    if (sharedData) {
      try {
        const decodedData = JSON.parse(atob(sharedData))
        if (Array.isArray(decodedData) && decodedData.length > 0) {
          // Ensure each mortgage has an ID and convert date strings back to Date objects
          const mortgagesWithIds = decodedData.map((mortgage, index) => ({
            ...mortgage,
            id: mortgage.id || `mortgage-${index + 1}`,
            startDate: mortgage.startDate ? new Date(mortgage.startDate) : new Date(),
            singlePayments: (mortgage.singlePayments || []).map((p: any) => ({
              ...p,
              date: new Date(p.date),
            })),
            isExpanded: index === 0, // Expand only the first mortgage
          }))
          setMortgages(mortgagesWithIds)
          toast.success("Shared mortgage data loaded!")
        }
      } catch (error) {
        console.error("Error loading shared data:", error)
        toast.error("Failed to load shared data")
      }
    }
  }, [])

  /**
   * Adds a new mortgage to the list
   * Collapses all other mortgages and expands the new one
   */
  const addMortgage = () => {
    const newId = `mortgage-${mortgages.length + 1}`
    const newMortgage: Mortgage = {
      id: newId,
      name: `Mortgage ${mortgages.length + 1}`,
      amount: 200000,
      interestRate: 3.5,
      term: 30,
      extraPayment: 100,
      startDate: new Date(),
      singlePayments: [],
      isExpanded: true,
    }

    // Collapse all other mortgages
    const updatedMortgages = mortgages.map((m) => ({ ...m, isExpanded: false }))
    setMortgages([...updatedMortgages, newMortgage])
  }

  /**
   * Removes a mortgage from the list
   * Prevents removal of the last mortgage
   */
  const removeMortgage = (id: string) => {
    if (mortgages.length <= 1) return // Don't remove the last mortgage

    const newMortgages = mortgages.filter((m) => m.id !== id)
    setMortgages(newMortgages)
  }

  /**
   * Updates a specific field of a mortgage
   */
  const updateMortgage = (id: string, field: keyof Mortgage, value: any) => {
    setMortgages(
      mortgages.map((mortgage) =>
        mortgage.id === id ? { ...mortgage, [field]: value } : mortgage
      )
    )
  }

  /**
   * Toggles the expansion state of a mortgage
   */
  const toggleMortgageExpansion = (id: string) => {
    setMortgages(
      mortgages.map((mortgage) =>
        mortgage.id === id ? { ...mortgage, isExpanded: !mortgage.isExpanded } : mortgage
      )
    )
  }

  /**
   * Handles number input changes with validation
   * Converts empty strings to 0
   */
  const handleNumberChange = (id: string, field: keyof Mortgage, value: string) => {
    const numValue = value === "" ? 0 : Number(value)
    updateMortgage(id, field, numValue)
  }

  /**
   * Opens the extra payments modal for editing a specific mortgage
   */
  const openPaymentsModal = (mortgageId: string) => {
    const mortgage = mortgages.find((m) => m.id === mortgageId)
    if (mortgage) {
      setEditingMortgageId(mortgageId)
      // Create a deep copy of the payments for editing
      setDraftSinglePayments(
        mortgage.singlePayments.map((p) => ({ ...p, date: new Date(p.date) }))
      )
      setIsModalOpen(true)
    }
  }

  /**
   * Closes the extra payments modal and discards changes
   */
  const closePaymentsModal = () => {
    setIsModalOpen(false)
    setEditingMortgageId(null)
    setDraftSinglePayments([])
  }

  /**
   * Saves draft payments to the mortgage
   */
  const saveSinglePayments = () => {
    if (editingMortgageId) {
      setMortgages(
        mortgages.map((mortgage) =>
          mortgage.id === editingMortgageId
            ? { ...mortgage, singlePayments: draftSinglePayments.map((p) => ({ ...p })) }
            : mortgage
        )
      )
      toast.success("Extra payments updated!")
      closePaymentsModal()
    }
  }

  /**
   * Adds a new draft single payment in the modal
   */
  const addDraftPayment = () => {
    const newPayment: SinglePayment = {
      id: `payment-${Date.now()}`,
      amount: 0,
      date: new Date(),
    }
    setDraftSinglePayments([...draftSinglePayments, newPayment])
  }

  /**
   * Removes a draft single payment from the modal
   */
  const removeDraftPayment = (paymentId: string) => {
    setDraftSinglePayments(draftSinglePayments.filter((p) => p.id !== paymentId))
  }

  /**
   * Updates a field of a draft single payment
   */
  const updateDraftPayment = (paymentId: string, field: keyof SinglePayment, value: any) => {
    setDraftSinglePayments(
      draftSinglePayments.map((payment) =>
        payment.id === paymentId ? { ...payment, [field]: value } : payment
      )
    )
  }

  /**
   * Generates a shareable URL with mortgage data
   * Copies the URL to clipboard
   */
  const shareMortgages = (onSuccess: () => void, onError: () => void) => {
    const shareData = mortgages.map((mortgage) => ({
      id: mortgage.id,
      name: mortgage.name,
      amount: mortgage.amount,
      interestRate: mortgage.interestRate,
      term: mortgage.term,
      extraPayment: mortgage.extraPayment,
      startDate: mortgage.startDate.toISOString(),
      singlePayments: mortgage.singlePayments.map((p) => ({
        id: p.id,
        amount: p.amount,
        date: p.date.toISOString(),
      })),
    }))

    const encodedData = btoa(JSON.stringify(shareData))
    const shareUrl = `${window.location.origin}${window.location.pathname}?data=${encodedData}`

    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        onSuccess()
        toast.success("Share link copied to clipboard!")
      })
      .catch(() => {
        onError()
        toast.error("Failed to copy share link")
      })
  }

  return {
    // State
    mortgages,
    editingMortgageId,
    draftSinglePayments,
    isModalOpen,

    // Mortgage operations
    addMortgage,
    removeMortgage,
    updateMortgage,
    toggleMortgageExpansion,
    handleNumberChange,

    // Extra payments modal operations
    openPaymentsModal,
    closePaymentsModal,
    saveSinglePayments,
    addDraftPayment,
    removeDraftPayment,
    updateDraftPayment,

    // Sharing
    shareMortgages,
  }
}
