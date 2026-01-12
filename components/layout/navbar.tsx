"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const navItems = [
    { label: "Dashboard", href: "/dashboard", roles: ["ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"] },
    { label: "Inventory", href: "/inventory", roles: ["ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"] },
    { label: "Purchases", href: "/purchases", roles: ["ADMIN", "LOGISTICS_OFFICER"] },
    { label: "Transfers", href: "/transfers", roles: ["ADMIN", "LOGISTICS_OFFICER"] },
    { label: "Assignments", href: "/assignments", roles: ["ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"] },
    { label: "Movement Logs", href: "/movement-logs", roles: ["ADMIN", "BASE_COMMANDER", "LOGISTICS_OFFICER"] },
    { label: "Users", href: "/users", roles: ["ADMIN"] },
  ]

  const visibleItems = navItems.filter((item) => item.roles.includes(user?.role || ""))

  return (
    <nav className="border-b border-border bg-card">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-12">
            <h1 className="text-base font-bold tracking-tight text-foreground">Asset Management</h1>
            <div className="hidden md:flex gap-1">
              {visibleItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${pathname === item.href
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground hover:bg-muted/60"
                    }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="font-medium text-foreground">{user?.email}</span>
              <span className="text-border">•</span>
              <span className="text-muted-foreground">{user?.role?.replace(/_/g, " ")}</span>
            </div>
            <Button variant="outline" onClick={handleLogout} size="sm" className="text-sm bg-transparent">
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
