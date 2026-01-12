export interface MetricsData {
    openingBalance: number
    purchases: number
    transfersIn: number
    transfersOut: number
    assigned: number
    expended: number
    closingBalance: number
    netMovement: number
}



export interface Purchase {
    id: string
    baseId: string
    base: { name: string }
    equipment: { name: string }
    quantity: number
    date: string
    user: { email: string }
}

export interface Transfer {
    id: string
    fromBaseId: string
    toBaseId: string
    fromBase: { name: string }
    toBase: { name: string }
    equipment: { name: string }
    quantity: number
    date: string
    status: "PENDING" | "COMPLETED" | "REJECTED"
}

export interface Assignment {
    id: string
    equipment: { name: string }
    quantity: number
    type: "ASSIGNED" | "EXPENDED"
    personnelName?: string
    reason?: string
    date: string
    user: { email: string }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

const getHeaders = () => {
    const token = localStorage.getItem("token")
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    }
}

export async function fetchMetrics(filters: {
    fromDate?: string
    toDate?: string
    equipment?: string
    baseId?: string
}): Promise<MetricsData> {
    const params = new URLSearchParams()
    if (filters.fromDate) params.append("fromDate", filters.fromDate)
    if (filters.toDate) params.append("toDate", filters.toDate)
    if (filters.equipment) params.append("equipment", filters.equipment)
    if (filters.baseId) params.append("baseId", filters.baseId)

    const res = await fetch(`${API_URL}/metrics?${params.toString()}`, {
        headers: getHeaders(),
    })

    if (!res.ok) throw new Error("Failed to fetch metrics")
    return res.json()
}



export async function fetchPurchases(filters?: { baseId?: string; equipment?: string }): Promise<Purchase[]> {
    const params = new URLSearchParams()
    if (filters?.baseId) params.append("baseId", filters.baseId)
    if (filters?.equipment) params.append("equipment", filters.equipment)

    const res = await fetch(`${API_URL}/api/purchases?${params.toString()}`, {
        headers: getHeaders(),
    })
    if (!res.ok) throw new Error("Failed to fetch purchases")
    return res.json()
}

export async function addPurchase(purchase: {
    baseId: string
    equipmentName: string
    quantity: number
    date: string
}): Promise<void> {
    const res = await fetch(`${API_URL}/api/purchases`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(purchase),
    })
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create purchase")
    }
}

export async function fetchTransfers(filters?: { baseId?: string; equipment?: string }): Promise<Transfer[]> {
    const params = new URLSearchParams()
    if (filters?.baseId) params.append("baseId", filters.baseId)
    if (filters?.equipment) params.append("equipment", filters.equipment)

    const res = await fetch(`${API_URL}/api/transfers?${params.toString()}`, {
        headers: getHeaders(),
    })
    if (!res.ok) throw new Error("Failed to fetch transfers")
    return res.json()
}

export async function addTransfer(transfer: {
    fromBaseId: string
    toBaseId: string
    equipmentName: string
    quantity: number
    date: string
}): Promise<void> {
    const res = await fetch(`${API_URL}/api/transfers`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(transfer),
    })
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create transfer")
    }
}

export async function fetchAssignments(filters?: { baseId?: string; equipment?: string }): Promise<Assignment[]> {
    const params = new URLSearchParams()
    if (filters?.baseId) params.append("baseId", filters.baseId)
    if (filters?.equipment) params.append("equipment", filters.equipment)

    const res = await fetch(`${API_URL}/api/assignments?${params.toString()}`, {
        headers: getHeaders(),
    })
    if (!res.ok) throw new Error("Failed to fetch assignments")
    return res.json()
}

export async function addAssignment(assignment: {
    baseId?: string
    equipmentName: string
    quantity: number
    type: "ASSIGNED" | "EXPENDED"
    personnelName?: string
    reason?: string
    date: string
}): Promise<void> {
    const res = await fetch(`${API_URL}/api/assignments`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(assignment),
    })
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create assignment")
    }
}

export interface Base {
    id: string
    name: string
    location?: string
}

export async function fetchBases(): Promise<Base[]> {
    const res = await fetch(`${API_URL}/api/bases`, {
        headers: getHeaders(),
    })
    if (!res.ok) throw new Error("Failed to fetch bases")
    return res.json()
}

export const equipmentOptions = [
    "Rifles",
    "Ammunition",
    "Body Armor",
    "Helmets",
    "Tactical Vests",
    "Medical Supplies",
    "Vehicles",
]

export interface InventoryItem {
    id: string
    base: { id: string; name: string }
    equipment: { id: string; name: string }
    quantity: number
    purchased: number
    transferredIn: number
    transferredOut: number
    assigned: number
    expended: number
    updatedAt: string
}

