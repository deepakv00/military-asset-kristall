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
exports.me = exports.login = void 0;
const auth_1 = require("../utils/auth");
const db_1 = require("../db");
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { email, password } = req.body;
        const user = yield db_1.prisma.user.findUnique({
            where: { email },
            include: { base: true },
        });
        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const isValid = yield (0, auth_1.comparePassword)(password, user.password);
        if (!isValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        const token = yield (0, auth_1.signJWT)({
            id: user.id,
            email: user.email,
            role: user.role,
            baseId: user.baseId,
        });
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                baseId: user.baseId,
                baseName: (_a = user.base) === null || _a === void 0 ? void 0 : _a.name,
            },
        });
    }
    catch (error) {
        res.status(500).json({ error: "Login failed" });
    }
});
exports.login = login;
const me = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const user = yield db_1.prisma.user.findUnique({
            where: { id: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id },
            include: { base: true },
        });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({
            id: user.id,
            email: user.email,
            role: user.role,
            baseId: user.baseId,
            baseName: (_b = user.base) === null || _b === void 0 ? void 0 : _b.name,
        });
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch user" });
    }
});
exports.me = me;
