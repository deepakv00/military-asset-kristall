import express from "express"
import cors from "cors"
import authRoutes from "./routes/authRoutes"
import metricsRoutes from "./routes/metricsRoutes"
import transactionRoutes from "./routes/transactionRoutes"

const app = express()

// CORS configuration for production
app.use(cors({
    origin: true, // Reflect origin for debugging
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}))



app.use(express.json())

// Routes
app.use("/auth", authRoutes)
app.use("/metrics", metricsRoutes)
app.use("/api", transactionRoutes) // Prefix for other routes

// Root route
app.get("/", (req, res) => {
    res.send("Military Asset Management Backend is running")
})

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok" })
})

export default app
