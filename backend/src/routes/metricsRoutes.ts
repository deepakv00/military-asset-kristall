import { Router } from "express"
import { getMetrics } from "../controllers/metricsController"
import { authenticate } from "../middleware/auth"

const router = Router()

router.get("/", authenticate, getMetrics)

export default router
