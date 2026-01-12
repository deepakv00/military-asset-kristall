# Complete Deployment Guide

## 🎯 Overview

This guide provides step-by-step instructions for deploying the Military Asset Management System to production.

**Architecture:**
- **Frontend:** Next.js → Deploy to Vercel
- **Backend:** Express + Prisma → Deploy to Render
- **Database:** PostgreSQL → Supabase/Neon/Render PostgreSQL

---

## ✅ Pre-Deployment Checklist

All code changes have been completed:

- ✅ **Step 1:** Environment variables configured
- ✅ **Step 2:** Database schema updated for PostgreSQL
- ✅ **Step 3:** Backend deployment readiness
- ✅ **Step 4:** Frontend deployment readiness

---

## 📋 Deployment Steps

### **Part 1: Database Setup** (Manual)

#### Option A: Supabase (Recommended) ✅

1. **Create Supabase Project:**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Wait for database to be provisioned

2. **Get Connection String:**
   - Go to Project Settings → Database
   - Copy "Connection string" → "URI"
   - Format: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`
   - **Important:** Add `?sslmode=require` at the end for SSL
   - **Example:** `postgresql://postgres:password@db.xxxxx.supabase.co:5432/postgres?sslmode=require`
   - **Save this** - you'll need it for backend deployment

**Note:** See `backend/SUPABASE_SETUP.md` for detailed Supabase setup instructions.

#### Option B: Neon (Alternative)

