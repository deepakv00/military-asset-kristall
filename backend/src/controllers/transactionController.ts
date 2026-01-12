import { Response } from "express"
import { AuthRequest } from "../middleware/auth"
import { prisma } from "../db"

// --- Purchases ---

export const getPurchases = async (req: AuthRequest, res: Response) => {
    try {
        const { baseId, equipment } = req.query
        const user = req.user!

        const where: any = {}

        // RBAC
        if (user.role !== "ADMIN") {
            where.baseId = user.baseId
        } else if (baseId) {
            where.baseId = baseId as string
        }

        if (equipment) {
            where.equipment = { name: equipment as string }
        }

        const purchases = await prisma.purchase.findMany({
            where,
            include: { base: true, equipment: true, user: true },
            orderBy: { date: "desc" },
        })

        res.json(purchases)
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch purchases" })
    }
}

export const createPurchase = async (req: AuthRequest, res: Response) => {
    try {
        const { baseId, equipmentName, quantity, date } = req.body
        const user = req.user!

        // RBAC: Logistics Officer can only purchase for their base
        if (user.role === "LOGISTICS_OFFICER" && baseId !== user.baseId) {
            return res.status(403).json({ error: "Cannot purchase for another base" })
        }

        // Base Commander cannot purchase
        if (user.role === "BASE_COMMANDER") {
            return res.status(403).json({ error: "Base Commander cannot create purchases" })
        }

        await prisma.$transaction(async (tx) => {
            // 1. Find or create equipment
            let equipment = await tx.equipment.findUnique({ where: { name: equipmentName } })
            if (!equipment) {
                equipment = await tx.equipment.create({ data: { name: equipmentName } })
            }

            // 2. Create Purchase
            const purchase = await tx.purchase.create({
                data: {
                    baseId,
                    userId: user.id,
                    equipmentId: equipment.id,
                    quantity: Number(quantity),
                    date: new Date(date),
                },
            })

            // 3. Update Inventory
            await tx.inventory.upsert({
                where: { baseId_equipmentId: { baseId, equipmentId: equipment.id } },
                update: { quantity: { increment: Number(quantity) } },
                create: { baseId, equipmentId: equipment.id, quantity: Number(quantity) },
            })

            // 4. Audit Log
            await tx.auditLog.create({
                data: {
                    action: "PURCHASE",
                    entity: "Purchase",
                    entityId: purchase.id,
                    userId: user.id,
                    details: `Purchased ${quantity} ${equipmentName} for base ${baseId}`,
                },
            })

            return purchase
        })


        res.status(201).json({ message: "Purchase created successfully" })
    } catch (error) {
        console.error(error)
        res.status(500).json({ error: "Failed to create purchase" })
    }
}

// --- Transfers ---

export const getTransfers = async (req: AuthRequest, res: Response) => {
    try {
        const { baseId, equipment } = req.query
        const user = req.user!

        const where: any = {}

        // RBAC
        if (user.role !== "ADMIN") {
            where.OR = [{ fromBaseId: user.baseId }, { toBaseId: user.baseId }]
        } else if (baseId) {
            where.OR = [{ fromBaseId: baseId }, { toBaseId: baseId }]
        }

        if (equipment) {
            where.equipment = { name: equipment as string }
        }

        const transfers = await prisma.transfer.findMany({
            where,
            include: { fromBase: true, toBase: true, equipment: true },
            orderBy: { date: "desc" },
        })

        res.json(transfers)
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch transfers" })
    }
}

