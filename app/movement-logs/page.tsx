"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { fetchMovementLogs, fetchBases, type MovementLog, type Base } from "@/lib/api"
import { ProtectedRoute } from "@/components/protected-route"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function MovementLogsPage() {
    const { user } = useAuth()
    const [logs, setLogs] = useState<MovementLog[]>([])
    const [bases, setBases] = useState<Base[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [filters, setFilters] = useState({
        baseId: "",
        actionType: "",
        fromDate: "",
        toDate: "",
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setIsLoading(true)
        try {
            const [logsData, basesData] = await Promise.all([
                fetchMovementLogs(),
                fetchBases()
            ])
            setLogs(logsData)
            setBases(basesData)
        } catch (error) {
            console.error("Failed to load movement logs:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleFilterApply = async () => {
        setIsLoading(true)
        try {
            const data = await fetchMovementLogs({
                baseId: filters.baseId || undefined,
                actionType: filters.actionType || undefined,
                fromDate: filters.fromDate || undefined,
                toDate: filters.toDate || undefined,
            })
            setLogs(data)
        } catch (error) {
            console.error("Failed to load movement logs:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const clearFilters = () => {
        setFilters({ baseId: "", actionType: "", fromDate: "", toDate: "" })
        loadData()
    }

    const getActionTypeColor = (actionType: string) => {
        switch (actionType) {
            case "PURCHASE":
                return "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300"
            case "TRANSFER":
                return "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300"
            case "ASSIGNMENT":
                return "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300"
            case "EXPENDITURE":
                return "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300"
            default:
                return "bg-gray-100 dark:bg-gray-900/40 text-gray-800 dark:text-gray-300"
        }
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="max-w-7xl mx-auto px-6 sm:px-8 py-10">
                    <div className="mb-8 flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-2">Movement Logs</h1>
                            <p className="text-muted-foreground text-sm">Complete history of all asset movements and transactions</p>
                        </div>
                        <span className="text-sm text-muted-foreground">{logs.length} Total Logs</span>
                    </div>

                    {/* Filters */}
                    <Card className="mb-8 border-border shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base font-semibold">Filters</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-4 items-end">
                                <div>
                                    <label className="text-xs font-medium text-foreground block mb-2">Action Type</label>
                                    <select
                                        value={filters.actionType}
                                        onChange={(e) => setFilters({ ...filters, actionType: e.target.value })}
                                        className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[150px]"
                                    >
                                        <option value="">All Types</option>
                                        <option value="PURCHASE">Purchase</option>
                                        <option value="TRANSFER">Transfer</option>
                                        <option value="ASSIGNMENT">Assignment</option>
                                        <option value="EXPENDITURE">Expenditure</option>
                                    </select>
                                </div>
                                {user?.role === "ADMIN" && (
                                    <div>
                                        <label className="text-xs font-medium text-foreground block mb-2">Base</label>
                                        <select
                                            value={filters.baseId}
                                            onChange={(e) => setFilters({ ...filters, baseId: e.target.value })}
                                            className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-w-[150px]"
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
                                <div>
                                    <label className="text-xs font-medium text-foreground block mb-2">From Date</label>
                                    <input
                                        type="date"
                                        value={filters.fromDate}
                                        onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
                                        className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-foreground block mb-2">To Date</label>
                                    <input
                                        type="date"
                                        value={filters.toDate}
                                        onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
                                        className="px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <Button onClick={handleFilterApply} size="sm" disabled={isLoading}>
                                    {isLoading ? "Loading..." : "Apply Filters"}
                                </Button>
                                <Button onClick={clearFilters} size="sm" variant="outline">
                                    Clear
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Logs Table */}
                    {isLoading ? (
                        <div className="text-center py-16">
                            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-muted-foreground text-sm">Loading movement logs...</p>
                        </div>
                    ) : (
                        <Card className="border-border shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-base font-semibold">Movement Logs</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border bg-muted/30">
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground tracking-wide">Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground tracking-wide">Action Type</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground tracking-wide">Asset</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground tracking-wide">Quantity</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground tracking-wide">Base</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground tracking-wide">Performed By</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground tracking-wide">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {logs.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground text-sm">
                                                        No movement logs found
                                                    </td>
                                                </tr>
                                            ) : (
                                                logs.map((log) => (
                                                    <tr key={`${log.actionType}-${log.id}`} className="border-b border-border hover:bg-muted/30 transition-colors">
                                                        <td className="px-4 py-3 text-muted-foreground">
                                                            <div>{new Date(log.date).toLocaleDateString()}</div>
                                                            <div className="text-xs">{new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${getActionTypeColor(log.actionType)}`}>
                                                                {log.actionType}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 font-medium">{log.equipment}</td>
                                                        <td className="px-4 py-3 tabular-nums">{log.quantity}</td>
                                                        <td className="px-4 py-3">{log.base}</td>
                                                        <td className="px-4 py-3 text-muted-foreground">{log.performedBy}</td>
                                                        <td className="px-4 py-3 text-muted-foreground max-w-xs truncate" title={log.remarks}>
                                                            {log.remarks || "—"}
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