1. **Create Neon Project:**
   - Go to [neon.tech](https://neon.tech)
   - Create new project
   - Copy connection string

#### Option C: Render PostgreSQL

1. **Create PostgreSQL Database:**
   - In Render dashboard, create new PostgreSQL database
   - Copy "Internal Database URL" or "External Database URL"

---

### **Part 2: Backend Deployment (Render)**

#### Step 1: Prepare Repository

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

#### Step 2: Create Render Service

1. **Go to Render Dashboard:**
   - Visit [render.com](https://render.com)
   - Sign up/Login

2. **Create New Web Service:**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

3. **Configure Service:**
   - **Name:** `military-asset-backend` (or your choice)
   - **Region:** Choose closest to your users
   - **Branch:** `main` (or your default branch)
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install && npx prisma generate`
   - **Start Command:** `npm run dev` (or `node dist/server.js` if using TypeScript compilation)

#### Step 3: Set Environment Variables

In Render dashboard, add these environment variables:

```env
DATABASE_URL=postgresql://postgres:deepakv883deepak@db.hmadcpoaiwqcglkqvyph.supabase.co:5432/postgres?sslmode=require
JWT_SECRET=your-strong-random-secret-here
FRONTEND_URL=https://your-frontend.vercel.app
NODE_ENV=production
```

**Important for Supabase:**
- Use your actual Supabase connection string
- **Must include `?sslmode=require`** at the end for SSL connection
- Keep the password secure - never commit to Git

**To generate JWT_SECRET:**
```bash
openssl rand -base64 32
```

**Important:** 
- Replace `FRONTEND_URL` with your actual Vercel frontend URL (you'll get this after deploying frontend)
- You can update this later if needed

#### Step 4: Deploy

1. Click "Create Web Service"
2. Render will:
   - Install dependencies
   - Generate Prisma client
   - Start your server

#### Step 5: Run Database Migrations

After first deployment:

1. **Option A: Via Render Shell:**
   - Go to your service → "Shell"
   - Run: `npx prisma migrate deploy`
   - Run: `npm run seed` (optional - to populate initial data)

2. **Option B: Add to Build Command:**
   - Update build command to: `npm install && npx prisma generate && npx prisma migrate deploy`

#### Step 6: Verify Backend

1. **Check Health Endpoint:**
   - Visit: `https://your-backend.onrender.com/health`
   - Should return: `{"status":"ok"}`

2. **Save Backend URL:**
   - Copy your Render service URL (e.g., `https://military-asset-backend.onrender.com`)
   - You'll need this for frontend deployment

---

### **Part 3: Frontend Deployment (Vercel)**

#### Step 1: Prepare Repository

Ensure code is pushed to GitHub (same as backend)

#### Step 2: Create Vercel Project

1. **Go to Vercel:**
   - Visit [vercel.com](https://vercel.com)
   - Sign up/Login with GitHub

2. **Import Project:**
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Select the repository

#### Step 3: Configure Project

1. **Framework Preset:** Next.js (auto-detected)
2. **Root Directory:** `./` (root of repository)
3. **Build Command:** `npm run build` (default)
4. **Output Directory:** `.next` (default)
5. **Install Command:** `npm install` (default)

#### Step 4: Set Environment Variables

Before deploying, add environment variable:

- **Name:** `NEXT_PUBLIC_API_URL`
- **Value:** Your Render backend URL (e.g., `https://military-asset-backend.onrender.com`)

**Important:** 
- Must start with `NEXT_PUBLIC_` to be accessible in browser
- No trailing slash

#### Step 5: Deploy

1. Click "Deploy"
2. Vercel will:
   - Install dependencies
   - Build your Next.js app
   - Deploy to production

#### Step 6: Update Backend CORS

After frontend is deployed:

1. **Get Vercel Frontend URL:**
   - Copy your Vercel deployment URL (e.g., `https://military-asset-frontend.vercel.app`)

2. **Update Backend Environment Variable:**
   - Go to Render dashboard → Your backend service → Environment
   - Update `FRONTEND_URL` to your Vercel URL
   - Redeploy backend (or it will auto-redeploy)

#### Step 7: Verify Frontend

1. Visit your Vercel URL
2. Test login functionality
3. Verify API calls work (check browser console for errors)

---

## 🔧 Post-Deployment Configuration

### **Backend Environment Variables (Render)**

Ensure these are set:

```env
DATABASE_URL=postgresql://...          # From your PostgreSQL provider
JWT_SECRET=your-strong-secret          # Generated secret
FRONTEND_URL=https://your-app.vercel.app  # Your Vercel frontend URL
NODE_ENV=production
```

### **Frontend Environment Variables (Vercel)**

Ensure this is set:

```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com
```

---

## 🧪 Testing Deployment

### **Test Backend:**

1. **Health Check:**
   ```bash
   curl https://your-backend.onrender.com/health
   # Should return: {"status":"ok"}
   ```

2. **Test Login:**
   ```bash
   curl -X POST https://your-backend.onrender.com/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@army.mil","password":"admin123"}'
   ```

### **Test Frontend:**

1. Visit your Vercel URL
2. Login with test credentials:
   - Email: `admin@army.mil`
   - Password: `admin123`
3. Verify all pages load correctly
4. Test creating purchases, transfers, assignments

---

## 🐛 Troubleshooting

### **Backend Issues**

#### **Issue: Database connection fails**
- **Check:** `DATABASE_URL` is correct and accessible
- **Solution:** Verify connection string format and credentials

#### **Issue: CORS errors**
- **Check:** `FRONTEND_URL` matches your Vercel URL exactly
- **Solution:** Update `FRONTEND_URL` and redeploy backend

#### **Issue: Prisma client errors**
- **Check:** Build command includes `npx prisma generate`
- **Solution:** Ensure Prisma client is generated during build

### **Frontend Issues**

#### **Issue: API calls fail**
- **Check:** `NEXT_PUBLIC_API_URL` is set correctly
- **Solution:** Verify environment variable and redeploy

#### **Issue: Environment variable not working**
- **Check:** Variable name starts with `NEXT_PUBLIC_`
- **Solution:** Redeploy after adding environment variable

#### **Issue: Build fails**
- **Check:** Vercel build logs
- **Solution:** Verify all dependencies are in `package.json`

---

## 📝 Summary of Manual Steps

### **You Must Do:**

1. ✅ Create PostgreSQL database (Supabase/Neon/Render)
2. ✅ Deploy backend to Render
3. ✅ Set backend environment variables in Render
4. ✅ Run database migrations (`npx prisma migrate deploy`)
5. ✅ Deploy frontend to Vercel
6. ✅ Set `NEXT_PUBLIC_API_URL` in Vercel
7. ✅ Update backend `FRONTEND_URL` with Vercel URL
8. ✅ Test deployment

### **Automated:**

- ✅ Code changes for deployment readiness
- ✅ Environment variable configuration
- ✅ Database schema updates
- ✅ CORS configuration
- ✅ Prisma client singleton pattern

---

## 📚 Additional Resources

- **Render Documentation:** [render.com/docs](https://render.com/docs)
- **Vercel Documentation:** [vercel.com/docs](https://vercel.com/docs)
- **Prisma Migrations:** [prisma.io/docs/guides/migrate](https://www.prisma.io/docs/guides/migrate)
- **Next.js Deployment:** [nextjs.org/docs/deployment](https://nextjs.org/docs/deployment)

---

## ✅ Deployment Checklist

- [ ] PostgreSQL database created
- [ ] Backend deployed to Render
- [ ] Backend environment variables set
- [ ] Database migrations run
- [ ] Backend health check passes
- [ ] Frontend deployed to Vercel
- [ ] Frontend environment variable set
- [ ] Backend CORS updated with frontend URL
- [ ] Login functionality tested
- [ ] All pages load correctly
- [ ] API calls work without errors

---

**Status:** All code changes complete. Ready for manual deployment steps above.
