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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.createUser = exports.getUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../db");
// Get all users (Admin only)
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adminUser = req.user;
        if (adminUser.role !== "ADMIN") {
            return res.status(403).json({ error: "Only admins can view all users" });
        }
        const users = yield db_1.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                baseId: true,
                base: {
                    select: { id: true, name: true }
                },
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(users);
    }
    catch (error) {
        console.error("Failed to fetch users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});
exports.getUsers = getUsers;
// Create a new user (Admin only)
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adminUser = req.user;
        if (adminUser.role !== "ADMIN") {
            return res.status(403).json({ error: "Only admins can create users" });
        }
        const { email, password, name, role, baseId } = req.body;
        if (!email || !password || !role) {
            return res.status(400).json({ error: "Email, password, and role are required" });
        }
        // Check if email already exists
        const existingUser = yield db_1.prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: "Email already exists" });
        }
        // Validate role
        const validRoles = ["ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: "Invalid role" });
        }
        // Non-admin roles must have a base assigned
        if (role !== "ADMIN" && !baseId) {
            return res.status(400).json({ error: "Base is required for non-admin users" });
        }
        const hashedPassword = yield bcryptjs_1.default.hash(password, 10);
        const newUser = yield db_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role,
                baseId: role === "ADMIN" ? null : baseId,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                baseId: true,
                base: { select: { id: true, name: true } },
                createdAt: true,
            },
        });
        // Audit log
        yield db_1.prisma.auditLog.create({
            data: {
                action: "CREATE_USER",
                entity: "User",
                entityId: newUser.id,
                userId: adminUser.id,
                details: `Created user ${email} with role ${role}`,
            },
        });
        res.status(201).json(newUser);
    }
    catch (error) {
        console.error("Failed to create user:", error);
        res.status(500).json({ error: "Failed to create user" });
    }
});
exports.createUser = createUser;
// Update a user (Admin only)
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adminUser = req.user;
        if (adminUser.role !== "ADMIN") {
            return res.status(403).json({ error: "Only admins can update users" });
        }
        const id = req.params.id;
        const { email, password, name, role, baseId } = req.body;
        // Check if user exists
        const existingUser = yield db_1.prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            return res.status(404).json({ error: "User not found" });
        }
        // Check if email is taken by another user
        if (email && email !== existingUser.email) {
            const emailTaken = yield db_1.prisma.user.findUnique({ where: { email } });
            if (emailTaken) {
                return res.status(400).json({ error: "Email already exists" });
            }
        }
        const updateData = {};
        if (email)
            updateData.email = email;
        if (name !== undefined)
            updateData.name = name;
        if (role) {
            const validRoles = ["ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"];
            if (!validRoles.includes(role)) {
                return res.status(400).json({ error: "Invalid role" });
            }
            updateData.role = role;
        }
        if (password) {
            updateData.password = yield bcryptjs_1.default.hash(password, 10);
        }
        if (baseId !== undefined) {
            updateData.baseId = (updateData.role || existingUser.role) === "ADMIN" ? null : baseId;
        }
        const updatedUser = yield db_1.prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                baseId: true,
                base: { select: { id: true, name: true } },
                createdAt: true,
                updatedAt: true,
            },
        });
        // Audit log
        yield db_1.prisma.auditLog.create({
            data: {
                action: "UPDATE_USER",
                entity: "User",
                entityId: id,
                userId: adminUser.id,
                details: `Updated user ${updatedUser.email}`,
            },
        });
        res.json(updatedUser);
    }
    catch (error) {
        console.error("Failed to update user:", error);
        res.status(500).json({ error: "Failed to update user" });
    }
});
exports.updateUser = updateUser;
// Delete a user (Admin only)
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const adminUser = req.user;
        if (adminUser.role !== "ADMIN") {
            return res.status(403).json({ error: "Only admins can delete users" });
        }
        const id = req.params.id;
        // Prevent admin from deleting themselves
        if (id === adminUser.id) {
            return res.status(400).json({ error: "Cannot delete your own account" });
        }
        const existingUser = yield db_1.prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            return res.status(404).json({ error: "User not found" });
        }
        yield db_1.prisma.user.delete({ where: { id } });
        // Audit log
        yield db_1.prisma.auditLog.create({
            data: {
                action: "DELETE_USER",
                entity: "User",
                entityId: id,
                userId: adminUser.id,
                details: `Deleted user ${existingUser.email}`,
            },
        });
        res.json({ message: "User deleted successfully" });
    }
    catch (error) {
        console.error("Failed to delete user:", error);
        res.status(500).json({ error: "Failed to delete user" });
    }
});
exports.deleteUser = deleteUser;
