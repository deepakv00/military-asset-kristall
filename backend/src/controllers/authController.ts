import { Request, Response } from "express"
import { comparePassword, signJWT } from "../utils/auth"
import { AuthRequest } from "../middleware/auth"
import { prisma } from "../db"

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body

        const user = await prisma.user.findUnique({
            where: { email },
            include: { base: true },
        })

        if (!user) {
            return res.status(401).json({ error: "Invalid credentials" })
        }

        const isValid = await comparePassword(password, user.password)

        if (!isValid) {
            return res.status(401).json({ error: "Invalid credentials" })
        }

        const token = await signJWT({
            id: user.id,
            email: user.email,
            role: user.role,
            baseId: user.baseId,
        })

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                baseId: user.baseId,
                baseName: user.base?.name,
            },
        })
    } catch (error) {
        res.status(500).json({ error: "Login failed" })
    }
}

export const me = async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user?.id },
            include: { base: true },
        })

        if (!user) {
            return res.status(404).json({ error: "User not found" })
        }

        res.json({
            id: user.id,
            email: user.email,
            role: user.role,
            baseId: user.baseId,
            baseName: user.base?.name,
        })
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch user" })
    }
}
