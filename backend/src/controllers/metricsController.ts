import { Response } from "express"
import { AuthRequest } from "../middleware/auth"
import { prisma } from "../db"

export const getMetrics = async (req: AuthRequest, res: Response) => {
    try {
        const { fromDate, toDate, equipment, baseId } = req.query
        const user = req.user!

        // RBAC: Base Commander and Logistics Officer can only see their own base
        let targetBaseId = baseId as string
        if (user.role !== "ADMIN") {
            targetBaseId = user.baseId!
        }

        // Date filters
        const start = fromDate ? new Date(fromDate as string) : new Date(0) // Beginning of time
        const end = toDate ? new Date(toDate as string) : new Date() // Now

        // Base filter (optional for Admin, mandatory for others)
        const baseFilter = targetBaseId ? { OR: [{ baseId: targetBaseId }, { fromBaseId: targetBaseId }, { toBaseId: targetBaseId }] } : {}

        // Equipment filter
        const equipmentFilter = equipment ? { equipment: { name: equipment as string } } : {}

        // Helper to sum quantities
        const sumQuantity = async (model: any, where: any) => {
            const result = await model.aggregate({
                _sum: { quantity: true },
                where,
            })
            return result._sum.quantity || 0
        }

        // 1. Calculate Opening Balance (Movements before start date)
        // For Opening Balance, we need net inventory at 'start'.
        // Inventory = Purchases + TransfersIn - TransfersOut - Assignments - Expenditures

        // We need to filter by baseId specifically for inventory calculation
        const inventoryBaseFilter = targetBaseId ? { baseId: targetBaseId } : {}
        const transferInBaseFilter = targetBaseId ? { toBaseId: targetBaseId } : {}
        const transferOutBaseFilter = targetBaseId ? { fromBaseId: targetBaseId } : {}
        const assignmentBaseFilter = targetBaseId ? { user: { baseId: targetBaseId } } : {} // Assignments are linked to user, user linked to base

        // Note: Assignment/Expenditure linking to base is tricky via User. 
        // Schema: Assignment -> User -> Base.
        // If we filter by baseId, we need assignments done by users of that base.

        const prePurchases = await sumQuantity(prisma.purchase, {
            ...inventoryBaseFilter,
            ...equipmentFilter,
            date: { lt: start },
        })

        const preTransfersIn = await sumQuantity(prisma.transfer, {
            ...transferInBaseFilter,
            ...equipmentFilter,
            date: { lt: start },
            status: "COMPLETED",
        })

        const preTransfersOut = await sumQuantity(prisma.transfer, {
            ...transferOutBaseFilter,
            ...equipmentFilter,
            date: { lt: start },
            status: "COMPLETED",
        })

        // For assignments, we need to join with User to filter by base
        // Prisma aggregate doesn't support deep relation filtering easily in 'where' for some versions, 
        // but let's try standard relation filter.
        const preAssignments = await sumQuantity(prisma.assignment, {
            user: targetBaseId ? { baseId: targetBaseId } : undefined,
            ...equipmentFilter,
            date: { lt: start },
            type: "ASSIGNED",
        })

        const preExpenditures = await sumQuantity(prisma.assignment, {
            user: targetBaseId ? { baseId: targetBaseId } : undefined,
            ...equipmentFilter,
            date: { lt: start },
            type: "EXPENDED",
        })

        const openingBalance = prePurchases + preTransfersIn - preTransfersOut - preAssignments - preExpenditures

        // 2. Calculate Movements within range (start to end)
        const purchases = await sumQuantity(prisma.purchase, {
            ...inventoryBaseFilter,
            ...equipmentFilter,
            date: { gte: start, lte: end },
        })

        const transfersIn = await sumQuantity(prisma.transfer, {
            ...transferInBaseFilter,
            ...equipmentFilter,
            date: { gte: start, lte: end },
            status: "COMPLETED",
        })

        const transfersOut = await sumQuantity(prisma.transfer, {
            ...transferOutBaseFilter,
            ...equipmentFilter,
            date: { gte: start, lte: end },
            status: "COMPLETED",
        })

        const assigned = await sumQuantity(prisma.assignment, {
            user: targetBaseId ? { baseId: targetBaseId } : undefined,
            ...equipmentFilter,
            date: { gte: start, lte: end },
            type: "ASSIGNED",
        })

        const expended = await sumQuantity(prisma.assignment, {
            user: targetBaseId ? { baseId: targetBaseId } : undefined,
            ...equipmentFilter,
            date: { gte: start, lte: end },
            type: "EXPENDED",
        })

        const netMovement = purchases + transfersIn - transfersOut
        const closingBalance = openingBalance + netMovement - assigned - expended

        res.json({
            openingBalance,
            purchases,
            transfersIn,
            transfersOut,
            assigned,
            expended,
            closingBalance,
            netMovement,
        })

    } catch (error) {
        console.error("Metrics error:", error)
        res.status(500).json({ error: "Failed to calculate metrics" })
    }
}

