"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { fetchTransfers, addTransfer, fetchBases, equipmentOptions, downloadTransfersExcel, type Transfer, type Base } from "@/lib/api"

import { ProtectedRoute } from "@/components/protected-route"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function TransfersPage() {
  const { user } = useAuth()
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [bases, setBases] = useState<Base[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const [formData, setFormData] = useState({
    fromBase: "",
    toBase: "",
    equipment: "",
    quantity: "",
    date: new Date().toISOString().split("T")[0],
  })

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  useEffect(() => {
    if (user?.baseId && !formData.fromBase) {
      setFormData(prev => ({ ...prev, fromBase: user.baseId! }))
    }
  }, [user, formData.fromBase])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [transfersData, basesData] = await Promise.all([
        fetchTransfers(),
        fetchBases()
      ])
      setTransfers(transfersData)
      setBases(basesData)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadTransfers = async () => {
    try {
      const data = await fetchTransfers()
      setTransfers(data)
    } catch (error) {
      console.error("Failed to load transfers:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")

    if (!formData.fromBase || !formData.toBase || !formData.equipment || !formData.quantity) {
      setErrorMessage("Please fill in all required fields")
      return
    }

    if (formData.fromBase === formData.toBase) {
      setErrorMessage("From Base and To Base cannot be the same")
      return
    }

    if (Number.parseInt(formData.quantity) <= 0) {
      setErrorMessage("Quantity must be greater than 0")
      return
    }

    setIsSubmitting(true)
    try {
      await addTransfer({
        fromBaseId: formData.fromBase,
        toBaseId: formData.toBase,
        equipmentName: formData.equipment,
        quantity: Number.parseInt(formData.quantity),
        date: formData.date,
      })

      loadTransfers()
      setFormData({
        fromBase: "",
        toBase: "",
        equipment: "",
        quantity: "",
        date: new Date().toISOString().split("T")[0],
      })
      setShowForm(false)
      setSuccessMessage("Transfer added successfully!")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error) {
      console.error("Add transfer error:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to add transfer. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const canAddTransfers = ["ADMIN", "LOGISTICS_OFFICER"].includes(user?.role || "")

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 sm:px-8 py-10">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Transfers</h1>
              <p className="text-muted-foreground text-sm">Move assets between bases</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadTransfersExcel()}
                className="flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                Export Excel
              </Button>
              {canAddTransfers && (
                <Button onClick={() => setShowForm(!showForm)} size="sm">
                  {showForm ? "Cancel" : "Add Transfer"}
                </Button>
              )}
            </div>
          </div>

          {successMessage && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-md mb-6 text-sm">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-md mb-6 text-sm">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          {showForm && canAddTransfers && (
            <Card className="mb-8 border-border shadow-sm">
              <CardHeader className="pb-6">
                <CardTitle className="text-base font-semibold">Add New Transfer</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-2">From Base *</label>
                      <select
                        value={formData.fromBase}
                        onChange={(e) => setFormData({ ...formData, fromBase: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        required
                      >
                        <option value="">Select From Base</option>
                        {bases.map((base) => (
                          <option key={base.id} value={base.id}>
                            {base.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-2">To Base *</label>
                      <select
                        value={formData.toBase}
                        onChange={(e) => setFormData({ ...formData, toBase: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        required
                      >
                        <option value="">Select To Base</option>
                        {bases.map((base) => (
                          <option key={base.id} value={base.id}>
                            {base.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-2">Equipment *</label>
                      <select
                        value={formData.equipment}
                        onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        required
                      >
                        <option value="">Select Equipment</option>
                        {equipmentOptions.map((eq) => (
                          <option key={eq} value={eq}>
                            {eq}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-2">Quantity *</label>
                      <input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        placeholder="0"
                        min="1"
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-foreground block mb-2">Date *</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isSubmitting} size="sm">
                    {isSubmitting ? "Adding..." : "Add Transfer"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-16">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground text-sm">Loading transfers...</p>
            </div>
          ) : (
            <Card className="border-border shadow-sm">
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-5 py-3 text-left text-xs font-semibold text-foreground tracking-wide">
                          From Base
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-foreground tracking-wide">
                          To Base
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-foreground tracking-wide">
                          Equipment
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-foreground tracking-wide">
                          Quantity
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-foreground tracking-wide">
                          Date
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-foreground tracking-wide">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transfers.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground text-sm">
                            No transfers found
                          </td>
                        </tr>
                      ) : (
                        transfers.map((transfer) => (
                          <tr key={transfer.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                            <td className="px-5 py-3 text-sm">{transfer.fromBase.name}</td>
                            <td className="px-5 py-3 text-sm">{transfer.toBase.name}</td>
                            <td className="px-5 py-3 text-sm">{transfer.equipment.name}</td>
                            <td className="px-5 py-3 text-sm font-medium tabular-nums">{transfer.quantity}</td>
                            <td className="px-5 py-3 text-sm">{transfer.date}</td>
                            <td className="px-5 py-3 text-sm">
                              <span className="px-2.5 py-1 rounded-sm text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                {transfer.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}
