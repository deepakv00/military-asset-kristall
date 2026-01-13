import { Response } from "express"
import { AuthRequest } from "../middleware/auth"
import { prisma } from "../db"

export const getInventory = async (req: AuthRequest, res: Response) => {
    try {
        const { baseId } = req.query
        const user = req.user!

        const where: any = {}

        // RBAC: Base Commander can only see their own base. Logistics Officer can see all bases.
        if (user.role === "BASE_COMMANDER") {
            where.baseId = user.baseId
        } else if (user.role !== "ADMIN" && !baseId) {
            where.baseId = user.baseId
        } else if (baseId) {
            where.baseId = baseId as string
        }

        // 1. Fetch all inventory items
        const inventory = await prisma.inventory.findMany({
            where,
            include: {
                base: true,
                equipment: true,
            },
            orderBy: [
                { base: { name: "asc" } },
                { equipment: { name: "asc" } },
            ],
        })

        if (inventory.length === 0) {
            return res.json([])
        }

        // 2. Fetch aggregated metrics in bulk using groupBy
        const [purchaseSums, transferInSums, transferOutSums, assignmentSums] = await Promise.all([
            prisma.purchase.groupBy({
                by: ["baseId", "equipmentId"],
                _sum: { quantity: true },
            }),
            prisma.transfer.groupBy({
                by: ["toBaseId", "equipmentId"],
                where: { status: "COMPLETED" },
                _sum: { quantity: true },
            }),
            prisma.transfer.groupBy({
                by: ["fromBaseId", "equipmentId"],
                where: { status: "COMPLETED" },
                _sum: { quantity: true },
            }),
            prisma.assignment.groupBy({
                by: ["baseId", "equipmentId", "type"],
                _sum: { quantity: true },
            }),
        ])

        // 3. Create lookup maps for quick access
        const purchaseMap = new Map(purchaseSums.map(s => [`${s.baseId}-${s.equipmentId}`, s._sum.quantity || 0]))
        const transferInMap = new Map(transferInSums.map(s => [`${s.toBaseId}-${s.equipmentId}`, s._sum.quantity || 0]))
        const transferOutMap = new Map(transferOutSums.map(s => [`${s.fromBaseId}-${s.equipmentId}`, s._sum.quantity || 0]))

        const assignedMap = new Map()
        const expendedMap = new Map()
        assignmentSums.forEach(s => {
            const key = `${s.baseId}-${s.equipmentId}`
            if (s.type === "ASSIGNED") assignedMap.set(key, s._sum.quantity || 0)
            if (s.type === "EXPENDED") expendedMap.set(key, s._sum.quantity || 0)
        })

        // 4. Enrich inventory items with metrics
        const enrichedInventory = inventory.map((item) => {
            const key = `${item.baseId}-${item.equipmentId}`
            return {
                id: item.id,
                base: item.base,
                equipment: item.equipment,
                quantity: item.quantity,
                purchased: purchaseMap.get(key) || 0,
                transferredIn: transferInMap.get(key) || 0,
                transferredOut: transferOutMap.get(key) || 0,
                assigned: assignedMap.get(key) || 0,
                expended: expendedMap.get(key) || 0,
                updatedAt: item.updatedAt,
            }
        })

        res.json(enrichedInventory)
    } catch (error) {
        console.error("Failed to fetch inventory:", error)
        res.status(500).json({ error: "Failed to fetch inventory" })
    }
}

