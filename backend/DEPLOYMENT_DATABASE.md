# Database Migration Guide: SQLite → PostgreSQL

## ✅ Schema Updated

The Prisma schema (`backend/prisma/schema.prisma`) has been updated to use PostgreSQL instead of SQLite.

**Change Made:**
- `provider = "sqlite"` → `provider = "postgresql"`

## 📋 Implications of This Change

### 1. **Schema Compatibility**
✅ **Good News:** The schema is already PostgreSQL-ready:
- Uses `@map` directives for snake_case table/column names (PostgreSQL convention)
- UUID primary keys work identically in both databases
- Foreign key constraints are compatible
- DateTime types translate correctly

### 2. **What This Means**
- **Local Development:** Your local SQLite database (`backend/prisma/dev.db`) will continue to work until you switch `DATABASE_URL` to a PostgreSQL connection string.
- **Production:** Once you provide a PostgreSQL database (Supabase, Neon, etc.), Prisma will generate PostgreSQL-compatible migrations.

### 3. **Migration Strategy**

#### Option A: Fresh Start (Recommended for New Deployments)
If you're deploying to production for the first time:
1. Create a new PostgreSQL database (Supabase/Neon/Render)
2. Set `DATABASE_URL` to the PostgreSQL connection string
3. Run: `npx prisma migrate deploy` (creates fresh schema)
4. Run: `npm run seed` (populates with initial data)

#### Option B: Data Migration (If You Have Existing Data)
If you need to migrate existing SQLite data:
1. Export data from SQLite to SQL/CSV
2. Create PostgreSQL database
3. Run Prisma migrations to create schema
4. Import data into PostgreSQL (manual process or script)

### 4. **Required Actions Before Production**

#### Manual Steps (You Must Do):
1. **Create PostgreSQL Database:**
   - Supabase: Create new project → Copy connection string
   - Neon: Create new project → Copy connection string
   - Render: Create PostgreSQL database → Copy connection string

2. **Update Environment Variable:**
   - Set `DATABASE_URL` in your hosting platform (Render backend service)
   - Format: `postgresql://user:password@host:port/database?sslmode=require`

3. **Run Migrations:**
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

4. **Seed Database (Optional):**
   ```bash
   npm run seed
   ```

### 5. **What We Did NOT Do**
- ❌ Did NOT run any migrations (as requested)
- ❌ Did NOT change any model definitions
- ❌ Did NOT modify existing data
- ❌ Did NOT update connection logic

### 6. **Testing Locally with PostgreSQL (Optional)**
If you want to test PostgreSQL locally before deploying:

1. Install PostgreSQL locally or use Docker:
   ```bash
   docker run --name postgres-test -e POSTGRES_PASSWORD=test -p 5432:5432 -d postgres
   ```

2. Update `backend/.env`:
   ```
   DATABASE_URL="postgresql://postgres:test@localhost:5432/military_assets"
   ```

3. Create database:
   ```bash
   createdb military_assets  # or via psql
   ```

4. Run migrations:
   ```bash
   cd backend
   npx prisma migrate dev --name init
   ```

5. Seed:
   ```bash
   npm run seed
   ```

## 🚨 Important Notes

- **Local Development:** Your current SQLite setup will continue working until you change `DATABASE_URL`
- **Production:** You MUST provide a PostgreSQL database before deploying
- **Migrations:** Existing SQLite migrations won't work with PostgreSQL - you'll need fresh migrations
- **Data Loss:** Switching databases means starting fresh unless you manually migrate data

## 📝 Next Steps

1. ✅ Schema updated (DONE)
2. ⏳ Create PostgreSQL database (MANUAL - You do this)
3. ⏳ Set DATABASE_URL environment variable (MANUAL - You do this)
4. ⏳ Run migrations when ready (MANUAL - You do this)

---

**Status:** Schema is ready for PostgreSQL. No migrations have been run.
