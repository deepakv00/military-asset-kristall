"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { fetchUsers, createUserApi, updateUserApi, deleteUserApi, fetchBases, type User, type Base } from "@/lib/api"

import { ProtectedRoute } from "@/components/protected-route"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function UsersPage() {
    const { user } = useAuth()
    const [users, setUsers] = useState<User[]>([])
    const [bases, setBases] = useState<Base[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingUser, setEditingUser] = useState<User | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [successMessage, setSuccessMessage] = useState("")
    const [errorMessage, setErrorMessage] = useState("")

    const [formData, setFormData] = useState({
        email: "",
        password: "",
        name: "",
        role: "LOGISTICS_OFFICER",
        baseId: "",
    })

    const loadUsers = async () => {
        try {
            const data = await fetchUsers()
            setUsers(data)
        } catch (error) {
            console.error("Failed to load users:", error)
        }
    }

    const loadData = async () => {
        setIsLoading(true)
        try {
            const [usersData, basesData] = await Promise.all([
                fetchUsers(),
                fetchBases()
            ])
            setUsers(usersData)
            setBases(basesData)
        } catch (error) {
            console.error("Failed to load data:", error)
            setErrorMessage(error instanceof Error ? error.message : "Failed to load users")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (user?.role === "ADMIN") {
            loadData()
        }
    }, [user])

    // Redirect non-admins (moved after hooks)
    if (user?.role !== "ADMIN") {
        return (
            <ProtectedRoute>
                <div className="min-h-screen bg-background">
                    <Navbar />
                    <main className="max-w-7xl mx-auto px-6 sm:px-8 py-10">
                        <div className="text-center py-16">
                            <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
                            <p className="text-muted-foreground">Only administrators can access this page.</p>
                        </div>
                    </main>
                </div>
            </ProtectedRoute>
        )
    }

    const resetForm = () => {
        setFormData({
            email: "",
            password: "",
            name: "",
            role: "LOGISTICS_OFFICER",
            baseId: "",
        })
        setEditingUser(null)
        setShowForm(false)
    }

    const handleEdit = (userToEdit: User) => {
        setEditingUser(userToEdit)
        setFormData({
            email: userToEdit.email,
            password: "",
            name: userToEdit.name || "",
            role: userToEdit.role,
            baseId: userToEdit.baseId || "",
        })
        setShowForm(true)
        setErrorMessage("")
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMessage("")

        if (!formData.email || !formData.role) {
            setErrorMessage("Email and Role are required")
            return
        }

        if (!editingUser && !formData.password) {
            setErrorMessage("Password is required for new users")
            return
        }

        if (formData.role !== "ADMIN" && !formData.baseId) {
            setErrorMessage("Base is required for non-admin users")
            return
        }

        setIsSubmitting(true)
        try {
            if (editingUser) {
                await updateUserApi(editingUser.id, {
                    email: formData.email,
                    password: formData.password || undefined,
                    name: formData.name || undefined,
                    role: formData.role,
                    baseId: formData.role === "ADMIN" ? undefined : formData.baseId,
                })
                setSuccessMessage("User updated successfully!")
            } else {
                await createUserApi({
                    email: formData.email,
                    password: formData.password,
                    name: formData.name || undefined,
                    role: formData.role,
                    baseId: formData.role === "ADMIN" ? undefined : formData.baseId,
                })
                setSuccessMessage("User created successfully!")
            }

            resetForm()
            loadData()
            setTimeout(() => setSuccessMessage(""), 3000)
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to save user")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (userToDelete: User) => {
        if (!confirm(`Are you sure you want to delete ${userToDelete.email}?`)) {
            return
        }

        try {
            await deleteUserApi(userToDelete.id)
            setSuccessMessage("User deleted successfully!")
            loadData()
            setTimeout(() => setSuccessMessage(""), 3000)
        } catch (error) {
            setErrorMessage(error instanceof Error ? error.message : "Failed to delete user")
        }
    }

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case "ADMIN":
                return "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300"
            case "BASE_COMMANDER":
                return "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300"
            case "LOGISTICS_OFFICER":
                return "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300"
            default:
                return "bg-gray-100 dark:bg-gray-900/40 text-gray-800 dark:text-gray-300"
        }
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="max-w-7xl mx-auto px-6 sm:px-8 py-10">
                    <div className="mb-8 flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground mb-2">User Management</h1>
                            <p className="text-muted-foreground text-sm">Create, edit, and manage system users</p>
                        </div>
                        <Button onClick={() => { resetForm(); setShowForm(!showForm) }}>
                            {showForm ? "Cancel" : "Add User"}
                        </Button>
                    </div>

                    {successMessage && (
                        <div className="p-4 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-md mb-6">
                            {successMessage}
                        </div>
                    )}

                    {errorMessage && (
                        <div className="p-4 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-md mb-6">
                            {errorMessage}
                        </div>
                    )}

                    {showForm && (
                        <Card className="mb-8 border-border shadow-sm">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-base font-semibold">
                                    {editingUser ? "Edit User" : "Add New User"}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-medium text-foreground block mb-2">Email *</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-foreground block mb-2">
                                                Password {editingUser ? "(leave blank to keep current)" : "*"}
                                            </label>
                                            <input
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                required={!editingUser}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-foreground block mb-2">Name</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium text-foreground block mb-2">Role *</label>
                                            <select
                                                value={formData.role}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                required
                                            >
                                                <option value="LOGISTICS_OFFICER">Logistics Officer</option>
                                                <option value="BASE_COMMANDER">Base Commander</option>
                                                <option value="ADMIN">Administrator</option>
                                            </select>
                                        </div>
                                        {formData.role !== "ADMIN" && (
                                            <div className="md:col-span-2">
                                                <label className="text-xs font-medium text-foreground block mb-2">Base *</label>
                                                <select
                                                    value={formData.baseId}
                                                    onChange={(e) => setFormData({ ...formData, baseId: e.target.value })}
                                                    className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                    required
                                                >
                                                    <option value="">Select a base</option>
                                                    {bases.map((base) => (
                                                        <option key={base.id} value={base.id}>
                                                            {base.name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </div>
                                    <div className="pt-2">
                                        <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                                            {isSubmitting ? "Saving..." : editingUser ? "Update User" : "Create User"}
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    <Card className="border-border shadow-sm overflow-hidden">
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-medium">
                                        <tr>
                                            <th className="px-6 py-4">User</th>
                                            <th className="px-6 py-4">Role</th>
                                            <th className="px-6 py-4">Base</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {isLoading ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                                                    Loading users...
                                                </td>
                                            </tr>
                                        ) : users.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">
                                                    No users found.
                                                </td>
                                            </tr>
                                        ) : (
                                            users.map((u) => (
                                                <tr key={u.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-foreground">{u.name || "N/A"}</div>
                                                        <div className="text-xs text-muted-foreground">{u.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${getRoleBadgeColor(u.role)}`}>
                                                            {u.role.replace("_", " ")}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-muted-foreground">
                                                        {u.base?.name || "All Bases"}
                                                    </td>
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(u)}>
                                                            Edit
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            onClick={() => handleDelete(u)}
                                                            disabled={u.id === user?.id}
                                                        >
                                                            Delete
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </ProtectedRoute>
    )
}