export const getMovementLogs = async (req: AuthRequest, res: Response) => {
    try {
        const { baseId, actionType, fromDate, toDate } = req.query
        const user = req.user!

        // Fetch all movement types and combine them
        const movements: any[] = []

        // Build base filter for RBAC: Logistics Officer can see all bases
        const baseFilter = (user.role === "ADMIN" || user.role === "LOGISTICS_OFFICER")
            ? (baseId ? { baseId: baseId as string } : {})
            : { baseId: user.baseId }

        // Date filter
        const dateFilter: any = {}
        if (fromDate) dateFilter.gte = new Date(fromDate as string)
        if (toDate) dateFilter.lte = new Date(toDate as string)
        const dateWhere = Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}

        // Purchases
        if (!actionType || actionType === "PURCHASE") {
            const purchases = await prisma.purchase.findMany({
                where: { ...baseFilter, ...dateWhere },
                include: { base: true, equipment: true, user: true },
                orderBy: { date: "desc" },
            })
            purchases.forEach((p) => {
                movements.push({
                    id: p.id,
                    date: p.date,
                    actionType: "PURCHASE",
                    equipment: p.equipment.name,
                    quantity: p.quantity,
                    base: p.base.name,
                    performedBy: p.user.name || p.user.email,
                    remarks: `Purchased ${p.quantity} ${p.equipment.name}`,
                })
            })
        }

        // Transfers
        if (!actionType || actionType === "TRANSFER") {
            const baseIdStr = baseId as string | undefined
            const transferWhere: any = user.role === "ADMIN"
                ? (baseIdStr ? { OR: [{ fromBaseId: baseIdStr }, { toBaseId: baseIdStr }] } : {})
                : { OR: [{ fromBaseId: user.baseId }, { toBaseId: user.baseId }] }

            const transfers = await prisma.transfer.findMany({
                where: { ...transferWhere, ...dateWhere },
                include: { fromBase: true, toBase: true, equipment: true },
                orderBy: { date: "desc" },
            })
            transfers.forEach((t) => {
                movements.push({
                    id: t.id,
                    date: t.date,
                    actionType: "TRANSFER",
                    equipment: t.equipment.name,
                    quantity: t.quantity,
                    base: `${t.fromBase.name} → ${t.toBase.name}`,
                    performedBy: "System",
                    remarks: `Transferred to ${t.toBase.name}`,
                })
            })
        }

        // Assignments
        if (!actionType || actionType === "ASSIGNMENT") {
            const assignmentWhere = user.role === "ADMIN"
                ? (baseId ? { user: { baseId: baseId as string } } : {})
                : { user: { baseId: user.baseId } }

            const assignments = await prisma.assignment.findMany({
                where: { ...assignmentWhere, ...dateWhere, type: "ASSIGNED" },
                include: { equipment: true, user: true },
                orderBy: { date: "desc" },
            })
            assignments.forEach((a) => {
                movements.push({
                    id: a.id,
                    date: a.date,
                    actionType: "ASSIGNMENT",
                    equipment: a.equipment.name,
                    quantity: a.quantity,
                    base: a.user.name || a.user.email,
                    performedBy: a.user.name || a.user.email,
                    remarks: a.personnelName ? `Assigned to ${a.personnelName}` : (a.reason || ""),
                })
            })
        }

        // Expenditures
        if (!actionType || actionType === "EXPENDITURE") {
            const expenditureWhere = user.role === "ADMIN"
                ? (baseId ? { user: { baseId: baseId as string } } : {})
                : { user: { baseId: user.baseId } }

            const expenditures = await prisma.assignment.findMany({
                where: { ...expenditureWhere, ...dateWhere, type: "EXPENDED" },
                include: { equipment: true, user: true },
                orderBy: { date: "desc" },
            })
            expenditures.forEach((e) => {
                movements.push({
                    id: e.id,
                    date: e.date,
                    actionType: "EXPENDITURE",
                    equipment: e.equipment.name,
                    quantity: e.quantity,
                    base: e.user.name || e.user.email,
                    performedBy: e.user.name || e.user.email,
                    remarks: e.reason || "",
                })
            })
        }

        // Sort by date descending
        movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        res.json(movements)
    } catch (error) {
        console.error("Failed to fetch movement logs:", error)
        res.status(500).json({ error: "Failed to fetch movement logs" })
    }
}