export interface MovementLog {
    id: string
    date: string
    actionType: "PURCHASE" | "TRANSFER" | "ASSIGNMENT" | "EXPENDITURE"
    equipment: string
    quantity: number
    base: string
    performedBy: string
    remarks: string
}

export async function fetchInventory(filters?: { baseId?: string }): Promise<InventoryItem[]> {
    const params = new URLSearchParams()
    if (filters?.baseId) params.append("baseId", filters.baseId)

    const res = await fetch(`${API_URL}/api/inventory?${params.toString()}`, {
        headers: getHeaders(),
    })
    if (!res.ok) throw new Error("Failed to fetch inventory")
    return res.json()
}

export async function fetchMovementLogs(filters?: {
    baseId?: string
    actionType?: string
    fromDate?: string
    toDate?: string
}): Promise<MovementLog[]> {
    const params = new URLSearchParams()
    if (filters?.baseId) params.append("baseId", filters.baseId)
    if (filters?.actionType) params.append("actionType", filters.actionType)
    if (filters?.fromDate) params.append("fromDate", filters.fromDate)
    if (filters?.toDate) params.append("toDate", filters.toDate)

    const res = await fetch(`${API_URL}/api/movement-logs?${params.toString()}`, {
        headers: getHeaders(),
    })
    if (!res.ok) throw new Error("Failed to fetch movement logs")
    return res.json()
}

// User Management
export interface User {
    id: string
    email: string
    name?: string
    role: "ADMIN" | "BASE_COMMANDER" | "LOGISTICS_OFFICER"
    baseId?: string
    base?: { id: string; name: string }
    createdAt: string
    updatedAt?: string
}

export async function fetchUsers(): Promise<User[]> {
    const res = await fetch(`${API_URL}/api/users`, {
        headers: getHeaders(),
    })
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to fetch users")
    }
    return res.json()
}

export async function createUserApi(user: {
    email: string
    password: string
    name?: string
    role: string
    baseId?: string
}): Promise<User> {
    const res = await fetch(`${API_URL}/api/users`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(user),
    })
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to create user")
    }
    return res.json()
}

export async function updateUserApi(
    id: string,
    user: {
        email?: string
        password?: string
        name?: string
        role?: string
        baseId?: string
    }
): Promise<User> {
    const res = await fetch(`${API_URL}/api/users/${id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(user),
    })
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to update user")
    }
    return res.json()
}

export async function deleteUserApi(id: string): Promise<void> {
    const res = await fetch(`${API_URL}/api/users/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
    })
    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to delete user")
    }
}

// Reports
export async function downloadPurchasesPDF(filters?: { baseId?: string; fromDate?: string; toDate?: string }) {
    const params = new URLSearchParams()
    if (filters?.baseId) params.append("baseId", filters.baseId)
    if (filters?.fromDate) params.append("fromDate", filters.fromDate)
    if (filters?.toDate) params.append("toDate", filters.toDate)

    const res = await fetch(`${API_URL}/api/reports/purchases/pdf?${params.toString()}`, {
        headers: getHeaders(),
    })
    if (!res.ok) throw new Error("Failed to generate PDF")

    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `purchases_report_${new Date().toISOString().split("T")[0]}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
}

export async function downloadTransfersExcel(filters?: { baseId?: string; fromDate?: string; toDate?: string }) {
    const params = new URLSearchParams()
    if (filters?.baseId) params.append("baseId", filters.baseId)
    if (filters?.fromDate) params.append("fromDate", filters.fromDate)
    if (filters?.toDate) params.append("toDate", filters.toDate)

    const res = await fetch(`${API_URL}/api/reports/transfers/excel?${params.toString()}`, {
        headers: getHeaders(),
    })
    if (!res.ok) throw new Error("Failed to generate Excel")

    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transfers_report_${new Date().toISOString().split("T")[0]}.xlsx`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
}

export async function downloadAssignmentsPDF(filters?: { baseId?: string; fromDate?: string; toDate?: string }) {
    const params = new URLSearchParams()
    if (filters?.baseId) params.append("baseId", filters.baseId)
    if (filters?.fromDate) params.append("fromDate", filters.fromDate)
    if (filters?.toDate) params.append("toDate", filters.toDate)

    const res = await fetch(`${API_URL}/api/reports/assignments/pdf?${params.toString()}`, {
        headers: getHeaders(),
    })
    if (!res.ok) throw new Error("Failed to generate PDF")

    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `assignments_report_${new Date().toISOString().split("T")[0]}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
}

