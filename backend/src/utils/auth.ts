import { SignJWT, jwtVerify } from "jose"
import bcrypt from "bcryptjs"

const SECRET_KEY = process.env.JWT_SECRET || "super-secret-jwt-key-change-in-production"
const key = new TextEncoder().encode(SECRET_KEY)

export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10)
}

export async function comparePassword(plain: string, hashed: string): Promise<boolean> {
    return await bcrypt.compare(plain, hashed)
}

export async function signJWT(payload: any): Promise<string> {
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(key)
}

export async function verifyJWT(token: string): Promise<any> {
    try {
        const { payload } = await jwtVerify(token, key, {
            algorithms: ["HS256"],
        })
        return payload
    } catch (error) {
        return null
    }
}
