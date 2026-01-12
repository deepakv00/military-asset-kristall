import { Router } from "express"
import {
    getPurchases,
    createPurchase,
    getTransfers,
    createTransfer,
    getAssignments,
    createAssignment,
} from "../controllers/transactionController"
import { getBases } from "../controllers/baseController"
import { getInventory, getMovementLogs } from "../controllers/inventoryController"
import { getUsers, createUser, updateUser, deleteUser } from "../controllers/userController"
import { exportPurchasesPDF, exportTransfersExcel, exportAssignmentsPDF } from "../controllers/reportController"
import { authenticate } from "../middleware/auth"

const router = Router()

router.get("/bases", authenticate, getBases)
router.get("/inventory", authenticate, getInventory)
router.get("/movement-logs", authenticate, getMovementLogs)

router.get("/purchases", authenticate, getPurchases)
router.post("/purchases", authenticate, createPurchase)
router.get("/reports/purchases/pdf", authenticate, exportPurchasesPDF)

router.get("/transfers", authenticate, getTransfers)
router.post("/transfers", authenticate, createTransfer)
router.get("/reports/transfers/excel", authenticate, exportTransfersExcel)

router.get("/assignments", authenticate, getAssignments)
router.post("/assignments", authenticate, createAssignment)
router.get("/reports/assignments/pdf", authenticate, exportAssignmentsPDF)

// User management (Admin only)
router.get("/users", authenticate, getUsers)
router.post("/users", authenticate, createUser)
router.put("/users/:id", authenticate, updateUser)
router.delete("/users/:id", authenticate, deleteUser)

export default router
