// Mock API data and functions for the Military Asset Management System

export interface MetricsData {
  openingBalance: number
  purchases: number
  transfersIn: number
  transfersOut: number
  assigned: number
  expended: number
  closingBalance: number
  netMovement: number
}

export interface Purchase {
  id: string
  baseId: string
  baseName: string
  equipment: string
  quantity: number
  date: string
  createdBy: string
}

export interface Transfer {
  id: string
  fromBase: string
  toBase: string
  equipment: string
  quantity: number
  date: string
  status: "pending" | "completed"
}

export interface Assignment {
  id: string
  equipment: string
  quantity: number
  type: "assigned" | "expended"
  personnelName?: string
  reason?: string
  date: string
  createdBy: string
}

// Mock databases
const mockPurchases: Purchase[] = [
  {
    id: "1",
    baseId: "base-1",
    baseName: "Fort Benning",
    equipment: "Rifles",
    quantity: 50,
    date: "2024-12-20",
    createdBy: "officer@army.mil",
  },
  {
    id: "2",
    baseId: "base-1",
    baseName: "Fort Benning",
    equipment: "Body Armor",
    quantity: 100,
    date: "2024-12-18",
    createdBy: "officer@army.mil",
  },
]

const mockTransfers: Transfer[] = [
  {
    id: "1",
    fromBase: "Fort Benning",
    toBase: "Fort Jackson",
    equipment: "Ammunition",
    quantity: 5000,
    date: "2024-12-15",
    status: "completed",
  },
]

const mockAssignments: Assignment[] = [
  {
    id: "1",
    equipment: "Rifles",
    quantity: 10,
    type: "assigned",
    personnelName: "Sergeant Johnson",
    date: "2024-12-19",
    createdBy: "commander@army.mil",
  },
]

export async function fetchMetrics(filters: {
  fromDate?: string
  toDate?: string
  equipment?: string
  baseId?: string
}): Promise<MetricsData> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300))

  // Mock calculation
  return {
    openingBalance: 5000,
    purchases: 150,
    transfersIn: 200,
    transfersOut: 100,
    assigned: 300,
    expended: 50,
    closingBalance: 4900,
    netMovement: 250, // purchases + transfers in - transfers out
  }
}

export async function fetchPurchases(): Promise<Purchase[]> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return mockPurchases
}

export async function addPurchase(purchase: Omit<Purchase, "id">): Promise<Purchase> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const newPurchase: Purchase = {
    ...purchase,
    id: Math.random().toString(36).substr(2, 9),
  }
  mockPurchases.push(newPurchase)
  return newPurchase
}

export async function fetchTransfers(): Promise<Transfer[]> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return mockTransfers
}

export async function addTransfer(transfer: Omit<Transfer, "id">): Promise<Transfer> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const newTransfer: Transfer = {
    ...transfer,
    id: Math.random().toString(36).substr(2, 9),
  }
  mockTransfers.push(newTransfer)
  return newTransfer
}

export async function fetchAssignments(): Promise<Assignment[]> {
  await new Promise((resolve) => setTimeout(resolve, 200))
  return mockAssignments
}

export async function addAssignment(assignment: Omit<Assignment, "id">): Promise<Assignment> {
  await new Promise((resolve) => setTimeout(resolve, 300))
  const newAssignment: Assignment = {
    ...assignment,
    id: Math.random().toString(36).substr(2, 9),
  }
  mockAssignments.push(newAssignment)
  return newAssignment
}

export const baseOptions = [
  { id: "base-1", name: "Fort Benning" },
  { id: "base-2", name: "Fort Jackson" },
  { id: "base-3", name: "Fort Bragg" },
]

export const equipmentOptions = [
  "Rifles",
  "Ammunition",
  "Body Armor",
  "Helmets",
  "Tactical Vests",
  "Medical Supplies",
  "Vehicles",
]
