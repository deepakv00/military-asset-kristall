"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { fetchAssignments, addAssignment, fetchBases, equipmentOptions, downloadAssignmentsPDF, type Assignment, type Base } from "@/lib/api"

import { ProtectedRoute } from "@/components/protected-route"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function AssignmentsPage() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [bases, setBases] = useState<Base[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  const [formData, setFormData] = useState({
    baseId: user?.baseId || "",
    equipment: "",
    quantity: "",
    type: "ASSIGNED" as "ASSIGNED" | "EXPENDED",
    personnelName: "",
    reason: "",
    date: new Date().toISOString().split("T")[0],
  })

  const [selectedBase, setSelectedBase] = useState("")

  const canAddAssignments = ["ADMIN", "LOGISTICS_OFFICER"].includes(user?.role || "")

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
      const [assignmentsData, basesData] = await Promise.all([
        fetchAssignments({ baseId: selectedBase || undefined }),
        fetchBases()
      ])
      setAssignments(assignmentsData)
      setBases(basesData)
    } catch (error) {
      console.error("Failed to load data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAssignments = async (baseId?: string) => {
    try {
      const data = await fetchAssignments({ baseId })
      setAssignments(data)
    } catch (error) {
      console.error("Failed to load assignments:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("")

    if (!formData.equipment || !formData.quantity) {
      setErrorMessage("Please fill in all required fields")
      return
    }

    if (user?.role === "ADMIN" && !formData.baseId) {
      setErrorMessage("Please select a base")
      return
    }

    if (Number.parseInt(formData.quantity) <= 0) {
      setErrorMessage("Quantity must be greater than 0")
      return
    }

    setIsSubmitting(true)
    try {
      await addAssignment({
        baseId: formData.baseId,
        equipmentName: formData.equipment,
        quantity: Number.parseInt(formData.quantity),
        type: formData.type,
        personnelName: formData.personnelName || undefined,
        reason: formData.reason || undefined,
        date: formData.date,
      })

      loadAssignments()
      setFormData({
        baseId: user?.baseId || "",
        equipment: "",
        quantity: "",
        type: "ASSIGNED",
        personnelName: "",
        reason: "",
        date: new Date().toISOString().split("T")[0],
      })
      setShowForm(false)
      setSuccessMessage("Assignment added successfully!")
      setTimeout(() => setSuccessMessage(""), 3000)
    } catch (error) {
      console.error("Add assignment error:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to add assignment. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Assignments & Expenditures</h1>
              <p className="text-muted-foreground">Track assigned and expended equipment</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadAssignmentsPDF()}
                className="flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                Export PDF
              </Button>
              {canAddAssignments && (
                <Button onClick={() => setShowForm(!showForm)} size="sm">
                  {showForm ? "Cancel" : "Add Assignment"}
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
                        loadAssignments(e.target.value)
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
            <div className="p-4 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-md mb-6">
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-md mb-6">
              {errorMessage}
            </div>
          )}

          {showForm && canAddAssignments && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Add Assignment or Expenditure</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {["ADMIN", "LOGISTICS_OFFICER"].includes(user?.role || "") && (
                      <div>
                        <label className="text-sm font-medium">Base *</label>
                        <select
                          value={formData.baseId}
                          onChange={(e) => setFormData({ ...formData, baseId: e.target.value })}
                          className="w-full px-3 py-2 border border-input rounded-md mt-1 bg-background text-foreground"
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
                      <label className="text-sm font-medium">Equipment *</label>
                      <select
                        value={formData.equipment}
                        onChange={(e) => setFormData({ ...formData, equipment: e.target.value })}
                        className="w-full px-3 py-2 border border-input rounded-md mt-1 bg-background text-foreground"
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
                      <label className="text-sm font-medium">Quantity *</label>
                      <input
                        type="number"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        placeholder="0"
                        min="1"
                        className="w-full px-3 py-2 border border-input rounded-md mt-1 bg-background text-foreground"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Type *</label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as "ASSIGNED" | "EXPENDED" })}
                        className="w-full px-3 py-2 border border-input rounded-md mt-1 bg-background text-foreground"
                        required
                      >
                        <option value="ASSIGNED">Assigned</option>
                        <option value="EXPENDED">Expended</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Date *</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3 py-2 border border-input rounded-md mt-1 bg-background text-foreground"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Personnel Name</label>
                      <input
                        type="text"
                        value={formData.personnelName}
                        onChange={(e) => setFormData({ ...formData, personnelName: e.target.value })}
                        placeholder="Optional"
                        className="w-full px-3 py-2 border border-input rounded-md mt-1 bg-background text-foreground"
                        required={formData.type === "ASSIGNED"}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Reason</label>
                      <input
                        type="text"
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        placeholder="Optional"
                        className="w-full px-3 py-2 border border-input rounded-md mt-1 bg-background text-foreground"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add Assignment"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="text-center py-12">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading assignments...</p>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left font-medium">Equipment</th>
                        <th className="px-4 py-3 text-left font-medium">Quantity</th>
                        <th className="px-4 py-3 text-left font-medium">Type</th>
                        <th className="px-4 py-3 text-left font-medium">Personnel</th>
                        <th className="px-4 py-3 text-left font-medium">Reason</th>
                        <th className="px-4 py-3 text-left font-medium">Date</th>
                        <th className="px-4 py-3 text-left font-medium">Created By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignments.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                            No records found
                          </td>
                        </tr>
                      ) : (
                        assignments.map((assignment) => (
                          <tr key={assignment.id} className="border-b border-border hover:bg-muted/50">
                            <td className="px-4 py-3">{assignment.equipment.name}</td>
                            <td className="px-4 py-3 font-medium">{assignment.quantity}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-1 rounded-md text-xs font-medium ${assignment.type === "ASSIGNED"
                                  ? "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
                                  : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
                                  }`}
                              >
                                {assignment.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{assignment.personnelName || "—"}</td>
                            <td className="px-4 py-3 text-muted-foreground">{assignment.reason || "—"}</td>
                            <td className="px-4 py-3">{assignment.date}</td>
                            <td className="px-4 py-3 text-muted-foreground">{assignment.user.email}</td>
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
