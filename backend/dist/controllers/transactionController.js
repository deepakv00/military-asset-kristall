"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAssignment = exports.getAssignments = exports.createTransfer = exports.getTransfers = exports.createPurchase = exports.getPurchases = void 0;
const db_1 = require("../db");
// --- Purchases ---
const getPurchases = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { baseId, equipment } = req.query;
        const user = req.user;
        const where = {};
        // RBAC: Logistics Officer can see all bases
        if (user.role === "BASE_COMMANDER") {
            where.baseId = user.baseId;
        }
        else if (user.role !== "ADMIN" && !baseId) {
            where.baseId = user.baseId;
        }
        else if (baseId) {
            where.baseId = baseId;
        }
        if (equipment) {
            where.equipment = { name: equipment };
        }
        const purchases = yield db_1.prisma.purchase.findMany({
            where,
            include: { base: true, equipment: true, user: true },
            orderBy: { date: "desc" },
        });
        res.json(purchases);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch purchases" });
    }
});
exports.getPurchases = getPurchases;
const createPurchase = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { baseId, equipmentName, quantity, date } = req.body;
        const user = req.user;
        // RBAC: Logistics Officer can purchase for any base as requested by user
        // Previously: if (user.role === "LOGISTICS_OFFICER" && baseId !== user.baseId)
        // Base Commander cannot purchase
        if (user.role === "BASE_COMMANDER") {
            return res.status(403).json({ error: "Base Commander cannot create purchases" });
        }
        yield db_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // 1. Find or create equipment
            let equipment = yield tx.equipment.findUnique({ where: { name: equipmentName } });
            if (!equipment) {
                equipment = yield tx.equipment.create({ data: { name: equipmentName } });
            }
            // 2. Create Purchase
            const purchase = yield tx.purchase.create({
                data: {
                    baseId,
                    userId: user.id,
                    equipmentId: equipment.id,
                    quantity: Number(quantity),
                    date: new Date(date),
                },
            });
            // 3. Update Inventory
            yield tx.inventory.upsert({
                where: { baseId_equipmentId: { baseId, equipmentId: equipment.id } },
                update: { quantity: { increment: Number(quantity) } },
                create: { baseId, equipmentId: equipment.id, quantity: Number(quantity) },
            });
            // 4. Audit Log
            yield tx.auditLog.create({
                data: {
                    action: "PURCHASE",
                    entity: "Purchase",
                    entityId: purchase.id,
                    userId: user.id,
                    details: `Purchased ${quantity} ${equipmentName} for base ${baseId}`,
                },
            });
            return purchase;
        }));
        res.status(201).json({ message: "Purchase created successfully" });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create purchase" });
    }
});
exports.createPurchase = createPurchase;
// --- Transfers ---
const getTransfers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { baseId, equipment } = req.query;
        const user = req.user;
        const where = {};
        // RBAC
        if (user.role !== "ADMIN") {
            where.OR = [{ fromBaseId: user.baseId }, { toBaseId: user.baseId }];
        }
        else if (baseId) {
            where.OR = [{ fromBaseId: baseId }, { toBaseId: baseId }];
        }
        if (equipment) {
            where.equipment = { name: equipment };
        }
        const transfers = yield db_1.prisma.transfer.findMany({
            where,
            include: { fromBase: true, toBase: true, equipment: true },
            orderBy: { date: "desc" },
        });
        res.json(transfers);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch transfers" });
    }
});
exports.getTransfers = getTransfers;
const createTransfer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fromBaseId, toBaseId, equipmentName, quantity, date } = req.body;
        const user = req.user;
        // RBAC
        if (user.role === "LOGISTICS_OFFICER" && fromBaseId !== user.baseId) {
            return res.status(403).json({ error: "Cannot transfer from another base" });
        }
        if (user.role === "BASE_COMMANDER") {
            return res.status(403).json({ error: "Base Commander cannot create transfers" });
        }
        yield db_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const equipment = yield tx.equipment.findUnique({ where: { name: equipmentName } });
            if (!equipment) {
                throw new Error("Equipment not found");
            }
            // Check source inventory
            const sourceInventory = yield tx.inventory.findUnique({
                where: { baseId_equipmentId: { baseId: fromBaseId, equipmentId: equipment.id } },
            });
            if (!sourceInventory || sourceInventory.quantity < Number(quantity)) {
                throw new Error("Insufficient inventory");
            }
            // Create Transfer
            const transfer = yield tx.transfer.create({
                data: {
                    fromBaseId,
                    toBaseId,
                    equipmentId: equipment.id,
                    quantity: Number(quantity),
                    date: new Date(date),
                    status: "COMPLETED",
                },
            });
            // Update Inventories
            yield tx.inventory.update({
                where: { baseId_equipmentId: { baseId: fromBaseId, equipmentId: equipment.id } },
                data: { quantity: { decrement: Number(quantity) } },
            });
            yield tx.inventory.upsert({
                where: { baseId_equipmentId: { baseId: toBaseId, equipmentId: equipment.id } },
                update: { quantity: { increment: Number(quantity) } },
                create: { baseId: toBaseId, equipmentId: equipment.id, quantity: Number(quantity) },
            });
            // Audit Log
            yield tx.auditLog.create({
                data: {
                    action: "TRANSFER",
                    entity: "Transfer",
                    entityId: transfer.id,
                    userId: user.id,
                    details: `Transferred ${quantity} ${equipmentName} from ${fromBaseId} to ${toBaseId}`,
                },
            });
        }));
        res.status(201).json({ message: "Transfer created successfully" });
    }
    catch (error) {
        res.status(400).json({ error: error.message || "Failed to create transfer" });
    }
});
exports.createTransfer = createTransfer;
// --- Assignments ---
const getAssignments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { baseId, equipment } = req.query;
        const user = req.user;
        const where = {};
        // RBAC: Filter by users belonging to the base
        if (user.role !== "ADMIN") {
            where.user = { baseId: user.baseId };
        }
        else if (baseId) {
            where.user = { baseId: baseId };
        }
        if (equipment) {
            where.equipment = { name: equipment };
        }
        const assignments = yield db_1.prisma.assignment.findMany({
            where,
            include: { equipment: true, user: true },
            orderBy: { date: "desc" },
        });
        res.json(assignments);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch assignments" });
    }
});
exports.getAssignments = getAssignments;
const createAssignment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { baseId, equipmentName, quantity, type, personnelName, reason, date } = req.body;
        const user = req.user;
        if (user.role === "BASE_COMMANDER") {
            return res.status(403).json({ error: "Base Commander cannot create assignments" });
        }
        const targetBaseId = user.baseId || baseId;
        if (!targetBaseId) {
            return res.status(400).json({ error: "Base is required" });
        }
        // RBAC: Logistics Officer can only assign for their base
        if (user.role === "LOGISTICS_OFFICER" && targetBaseId !== user.baseId) {
            return res.status(403).json({ error: "Cannot assign for another base" });
        }
        yield db_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const equipment = yield tx.equipment.findUnique({ where: { name: equipmentName } });
            if (!equipment) {
                throw new Error("Equipment not found");
            }
            // Check inventory
            const inventory = yield tx.inventory.findUnique({
                where: { baseId_equipmentId: { baseId: targetBaseId, equipmentId: equipment.id } },
            });
            if (!inventory || inventory.quantity < Number(quantity)) {
                throw new Error("Insufficient inventory");
            }
            // Create Assignment
            const assignment = yield tx.assignment.create({
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
            });
            // Update Inventory
            yield tx.inventory.update({
                where: { baseId_equipmentId: { baseId: targetBaseId, equipmentId: equipment.id } },
                data: { quantity: { decrement: Number(quantity) } },
            });
            // Audit Log
            yield tx.auditLog.create({
                data: {
                    action: type,
                    entity: "Assignment",
                    entityId: assignment.id,
                    userId: user.id,
                    details: `${type} ${quantity} ${equipmentName}. Reason: ${reason}`,
                },
            });
        }));
        res.status(201).json({ message: "Assignment created successfully" });
    }
    catch (error) {
        res.status(400).json({ error: error.message || "Failed to create assignment" });
    }
});
exports.createAssignment = createAssignment;
