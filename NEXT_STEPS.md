# ✅ Backend Deployment Complete - Next Steps

## 🎉 Your Backend is Live!

**Backend URL:** https://military-asset-kristall-1.onrender.com/

---

## 📋 Immediate Next Steps

### Step 1: Run Database Migrations ⚠️ **REQUIRED**

Your database is empty. You need to create the tables:

1. **Go to Render Dashboard:**
   - Visit: https://dashboard.render.com
   - Click on your service: `military-asset-kristall-1`
   - Click **"Shell"** tab (in the left sidebar)

2. **Run Migration Command:**
   ```bash
   cd backend
   npx prisma migrate deploy
   ```

3. **Seed Database (Optional - for test data):**
   ```bash
   npm run seed
   ```

This will create all tables in your Supabase database.

---

### Step 2: Verify Backend is Working

**Test Health Endpoint:**
- Visit: https://military-asset-kristall-1.onrender.com/health
- Should return: `{"status":"ok"}`

**Test Root Endpoint:**
- Visit: https://military-asset-kristall-1.onrender.com/
- Should show: "Military Asset Management Backend is running"

---

### Step 3: Test Login (After Migrations)

Once migrations are done, test login:

**Using Browser:**
- Visit: https://military-asset-kristall-1.onrender.com/auth/login
- (This will show an error because it needs POST, but confirms endpoint exists)

**Using curl (if you have it):**
```bash
curl -X POST https://military-asset-kristall-1.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@army.mil","password":"admin123"}'
```

---

### Step 4: Update Environment Variables (If Needed)

Check your Render environment variables:

1. Go to Render Dashboard → Your Service → **"Environment"** tab
2. Verify these are set:
   - ✅ `DATABASE_URL` - Your Supabase connection string
   - ✅ `JWT_SECRET` - Your generated secret
   - ⚠️ `FRONTEND_URL` - Update this after deploying frontend
   - ✅ `NODE_ENV` - Should be `production`

---

### Step 5: Deploy Frontend to Vercel

Now that backend is working:

1. **Go to Vercel:** https://vercel.com
2. **Import your GitHub repository:** `deepakv00/military-asset-kristall`
3. **Set Environment Variable:**
   - Name: `NEXT_PUBLIC_API_URL`
   - Value: `https://military-asset-kristall-1.onrender.com`
4. **Deploy**

5. **Update Backend CORS:**
   - Go back to Render → Environment
   - Update `FRONTEND_URL` to your Vercel URL
   - Redeploy backend (or it auto-redeploys)

---

## 🐛 Troubleshooting

### Issue: Health endpoint works but login fails
- **Solution:** Run migrations first (`npx prisma migrate deploy`)

### Issue: Database connection errors
- **Check:** `DATABASE_URL` includes `?sslmode=require`
- **Check:** Password in connection string is correct

### Issue: CORS errors (after frontend deployment)
- **Solution:** Update `FRONTEND_URL` in Render environment variables

---

## ✅ Checklist

- [x] Backend deployed to Render
- [x] Backend is live and accessible
- [ ] Database migrations run
- [ ] Database seeded (optional)
- [ ] Health endpoint verified
- [ ] Frontend deployed to Vercel
- [ ] `NEXT_PUBLIC_API_URL` set in Vercel
- [ ] `FRONTEND_URL` updated in Render
- [ ] Full application tested

---

**Current Status:** Backend is live! ⚠️ **Run migrations next!**
