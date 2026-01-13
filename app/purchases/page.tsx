"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { fetchPurchases, addPurchase, fetchBases, equipmentOptions, downloadPurchasesPDF, type Purchase, type Base } from "@/lib/api"

import { ProtectedRoute } from "@/components/protected-route"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function PurchasesPage() {
  const { user } = useAuth()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [bases, setBases] = useState<Base[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [selectedBase, setSelectedBase] = useState("")

  const [formData, setFormData] = useState({
    baseId: user?.baseId || "",
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
    if (user?.baseId && !formData.baseId) {
      setFormData(prev => ({ ...prev, baseId: user.baseId! }))
    }
  }, [user, formData.baseId])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [purchasesData, basesData] = await Promise.all([
        fetchPurchases({ baseId: selectedBase || undefined }),
        fetchBases()
      ])
      setPurchases(purchasesData)
      setBases(basesData)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadPurchases = async (baseId?: string) => {
    try {
      const data = await fetchPurchases({ baseId })
      setPurchases(data)
    } catch (error) {
      console.error("Failed to load purchases:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")

    if (!formData.equipment || !formData.quantity || !formData.baseId) {
      setErrorMessage("Please fill in all required fields")
      return
    }

    if (Number.parseInt(formData.quantity) <= 0) {
      setErrorMessage("Quantity must be greater than 0")
      return
    }

    setIsSubmitting(true)
    try {
      await addPurchase({
        baseId: formData.baseId,
        equipmentName: formData.equipment,
        quantity: Number.parseInt(formData.quantity),
        date: formData.date,
      })

      loadPurchases()
      setFormData({
        baseId: user?.baseId || "",
        equipment: "",
        quantity: "",
        date: new Date().toISOString().split("T")[0],
      })
      setShowForm(false)
      setSuccessMessage("Purchase added successfully!")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error) {
      console.error("Add purchase error:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to add purchase. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const canAddPurchases = ["ADMIN", "LOGISTICS_OFFICER"].includes(user?.role || "")

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 sm:px-8 py-10">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Purchases</h1>
              <p className="text-muted-foreground text-sm">Record and manage asset purchases</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadPurchasesPDF()}
                className="flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                Export PDF
              </Button>
              {canAddPurchases && (
                <Button onClick={() => setShowForm(!showForm)} size="sm">
                  {showForm ? "Cancel" : "Add Purchase"}
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-8 border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-end">
                {["ADMIN", "LOGISTICS_OFFICER"].includes(user?.role || "") && (
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-2">Base</label>
                    <select
                      value={selectedBase}
                      onChange={(e) => {
                        setSelectedBase(e.target.value)
                        loadPurchases(e.target.value)
                      }}
                      className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[180px]"
                    >
                      <option value="">All Bases</option>
                      {bases.map((base) => (
                        <option key={base.id} value={base.id}>
                          {base.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

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
          {showForm && canAddPurchases && (
            <Card className="mb-8 border-border shadow-sm">
              <CardHeader className="pb-6">
                <CardTitle className="text-base font-semibold">Add New Purchase</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {["ADMIN", "LOGISTICS_OFFICER"].includes(user?.role || "") && (
                      <div>
                        <label className="text-xs font-medium text-foreground block mb-2">Base *</label>
                        <select
                          value={formData.baseId}
                          onChange={(e) => setFormData({ ...formData, baseId: e.target.value })}
                          className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                          required
                        >
                          <option value="">Select Base</option>
                          {bases.map((base) => (
                            <option key={base.id} value={base.id}>
                              {base.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
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
                    {isSubmitting ? "Adding..." : "Add Purchase"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Table */}
          {isLoading ? (
            <div className="text-center py-16">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground text-sm">Loading purchases...</p>
            </div>
          ) : (
            <Card className="border-border shadow-sm">
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="px-5 py-3 text-left text-xs font-semibold text-foreground tracking-wide">
                          Date
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-foreground tracking-wide">
                          Equipment
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-foreground tracking-wide">
                          Quantity
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-foreground tracking-wide">
                          Base
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-foreground tracking-wide">
                          Created By
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {purchases.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-5 py-10 text-center text-muted-foreground text-sm">
                            No purchases found
                          </td>
                        </tr>
                      ) : (
                        purchases.map((purchase) => (
                          <tr key={purchase.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                            <td className="px-5 py-3 text-sm">{purchase.date}</td>
                            <td className="px-5 py-3 text-sm">{purchase.equipment.name}</td>
                            <td className="px-5 py-3 text-sm font-medium tabular-nums">{purchase.quantity}</td>
                            <td className="px-5 py-3 text-sm">{purchase.base.name}</td>
                            <td className="px-5 py-3 text-sm text-muted-foreground">{purchase.user.email}</td>
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
