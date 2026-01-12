"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield } from "lucide-react"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const { login, isLoading } = useAuth()
    const router = useRouter()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        try {
            await login(email, password)
            router.push("/dashboard")
        } catch (err) {
            console.error("Login page error:", err)
            setError(err instanceof Error ? err.message : "Login failed. Please try again.")
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="p-3 bg-primary/10 rounded-full">
                            <Shield className="h-10 w-10 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Military Asset Management</CardTitle>
                    <CardDescription>Enter your credentials to access the system</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="officer@army.mil"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? "Signing in..." : "Sign In"}
                        </Button>
                    </CardFooter>
                </form>
                <div className="px-6 pb-6 text-center text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Demo Credentials:</p>
                    <p>admin@army.mil / admin123</p>
                    <p>commander@army.mil / commander123</p>
                    <p>logistics@army.mil / logistics123</p>
                </div>
            </Card>
        </div>
    )
}