export const createTransfer = async (req: AuthRequest, res: Response) => {
    try {
        const { fromBaseId, toBaseId, equipmentName, quantity, date } = req.body
        const user = req.user!

        // RBAC
        if (user.role === "LOGISTICS_OFFICER" && fromBaseId !== user.baseId) {
            return res.status(403).json({ error: "Cannot transfer from another base" })
        }
        if (user.role === "BASE_COMMANDER") {
            return res.status(403).json({ error: "Base Commander cannot create transfers" })
        }

        await prisma.$transaction(async (tx) => {
            const equipment = await tx.equipment.findUnique({ where: { name: equipmentName } })
            if (!equipment) {
                throw new Error("Equipment not found")
            }

            // Check source inventory
            const sourceInventory = await tx.inventory.findUnique({
                where: { baseId_equipmentId: { baseId: fromBaseId, equipmentId: equipment.id } },
            })

            if (!sourceInventory || sourceInventory.quantity < Number(quantity)) {
                throw new Error("Insufficient inventory")
            }

            // Create Transfer
            const transfer = await tx.transfer.create({
                data: {
                    fromBaseId,
                    toBaseId,
                    equipmentId: equipment.id,
                    quantity: Number(quantity),
                    date: new Date(date),
                    status: "COMPLETED",
                },
            })

            // Update Inventories
            await tx.inventory.update({
                where: { baseId_equipmentId: { baseId: fromBaseId, equipmentId: equipment.id } },
                data: { quantity: { decrement: Number(quantity) } },
            })

            await tx.inventory.upsert({
                where: { baseId_equipmentId: { baseId: toBaseId, equipmentId: equipment.id } },
                update: { quantity: { increment: Number(quantity) } },
                create: { baseId: toBaseId, equipmentId: equipment.id, quantity: Number(quantity) },
            })

            // Audit Log
            await tx.auditLog.create({
                data: {
                    action: "TRANSFER",
                    entity: "Transfer",
                    entityId: transfer.id,
                    userId: user.id,
                    details: `Transferred ${quantity} ${equipmentName} from ${fromBaseId} to ${toBaseId}`,
                },
            })
        })


        res.status(201).json({ message: "Transfer created successfully" })
    } catch (error: any) {
        res.status(400).json({ error: error.message || "Failed to create transfer" })
    }
}

// --- Assignments ---

export const getAssignments = async (req: AuthRequest, res: Response) => {
    try {
        const { baseId, equipment } = req.query
        const user = req.user!

        const where: any = {}

        // RBAC: Filter by users belonging to the base
        if (user.role !== "ADMIN") {
            where.user = { baseId: user.baseId }
        } else if (baseId) {
            where.user = { baseId: baseId as string }
        }

        if (equipment) {
            where.equipment = { name: equipment as string }
        }

        const assignments = await prisma.assignment.findMany({
            where,
            include: { equipment: true, user: true },
            orderBy: { date: "desc" },
        })

        res.json(assignments)
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch assignments" })
    }
}

export const createAssignment = async (req: AuthRequest, res: Response) => {
    try {
        const { baseId, equipmentName, quantity, type, personnelName, reason, date } = req.body
        const user = req.user!

        if (user.role === "BASE_COMMANDER") {
            return res.status(403).json({ error: "Base Commander cannot create assignments" })
        }

        const targetBaseId = user.baseId || baseId
        if (!targetBaseId) {
            return res.status(400).json({ error: "Base is required" })
        }

        // RBAC: Logistics Officer can only assign for their base
        if (user.role === "LOGISTICS_OFFICER" && targetBaseId !== user.baseId) {
            return res.status(403).json({ error: "Cannot assign for another base" })
        }

        await prisma.$transaction(async (tx) => {
            const equipment = await tx.equipment.findUnique({ where: { name: equipmentName } })
            if (!equipment) {
                throw new Error("Equipment not found")
            }

            // Check inventory
            const inventory = await tx.inventory.findUnique({
                where: { baseId_equipmentId: { baseId: targetBaseId, equipmentId: equipment.id } },
            })

            if (!inventory || inventory.quantity < Number(quantity)) {
                throw new Error("Insufficient inventory")
            }

            // Create Assignment
            const assignment = await tx.assignment.create({
                data: {
                    userId: user.id,
                    baseId: targetBaseId,
                    equipmentId: equipment.id,
                    quantity: Number(quantity),
                    type, // ASSIGNED or EXPENDED
                    personnelName,
                    reason,
                    date: new Date(date),
                },
            })

            // Update Inventory
            await tx.inventory.update({
                where: { baseId_equipmentId: { baseId: targetBaseId, equipmentId: equipment.id } },
                data: { quantity: { decrement: Number(quantity) } },
            })

            // Audit Log
            await tx.auditLog.create({
                data: {
                    action: type,
                    entity: "Assignment",
                    entityId: assignment.id,
                    userId: user.id,
                    details: `${type} ${quantity} ${equipmentName}. Reason: ${reason}`,
                },
            })
        })


        res.status(201).json({ message: "Assignment created successfully" })
    } catch (error: any) {
        res.status(400).json({ error: error.message || "Failed to create assignment" })
    }
}
