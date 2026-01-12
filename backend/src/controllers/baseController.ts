import { Request, Response } from "express"
import { prisma } from "../db"

export const getBases = async (req: Request, res: Response) => {
    try {
        const bases = await prisma.base.findMany({
            orderBy: { name: "asc" },
        })
        res.json(bases)
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch bases" })
    }
}
