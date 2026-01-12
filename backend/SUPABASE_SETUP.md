# Supabase Database Setup Guide

## ✅ Connection String Format

Your Supabase PostgreSQL connection string format:

```
postgresql://postgres:deepakv883deepak@db.hmadcpoaiwqcglkqvyph.supabase.co:5432/postgres
```

## 🔐 Security Note

**IMPORTANT:** The connection string above contains your database password. 

**Do NOT:**
- ❌ Commit this to Git
- ❌ Share it publicly
- ❌ Put it in version control

**Do:**
- ✅ Store it securely in environment variables
- ✅ Use Render/Vercel environment variable settings
- ✅ Keep it private

## 📝 How to Use This Connection String

### **For Local Testing (Optional)**

If you want to test PostgreSQL locally before deploying:

1. **Create `backend/.env` file** (if it doesn't exist):
   ```env
   DATABASE_URL="postgresql://postgres:deepakv883deepak@db.hmadcpoaiwqcglkqvyph.supabase.co:5432/postgres?sslmode=require"
   JWT_SECRET="your-local-jwt-secret"
   PORT=4000
   ```

2. **Note:** Add `?sslmode=require` for secure connection (Supabase requires SSL)

### **For Production (Render)**

1. **Go to Render Dashboard:**
   - Navigate to your backend service
   - Go to "Environment" tab

2. **Add Environment Variable:**
   - **Name:** `DATABASE_URL`
   - **Value:** `postgresql://postgres:deepakv883deepak@db.hmadcpoaiwqcglkqvyph.supabase.co:5432/postgres?sslmode=require`
   - **Important:** Add `?sslmode=require` at the end for SSL connection

3. **Save and Redeploy**

## 🔒 SSL Connection

Supabase requires SSL connections. Make sure to add `?sslmode=require` to your connection string:

**Correct Format:**
```
postgresql://postgres:deepakv883deepak@db.hmadcpoaiwqcglkqvyph.supabase.co:5432/postgres?sslmode=require
```

## 📋 Next Steps

1. ✅ Connection string obtained
2. ⏳ Set `DATABASE_URL` in Render environment variables
3. ⏳ Run Prisma migrations: `npx prisma migrate deploy`
4. ⏳ Seed database (optional): `npm run seed`

## 🧪 Testing Connection

After setting up, test the connection:

```bash
# In Render shell or locally
cd backend
npx prisma db pull
```

If successful, you'll see your database schema.

## ⚠️ Troubleshooting

### **Issue: Connection timeout**
- **Solution:** Check Supabase dashboard → Settings → Database → Connection pooling
- Use connection pooler URL if available

### **Issue: SSL required error**
- **Solution:** Add `?sslmode=require` to connection string

### **Issue: Authentication failed**
- **Solution:** Verify password is correct in Supabase dashboard
- Reset password if needed: Supabase Dashboard → Settings → Database → Reset Database Password

---

**Status:** Connection string ready. Proceed to Render deployment and set environment variable.
