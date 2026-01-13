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
exports.getMetrics = void 0;
const db_1 = require("../db");
const getMetrics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { fromDate, toDate, equipment, baseId } = req.query;
        const user = req.user;
        // RBAC: Base Commander can only see their own base. Logistics Officer can see all bases.
        let targetBaseId = baseId;
        if (user.role === "BASE_COMMANDER") {
            targetBaseId = user.baseId;
        }
        else if (user.role !== "ADMIN" && !targetBaseId) {
            targetBaseId = user.baseId;
        }
        // Date filters
        const start = fromDate ? new Date(fromDate) : new Date(0); // Beginning of time
        const end = toDate ? new Date(toDate) : new Date(); // Now
        // Base filter (optional for Admin, mandatory for others)
        const baseFilter = targetBaseId ? { OR: [{ baseId: targetBaseId }, { fromBaseId: targetBaseId }, { toBaseId: targetBaseId }] } : {};
        // Equipment filter
        const equipmentFilter = equipment ? { equipment: { name: equipment } } : {};
        // Helper to sum quantities
        const sumQuantity = (model, where) => __awaiter(void 0, void 0, void 0, function* () {
            const result = yield model.aggregate({
                _sum: { quantity: true },
                where,
            });
            return result._sum.quantity || 0;
        });
        // 1. Calculate Opening Balance (Movements before start date)
        // For Opening Balance, we need net inventory at 'start'.
        // Inventory = Purchases + TransfersIn - TransfersOut - Assignments - Expenditures
        // We need to filter by baseId specifically for inventory calculation
        const inventoryBaseFilter = targetBaseId ? { baseId: targetBaseId } : {};
        const transferInBaseFilter = targetBaseId ? { toBaseId: targetBaseId } : {};
        const transferOutBaseFilter = targetBaseId ? { fromBaseId: targetBaseId } : {};
        const assignmentBaseFilter = targetBaseId ? { user: { baseId: targetBaseId } } : {}; // Assignments are linked to user, user linked to base
        // Note: Assignment/Expenditure linking to base is tricky via User. 
        // Schema: Assignment -> User -> Base.
        // If we filter by baseId, we need assignments done by users of that base.
        const prePurchases = yield sumQuantity(db_1.prisma.purchase, Object.assign(Object.assign(Object.assign({}, inventoryBaseFilter), equipmentFilter), { date: { lt: start } }));
        const preTransfersIn = yield sumQuantity(db_1.prisma.transfer, Object.assign(Object.assign(Object.assign({}, transferInBaseFilter), equipmentFilter), { date: { lt: start }, status: "COMPLETED" }));
        const preTransfersOut = yield sumQuantity(db_1.prisma.transfer, Object.assign(Object.assign(Object.assign({}, transferOutBaseFilter), equipmentFilter), { date: { lt: start }, status: "COMPLETED" }));
        // For assignments, we need to join with User to filter by base
        // Prisma aggregate doesn't support deep relation filtering easily in 'where' for some versions, 
        // but let's try standard relation filter.
        const preAssignments = yield sumQuantity(db_1.prisma.assignment, Object.assign(Object.assign({ user: targetBaseId ? { baseId: targetBaseId } : undefined }, equipmentFilter), { date: { lt: start }, type: "ASSIGNED" }));
        const preExpenditures = yield sumQuantity(db_1.prisma.assignment, Object.assign(Object.assign({ user: targetBaseId ? { baseId: targetBaseId } : undefined }, equipmentFilter), { date: { lt: start }, type: "EXPENDED" }));
        const openingBalance = prePurchases + preTransfersIn - preTransfersOut - preAssignments - preExpenditures;
        // 2. Calculate Movements within range (start to end)
        const purchases = yield sumQuantity(db_1.prisma.purchase, Object.assign(Object.assign(Object.assign({}, inventoryBaseFilter), equipmentFilter), { date: { gte: start, lte: end } }));
        const transfersIn = yield sumQuantity(db_1.prisma.transfer, Object.assign(Object.assign(Object.assign({}, transferInBaseFilter), equipmentFilter), { date: { gte: start, lte: end }, status: "COMPLETED" }));
        const transfersOut = yield sumQuantity(db_1.prisma.transfer, Object.assign(Object.assign(Object.assign({}, transferOutBaseFilter), equipmentFilter), { date: { gte: start, lte: end }, status: "COMPLETED" }));
        const assigned = yield sumQuantity(db_1.prisma.assignment, Object.assign(Object.assign({ user: targetBaseId ? { baseId: targetBaseId } : undefined }, equipmentFilter), { date: { gte: start, lte: end }, type: "ASSIGNED" }));
        const expended = yield sumQuantity(db_1.prisma.assignment, Object.assign(Object.assign({ user: targetBaseId ? { baseId: targetBaseId } : undefined }, equipmentFilter), { date: { gte: start, lte: end }, type: "EXPENDED" }));
        const netMovement = purchases + transfersIn - transfersOut;
        const closingBalance = openingBalance + netMovement - assigned - expended;
        res.json({
            openingBalance,
            purchases,
            transfersIn,
            transfersOut,
            assigned,
            expended,
            closingBalance,
            netMovement,
        });
    }
    catch (error) {
        console.error("Metrics error:", error);
        res.status(500).json({ error: "Failed to calculate metrics" });
    }
});
exports.getMetrics = getMetrics;
