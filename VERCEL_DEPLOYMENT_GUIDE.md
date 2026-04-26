# 🚀 DEPLOY BACKEND ON VERCEL (FREE) - COMPLETE GUIDE

## ✅ WHAT YOU'LL GET

- ✅ Backend running online 24/7
- ✅ Free hosting (no credit card needed)
- ✅ Auto-redeploys when you push to GitHub
- ✅ URL like: `https://insight-halls-backend.vercel.app`
- ✅ No terminal needed after setup

---

## 📋 PREREQUISITES

- [ ] GitHub account (free from github.com)
- [ ] Vercel account (free from vercel.com)
- [ ] Your backend files ready
- [ ] .env file with Supabase credentials

---

## STEP 1: CREATE GITHUB REPOSITORY

### 1.1 Go to GitHub
1. Visit: https://github.com
2. Sign in (or create account if needed)

### 1.2 Create New Repository
1. Click **"+"** (top right)
2. Click **"New repository"**
3. Fill in:
   - Repository name: `insight-halls-backend`
   - Description: "Insight Halls Engineering Backend"
   - Public (selected)
4. Click **"Create repository"**

### 1.3 You'll see instructions
Keep this page open - you'll need the commands.

---

## STEP 2: PUSH BACKEND CODE TO GITHUB

### 2.1 Open Terminal in Backend Folder
```bash
cd backend
```

### 2.2 Initialize Git
```bash
git init
```

### 2.3 Add All Files
```bash
git add .
```

### 2.4 Create First Commit
```bash
git commit -m "Initial commit - backend setup"
```

### 2.5 Add GitHub as Remote
Copy from GitHub page, replace YOUR-USERNAME:
```bash
git remote add origin https://github.com/YOUR-USERNAME/insight-halls-backend.git
```

### 2.6 Push to GitHub
```bash
git branch -M main
git push -u origin main
```

**Wait for it to complete. You should see files on GitHub!**

---

## STEP 3: CREATE VERCEL ACCOUNT

### 3.1 Go to Vercel
Visit: https://vercel.com

### 3.2 Sign Up
1. Click **"Sign Up"**
2. Click **"Continue with GitHub"**
3. Authorize Vercel to access GitHub
4. Done! ✅

---

## STEP 4: DEPLOY TO VERCEL

### 4.1 In Vercel Dashboard
1. Click **"Add New..."** (top right)
2. Click **"Project"**

### 4.2 Import GitHub Repository
1. You should see your repos listed
2. Find: `insight-halls-backend`
3. Click **"Import"**

### 4.3 Configure Project
1. Framework: Leave as **"Other"**
2. Root Directory: Leave blank
3. Build Command: Leave blank
4. Output Directory: Leave blank
5. Click **"Deploy"**

### 4.4 Add Environment Variables
**IMPORTANT - Don't skip this!**

1. While deploying, you'll see: **"Environment Variables"**
2. Add these variables:

```
SUPABASE_URL
Value: https://ejmophbtpghszliuodyn.supabase.co

SUPABASE_ANON_KEY
Value: sb_publishable_G7_ZYqV_RNTkjFOR5s16FA_8tX6P8uJ

JWT_SECRET
Value: your-super-secret-32-character-string

NODE_ENV
Value: production

PORT
Value: 3000
```

3. Click **"Deploy"**

### 4.5 Wait for Deployment
- You'll see a loading animation
- Once done, you'll see a ✅ checkmark
- You'll get a URL like: `https://insight-halls-backend.vercel.app`
- **Copy this URL!**

---

## STEP 5: UPDATE HTML FILE

### 5.1 Edit HTML API URL

Open `index_unified_login.html` and find line 613:

**CHANGE THIS:**
```javascript
const API_URL = 'http://localhost:3000/api';
```

**TO THIS (use your actual Vercel URL):**
```javascript
const API_URL = 'https://insight-halls-backend.vercel.app/api';
```

Save the file.

---

## STEP 6: TEST ONLINE

### 6.1 Test Backend Health
Open in browser:
```
https://insight-halls-backend.vercel.app/api/health
```

You should see:
```json
{"success":true,"message":"Server is running"...}
```

✅ Backend is online!

### 6.2 Test Login
1. Open your HTML file
2. Click "Login"
3. Try: `isaac.mzokomera@insighthalls.com` / `partner123`
4. Should work! ✅

---

## 🎯 WHAT HAPPENS WHEN YOU PUSH CODE

Now every time you push to GitHub:

```bash
git add .
git commit -m "Update description"
git push
```

Vercel will **automatically redeploy** your backend!

No need to do anything - it happens automatically.

---

## 📊 YOUR FINAL SETUP

```
Website (HTML)
    ↓ Login request to
Backend (Online on Vercel)
    ↓ Queries data from
Supabase (Database)
```

All 3 are now online! 🎉

---

## 🆘 TROUBLESHOOTING

### Deployment fails
1. Check .env file is correct
2. Check package.json exists
3. Check server.js has correct PORT
4. Redeploy: Click "Redeploy" in Vercel

### Login still fails with online backend
1. Check HTML has correct Vercel URL
2. Check SUPABASE_URL in Vercel matches
3. Check SUPABASE_ANON_KEY in Vercel matches
4. Open browser console (F12) → Network tab → see what error

### "502 Bad Gateway" error
1. Backend might have crashed
2. Check Vercel logs: Click project → Logs
3. Look for error messages
4. Fix and redeploy

### Can't see my changes online
1. Make sure you pushed to GitHub: `git push`
2. Wait 30 seconds for Vercel to redeploy
3. Refresh browser
4. Clear cache: Ctrl+Shift+Delete

---

## ✅ FINAL CHECKLIST

- [ ] GitHub account created
- [ ] Backend code pushed to GitHub
- [ ] Vercel account created
- [ ] Project imported to Vercel
- [ ] Environment variables added to Vercel
- [ ] Deployment successful (green checkmark)
- [ ] Got Vercel URL: `https://...vercel.app`
- [ ] HTML API_URL updated to Vercel URL
- [ ] Login works online ✅

---

## 🎉 YOU NOW HAVE ONLINE BACKEND!

Your backend is running 24/7 on Vercel!

Anyone can now login from anywhere:
```
https://your-domain.com
    ↓
Connects to backend on Vercel
    ↓
Queries Supabase database
    ↓
Admin/Partner login successful! ✅
```

---

## 📈 NEXT STEPS

1. **Deploy frontend** (HTML) to Netlify
2. **Update API URL** in HTML to Vercel
3. **Go live!** 🚀

---

## 💡 PRO TIPS

1. **Custom Domain** (optional):
   - In Vercel: Settings → Domains
   - Add your custom domain

2. **Monitor Performance**:
   - In Vercel: Analytics
   - See request counts, response times

3. **View Logs**:
   - In Vercel: Logs
   - Debug errors in real-time

4. **Environment Secrets**:
   - Never commit .env to GitHub
   - Always add to Vercel environment variables

---

## 🚀 YOUR BACKEND IS LIVE!

Backend URL: `https://insight-halls-backend.vercel.app`

You can now:
- ✅ Share backend URL with team
- ✅ Deploy frontend to production
- ✅ Go live to public! 🎉

---

**Total setup time: 10-15 minutes**
**Cost: FREE**
**Status: PRODUCTION READY** ✅
