"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const metricsRoutes_1 = __importDefault(require("./routes/metricsRoutes"));
const transactionRoutes_1 = __importDefault(require("./routes/transactionRoutes"));
const app = (0, express_1.default)();
// CORS configuration for production
app.use((0, cors_1.default)({
    origin: ["https://military-asset-kristall.vercel.app", "http://localhost:3000"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));
app.use(express_1.default.json());
// Routes
app.use("/auth", authRoutes_1.default);
app.use("/metrics", metricsRoutes_1.default);
app.use("/api", transactionRoutes_1.default); // Prefix for other routes
// Root route
app.get("/", (req, res) => {
    res.send("Military Asset Management Backend is running");
});
// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});
exports.default = app;
