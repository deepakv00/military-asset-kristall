"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { fetchMetrics, fetchBases, equipmentOptions, type MetricsData, type Base } from "@/lib/api"
import { ProtectedRoute } from "@/components/protected-route"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { user } = useAuth()
  const [metrics, setMetrics] = useState<MetricsData | null>(null)
  const [bases, setBases] = useState<Base[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [filters, setFilters] = useState({
    fromDate: "",
    toDate: "",
    equipment: "",
    baseId: user?.baseId || "",
  })

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [metricsData, basesData] = await Promise.all([
        fetchMetrics({
          fromDate: filters.fromDate || undefined,
          toDate: filters.toDate || undefined,
          equipment: filters.equipment || undefined,
          baseId: filters.baseId || undefined,
        }),
        fetchBases()
      ])
      setMetrics(metricsData)
      setBases(basesData)
    } catch (error) {
      console.error("Failed to load dashboard data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      if (user.baseId && !filters.baseId) {
        setFilters(prev => ({ ...prev, baseId: user.baseId! }))
      }
      loadData()
    }
  }, [user])

  const handleFilterApply = () => {
    loadData()
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 sm:px-8 py-10">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Asset status summary and overview</p>
          </div>

          {/* Filters Card */}
          <Card className="mb-8 border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-2">From Date</label>
                  <input
                    type="date"
                    value={filters.fromDate}
                    onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-2">To Date</label>
                  <input
                    type="date"
                    value={filters.toDate}
                    onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-2">Equipment</label>
                  <select
                    value={filters.equipment}
                    onChange={(e) => setFilters({ ...filters, equipment: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">All Equipment</option>
                    {equipmentOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-2">Base</label>
                  <select
                    value={filters.baseId}
                    onChange={(e) => setFilters({ ...filters, baseId: e.target.value })}
                    disabled={!["ADMIN", "LOGISTICS_OFFICER"].includes(user?.role || "")}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
                  >
                    <option value="">All Bases</option>
                    {bases.map((base) => (
                      <option key={base.id} value={base.id}>{base.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4">
                <Button onClick={handleFilterApply} size="sm" disabled={isLoading}>
                  {isLoading ? "Loading..." : "Apply Filters"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
              title="Opening Balance"
              value={metrics?.openingBalance || 0}
            />
            <MetricCard
              title="Purchases"
              value={metrics?.purchases || 0}
              variant="success"
            />
            <MetricCard
              title="Transfers In"
              value={metrics?.transfersIn || 0}
              variant="success"
            />
            <MetricCard
              title="Transfers Out"
              value={metrics?.transfersOut || 0}
              variant="danger"
            />
            <MetricCard
              title="Assigned"
              value={metrics?.assigned || 0}
            />
            <MetricCard
              title="Expended"
              value={metrics?.expended || 0}
              variant="danger"
            />
            <MetricCard
              title="Closing Balance"
              value={metrics?.closingBalance || 0}
            />
            <MetricCard
              title="Net Movement"
              value={metrics?.netMovement || 0}
              variant="success"
            />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  )
}

function MetricCard({
  title,
  value,
  variant = "default"
}: {
  title: string,
  value: number,
  variant?: "default" | "success" | "danger"
}) {
  const variants = {
    default: "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100",
    success: "bg-[#f0fdf4] dark:bg-emerald-950/20 border-[#dcfce7] dark:border-emerald-900/30 text-[#166534] dark:text-emerald-400",
    danger: "bg-[#fef2f2] dark:bg-red-950/20 border-[#fee2e2] dark:border-red-900/30 text-[#991b1b] dark:text-red-400"
  }

  return (
    <Card className={`border shadow-sm transition-all duration-200 ${variants[variant]}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider opacity-80">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tabular-nums">
          {value.toLocaleString()}
        </div>
      </CardContent>
    </Card>
  )
}
