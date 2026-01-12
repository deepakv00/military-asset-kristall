# Render Deployment - Step by Step

## 🎯 Backend Deployment to Render

### Step 1: Create Render Account & Service

1. Go to [render.com](https://render.com)
2. Sign up/Login (use GitHub to connect)
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repository: `deepakv00/military-asset-kristall`

---

### Step 2: Configure Service Settings

Fill in these exact values:

#### **Basic Settings:**
- **Name:** `military-asset-backend` (or your choice)
- **Region:** Choose closest to you (e.g., `Oregon (US West)`)
- **Branch:** `main`
- **Root Directory:** `backend` ⚠️ **IMPORTANT: Must be `backend`**
- **Runtime:** `Node`
- **Instance Type:** `Free` (or `Starter` for better performance)

#### **Build & Deploy:**

**Build Command:**
```bash
npm install && npx prisma generate
```

**Start Command:**
```bash
npm run dev
```

**OR** (if you want to use production mode):
```bash
node dist/server.js
```
*(But you'll need to add a build step for TypeScript compilation)*

---

### Step 3: Environment Variables

Click **"Environment"** tab and add these variables:

#### **Required Environment Variables:**

1. **DATABASE_URL**
   ```
   postgresql://postgres:deepakv883deepak@db.hmadcpoaiwqcglkqvyph.supabase.co:5432/postgres?sslmode=require
   ```
   ⚠️ **Important:** Must include `?sslmode=require` at the end

2. **JWT_SECRET**
   ```
   [Generate a strong random secret]
   ```
   **To generate:** Run this command locally:
   ```bash
   openssl rand -base64 32
   ```
   Or use an online generator, then paste the result here.

3. **FRONTEND_URL**
   ```
   https://your-frontend.vercel.app
   ```
   ⚠️ **Note:** You'll update this after deploying frontend to Vercel. For now, you can set a placeholder or leave it empty (will default to `*` for CORS).

4. **NODE_ENV**
   ```
   production
   ```

---

### Step 4: Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Install dependencies
   - Generate Prisma client
   - Start your server

3. Wait for deployment to complete (usually 2-5 minutes)

---

### Step 5: Run Database Migrations

After first deployment succeeds:

#### **Option A: Via Render Shell (Recommended)**

1. Go to your service → Click **"Shell"** tab
2. Run these commands:
   ```bash
   cd backend
   npx prisma migrate deploy
   npm run seed
   ```

#### **Option B: Add to Build Command**

Update your build command to:
```bash
npm install && npx prisma generate && npx prisma migrate deploy
```

Then add seed to start command (optional):
```bash
npm run seed && npm run dev
```

---

### Step 6: Verify Deployment

1. **Check Health Endpoint:**
   - Visit: `https://your-service-name.onrender.com/health`
   - Should return: `{"status":"ok"}`

2. **Test Login:**
   ```bash
   curl -X POST https://your-service-name.onrender.com/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@army.mil","password":"admin123"}'
   ```

3. **Save Your Backend URL:**
   - Copy your Render service URL (e.g., `https://military-asset-backend.onrender.com`)
   - You'll need this for frontend deployment

---

## 📋 Quick Reference

### **Render Service Configuration:**

| Setting | Value |
|---------|-------|
| **Root Directory** | `backend` |
| **Build Command** | `npm install && npx prisma generate` |
| **Start Command** | `npm run dev` |
| **Branch** | `main` |
| **Runtime** | `Node` |

### **Environment Variables:**

```env
DATABASE_URL=postgresql://postgres:deepakv883deepak@db.hmadcpoaiwqcglkqvyph.supabase.co:5432/postgres?sslmode=require
JWT_SECRET=your-generated-secret-here
FRONTEND_URL=https://your-frontend.vercel.app
NODE_ENV=production
```

---

## ⚠️ Important Notes

1. **Root Directory:** Must be `backend` (not root of repo)
2. **SSL Mode:** Always include `?sslmode=require` in Supabase connection string
3. **Migrations:** Run `npx prisma migrate deploy` after first deployment
4. **Free Tier:** Render free tier spins down after 15 minutes of inactivity (first request may be slow)

---

## 🐛 Troubleshooting

### **Issue: Build fails**
- Check: Root directory is set to `backend`
- Check: Build command includes `npx prisma generate`

### **Issue: Database connection fails**
- Check: `DATABASE_URL` includes `?sslmode=require`
- Check: Password in connection string is correct

### **Issue: Prisma client not found**
- Solution: Ensure build command includes `npx prisma generate`

---

## ✅ Checklist

- [ ] Render account created
- [ ] Web service created
- [ ] Root directory set to `backend`
- [ ] Build command configured
- [ ] Start command configured
- [ ] Environment variables set
- [ ] Service deployed
- [ ] Migrations run
- [ ] Health check passes
- [ ] Backend URL saved

---

**After this, proceed to Vercel for frontend deployment!**
