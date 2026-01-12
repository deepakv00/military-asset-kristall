import { Request, Response, NextFunction } from "express"
import { verifyJWT } from "../utils/auth"

export interface AuthRequest extends Request {
    user?: {
        id: string
        email: string
        role: string
        baseId?: string
    }
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(401).json({ error: "Unauthorized" })
    }

    const payload = await verifyJWT(token)

    if (!payload) {
        return res.status(401).json({ error: "Invalid token" })
    }

    req.user = payload as any
    next()
}

export const authorize = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: "Unauthorized" })
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Forbidden" })
        }

        next()
    }
}
