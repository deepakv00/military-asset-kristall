import { Response } from "express"
import bcrypt from "bcryptjs"
import { AuthRequest } from "../middleware/auth"
import { prisma } from "../db"

// Get all users (Admin only)
export const getUsers = async (req: AuthRequest, res: Response) => {
    try {
        const adminUser = req.user!

        if (adminUser.role !== "ADMIN") {
            return res.status(403).json({ error: "Only admins can view all users" })
        }

        const users = await prisma.user.findMany({
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
        })

        res.json(users)
    } catch (error) {
        console.error("Failed to fetch users:", error)
        res.status(500).json({ error: "Failed to fetch users" })
    }
}

// Create a new user (Admin only)
export const createUser = async (req: AuthRequest, res: Response) => {
    try {
        const adminUser = req.user!

        if (adminUser.role !== "ADMIN") {
            return res.status(403).json({ error: "Only admins can create users" })
        }

        const { email, password, name, role, baseId } = req.body

        if (!email || !password || !role) {
            return res.status(400).json({ error: "Email, password, and role are required" })
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({ where: { email } })
        if (existingUser) {
            return res.status(400).json({ error: "Email already exists" })
        }

        // Validate role
        const validRoles = ["ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"]
        if (!validRoles.includes(role)) {
            return res.status(400).json({ error: "Invalid role" })
        }

        // Non-admin roles must have a base assigned
        if (role !== "ADMIN" && !baseId) {
            return res.status(400).json({ error: "Base is required for non-admin users" })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = await prisma.user.create({
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
        })

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: "CREATE_USER",
                entity: "User",
                entityId: newUser.id,
                userId: adminUser.id,
                details: `Created user ${email} with role ${role}`,
            },
        })


        res.status(201).json(newUser)
    } catch (error) {
        console.error("Failed to create user:", error)
        res.status(500).json({ error: "Failed to create user" })
    }
}

// Update a user (Admin only)
export const updateUser = async (req: AuthRequest, res: Response) => {
    try {
        const adminUser = req.user!

        if (adminUser.role !== "ADMIN") {
            return res.status(403).json({ error: "Only admins can update users" })
        }

        const id = req.params.id as string
        const { email, password, name, role, baseId } = req.body

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { id } })
        if (!existingUser) {
            return res.status(404).json({ error: "User not found" })
        }

        // Check if email is taken by another user
        if (email && email !== existingUser.email) {
            const emailTaken = await prisma.user.findUnique({ where: { email } })
            if (emailTaken) {
                return res.status(400).json({ error: "Email already exists" })
            }
        }

        const updateData: any = {}
        if (email) updateData.email = email
        if (name !== undefined) updateData.name = name
        if (role) {
            const validRoles = ["ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"]
            if (!validRoles.includes(role)) {
                return res.status(400).json({ error: "Invalid role" })
            }
            updateData.role = role
        }
        if (password) {
            updateData.password = await bcrypt.hash(password, 10)
        }
        if (baseId !== undefined) {
            updateData.baseId = (updateData.role || existingUser.role) === "ADMIN" ? null : baseId
        }

        const updatedUser = await prisma.user.update({
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
        })

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: "UPDATE_USER",
                entity: "User",
                entityId: id,
                userId: adminUser.id,
                details: `Updated user ${updatedUser.email}`,
            },
        })


        res.json(updatedUser)
    } catch (error) {
        console.error("Failed to update user:", error)
        res.status(500).json({ error: "Failed to update user" })
    }
}

// Delete a user (Admin only)
export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const adminUser = req.user!

        if (adminUser.role !== "ADMIN") {
            return res.status(403).json({ error: "Only admins can delete users" })
        }

        const id = req.params.id as string

        // Prevent admin from deleting themselves
        if (id === adminUser.id) {
            return res.status(400).json({ error: "Cannot delete your own account" })
        }

        const existingUser = await prisma.user.findUnique({ where: { id } })
        if (!existingUser) {
            return res.status(404).json({ error: "User not found" })
        }

        await prisma.user.delete({ where: { id } })

        // Audit log
        await prisma.auditLog.create({
            data: {
                action: "DELETE_USER",
                entity: "User",
                entityId: id,
                userId: adminUser.id,
                details: `Deleted user ${existingUser.email}`,
            },
        })


        res.json({ message: "User deleted successfully" })
    } catch (error) {
        console.error("Failed to delete user:", error)
        res.status(500).json({ error: "Failed to delete user" })
    }
}
