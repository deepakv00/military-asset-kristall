"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { fetchInventory, fetchBases, type InventoryItem, type Base } from "@/lib/api"

import { ProtectedRoute } from "@/components/protected-route"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function InventoryPage() {
    const { user } = useAuth()
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [bases, setBases] = useState<Base[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedBase, setSelectedBase] = useState("")

    const loadInventory = async () => {
        try {
            const data = await fetchInventory({ baseId: selectedBase || undefined })
            setInventory(data)
        } catch (error) {
            console.error("Failed to load inventory:", error)
        }
    }

    const loadData = async () => {
        setIsLoading(true)
        try {
            const [inventoryData, basesData] = await Promise.all([
                fetchInventory({ baseId: selectedBase || undefined }),
                fetchBases()
            ])
            setInventory(inventoryData)
            setBases(basesData)
        } catch (error) {
            console.error("Failed to load inventory:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (user) {
            loadData()
        }
    }, [user])

    const handleFilterApply = async () => {
        setIsLoading(true)
        try {
            const data = await fetchInventory({ baseId: selectedBase || undefined })
            setInventory(data)
        } catch (error) {
            console.error("Failed to load inventory:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const getLowStockAlert = (item: InventoryItem) => {
        if (item.quantity <= 5) return "critical"
        if (item.quantity <= 15) return "warning"
        return null
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="max-w-7xl mx-auto px-6 sm:px-8 py-10">
                    <div className="mb-8 flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-2">Stocks & Inventory</h1>
                            <p className="text-muted-foreground text-sm">Complete overview of your asset inventory with detailed metrics</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {inventory.filter(i => i.quantity <= 10).length > 0 && (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300">
                                    {inventory.filter(i => i.quantity <= 10).length} Low Stock
                                </span>
                            )}
                            <span className="text-sm text-muted-foreground">{inventory.length} Items</span>
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
                                            onChange={(e) => setSelectedBase(e.target.value)}
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
                                <Button onClick={handleFilterApply} size="sm" disabled={isLoading}>
                                    {isLoading ? "Loading..." : "Apply Filters"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Inventory Table */}
                    {isLoading ? (
                        <div className="text-center py-16">
                            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-muted-foreground text-sm">Loading inventory...</p>
                        </div>
                    ) : (
                        <Card className="border-border shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-base font-semibold">Inventory Data</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border bg-muted/30">
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground tracking-wide">Alert</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground tracking-wide">Asset</th>
                                                {user?.role === "ADMIN" && (
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-foreground tracking-wide">Base</th>
                                                )}
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground tracking-wide">Quantity</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground tracking-wide">Purchased</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground tracking-wide">Expended</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground tracking-wide">Assigned</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground tracking-wide">Transferred Out</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground tracking-wide">Transferred In</th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-foreground tracking-wide">Last Updated</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {inventory.length === 0 ? (
                                                <tr>
                                                    <td colSpan={user?.role === "ADMIN" ? 10 : 9} className="px-4 py-10 text-center text-muted-foreground text-sm">
                                                        No inventory found
                                                    </td>
                                                </tr>
                                            ) : (
                                                inventory.map((item) => {
                                                    const alert = getLowStockAlert(item)
                                                    return (
                                                        <tr key={item.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                                                            <td className="px-4 py-3">
                                                                {alert === "critical" && (
                                                                    <span className="inline-block w-2 h-2 rounded-full bg-red-500" title="Critical: Very low stock"></span>
                                                                )}
                                                                {alert === "warning" && (
                                                                    <span className="inline-block w-2 h-2 rounded-full bg-yellow-500" title="Warning: Low stock"></span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-3 font-medium">{item.equipment.name}</td>
                                                            {user?.role === "ADMIN" && (
                                                                <td className="px-4 py-3 text-muted-foreground">{item.base.name}</td>
                                                            )}
                                                            <td className="px-4 py-3">
                                                                <span className={`px-2.5 py-1 rounded-md text-xs font-medium tabular-nums ${item.quantity <= 5
                                                                    ? "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300"
                                                                    : item.quantity <= 15
                                                                        ? "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300"
                                                                        : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300"
                                                                    }`}>
                                                                    {item.quantity}
                                                                </span>
                                                            </td>
                                                            <td className="px-4 py-3 tabular-nums">{item.purchased}</td>
                                                            <td className="px-4 py-3 tabular-nums">{item.expended}</td>
                                                            <td className="px-4 py-3 tabular-nums">{item.assigned}</td>
                                                            <td className="px-4 py-3 tabular-nums">{item.transferredOut}</td>
                                                            <td className="px-4 py-3 tabular-nums">{item.transferredIn}</td>
                                                            <td className="px-4 py-3 text-muted-foreground text-xs">
                                                                {new Date(item.updatedAt).toLocaleDateString()}
                                                            </td>
                                                        </tr>
                                                    )
                                                })
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
