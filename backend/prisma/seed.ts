import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
    const passwordHash = await bcrypt.hash("password123", 10)

    // Bases
    const benning = await prisma.base.upsert({
        where: { name: "Fort Benning" },
        update: {},
        create: { name: "Fort Benning", location: "Georgia" },
    })

    const jackson = await prisma.base.upsert({
        where: { name: "Fort Jackson" },
        update: {},
        create: { name: "Fort Jackson", location: "South Carolina" },
    })

    const bragg = await prisma.base.upsert({
        where: { name: "Fort Bragg" },
        update: {},
        create: { name: "Fort Bragg", location: "North Carolina" },
    })

    // Users
    // Users
    const adminPassword = await bcrypt.hash("admin123", 10)
    await prisma.user.upsert({
        where: { email: "admin@army.mil" },
        update: { password: adminPassword },
        create: {
            email: "admin@army.mil",
            password: adminPassword,
            role: "ADMIN",
            name: "General Admin",
        },
    })

    const commanderPassword = await bcrypt.hash("commander123", 10)
    await prisma.user.upsert({
        where: { email: "commander@army.mil" },
        update: { password: commanderPassword },
        create: {
            email: "commander@army.mil",
            password: commanderPassword,
            role: "BASE_COMMANDER",
            name: "Commander",
            baseId: benning.id,
        },
    })

    const logisticsPassword = await bcrypt.hash("logistics123", 10)
    await prisma.user.upsert({
        where: { email: "logistics@army.mil" },
        update: { password: logisticsPassword },
        create: {
            email: "logistics@army.mil",
            password: logisticsPassword,
            role: "LOGISTICS_OFFICER",
            name: "Logistics Officer",
            baseId: benning.id,
        },
    })

    await prisma.user.upsert({
        where: { email: "commander@benning.mil" },
        update: { password: commanderPassword },
        create: {
            email: "commander@benning.mil",
            password: commanderPassword,
            role: "BASE_COMMANDER",
            name: "Commander Benning",
            baseId: benning.id,
        },
    })

    await prisma.user.upsert({
        where: { email: "logistics@benning.mil" },
        update: { password: logisticsPassword },
        create: {
            email: "logistics@benning.mil",
            password: logisticsPassword,
            role: "LOGISTICS_OFFICER",
            name: "Logistics Benning",
            baseId: benning.id,
        },
    })

    await prisma.user.upsert({
        where: { email: "logistics@jackson.mil" },
        update: { password: logisticsPassword },
        create: {
            email: "logistics@jackson.mil",
            password: logisticsPassword,
            role: "LOGISTICS_OFFICER",
            name: "Logistics Jackson",
            baseId: jackson.id,
        },
    })

    // Equipment
    const equipmentList = [
        "Rifles",
        "Ammunition",
        "Body Armor",
        "Helmets",
        "Tactical Vests",
        "Medical Supplies",
        "Vehicles",
    ]

    for (const name of equipmentList) {
        await prisma.equipment.upsert({
            where: { name },
            update: {},
            create: { name },
        })
    }

    console.log("Database seeded!")
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
