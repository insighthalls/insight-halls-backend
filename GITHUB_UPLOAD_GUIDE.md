# 📦 BACKEND CODE - DOWNLOAD & UPLOAD TO GITHUB

## 📁 FOLDER STRUCTURE

Your backend folder should look like this:

```
backend/
├── server_unified_login.js    (backend code)
├── package.json               (dependencies)
├── .env                       (credentials - DO NOT commit)
├── .gitignore                 (ignore .env)
└── node_modules/              (created by npm install)
```

---

## 📥 DOWNLOAD THESE FILES

Download all files from `/mnt/user-data/outputs/`:

1. **server_unified_login.js** → Rename to **server.js**
2. **backend_package.json** → Rename to **package.json**
3. **.env.example** → Create **.env**

---

## 🛠️ SETUP STEPS

### Step 1: Create Backend Folder on Your Computer

Create a folder: `backend`

### Step 2: Add Files to Backend Folder

1. Download `server_unified_login.js`
   - Save as: `server.js` (in backend folder)

2. Download `backend_package.json`
   - Save as: `package.json` (in backend folder)

3. Create `.env` file (in backend folder)
   - Copy content from `.env.example` below
   - Save as: `.env`

4. Create `.gitignore` file (in backend folder)
   - Add content below

### Step 3: Your Folder Should Now Look Like:

```
backend/
├── server.js
├── package.json
├── .env
└── .gitignore
```

---

## 📄 FILE CONTENTS

### FILE 1: server.js
**Source:** server_unified_login.js (download from above)

This is your main backend code. Just rename it to `server.js`

### FILE 2: package.json
**Source:** backend_package.json (download from above)

This lists all dependencies your backend needs.

### FILE 3: .env
**Copy this content exactly:**

```
SUPABASE_URL=https://ejmophbtpghszliuodyn.supabase.co
SUPABASE_ANON_KEY=sb_publishable_G7_ZYqV_RNTkjFOR5s16FA_8tX6P8uJ
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
NODE_ENV=development
PORT=3000
```

**IMPORTANT:** 
- Never commit this file to GitHub!
- It contains secret keys
- Add to .gitignore (see below)

### FILE 4: .gitignore
**Create this file with this content:**

```
node_modules/
.env
.env.local
.DS_Store
dist/
build/
*.log
.vercel
```

---

## 🚀 UPLOAD TO GITHUB

### Step 1: Create GitHub Repo

1. Go to https://github.com
2. Click **"+"** → **"New repository"**
3. Name: `insight-halls-backend`
4. Make it **Public**
5. Click **"Create repository"**

### Step 2: Push Code to GitHub

Open terminal in your **backend** folder and run:

```bash
git init
```

```bash
git add .
```

```bash
git commit -m "Initial commit - backend setup"
```

```bash
git branch -M main
```

```bash
git remote add origin https://github.com/YOUR-USERNAME/insight-halls-backend.git
```

```bash
git push -u origin main
```

**Replace YOUR-USERNAME with your actual GitHub username!**

---

## ✅ VERIFICATION

### Check GitHub
1. Go to your GitHub repo
2. You should see:
   - ✅ server.js
   - ✅ package.json
   - ✅ .gitignore
   - ❌ .env (NOT visible - good!)
   - ❌ node_modules (NOT visible - good!)

---

## 🌐 DEPLOY TO VERCEL

### Step 1: Go to Vercel
Visit: https://vercel.com

### Step 2: Import Project
1. Click **"Add New"** → **"Project"**
2. Select your GitHub repo: `insight-halls-backend`
3. Click **"Import"**

### Step 3: Add Environment Variables
In Vercel, add these variables:

```
SUPABASE_URL = https://ejmophbtpghszliuodyn.supabase.co
SUPABASE_ANON_KEY = sb_publishable_G7_ZYqV_RNTkjFOR5s16FA_8tX6P8uJ
JWT_SECRET = your-super-secret-jwt-key
NODE_ENV = production
PORT = 3000
```

### Step 4: Deploy
Click **"Deploy"**

Wait for ✅ checkmark.

You'll get a URL like: `https://insight-halls-backend.vercel.app`

---

## 📋 COMPLETE CHECKLIST

- [ ] Created `backend` folder
- [ ] Downloaded `server_unified_login.js` → renamed to `server.js`
- [ ] Downloaded `backend_package.json` → renamed to `package.json`
- [ ] Created `.env` with Supabase credentials
- [ ] Created `.gitignore` with content
- [ ] Folder has 4 files (server.js, package.json, .env, .gitignore)
- [ ] Ran: `git init`
- [ ] Ran: `git add .`
- [ ] Ran: `git commit -m "Initial commit"`
- [ ] Ran: `git remote add origin ...`
- [ ] Ran: `git push -u origin main`
- [ ] Files are on GitHub ✅
- [ ] Created Vercel account
- [ ] Imported GitHub repo to Vercel
- [ ] Added environment variables to Vercel
- [ ] Deployed to Vercel ✅
- [ ] Got Vercel URL ✅

---

## 🎯 RESULT

After following all steps:

✅ Backend code is on GitHub
✅ Backend is deployed on Vercel
✅ You have a live backend URL: `https://insight-halls-backend.vercel.app`
✅ Ready to connect frontend to it!

---

## 🆘 IF SOMETHING GOES WRONG

### ".env is showing on GitHub"
1. Go to GitHub repo
2. Click file → Delete
3. Add to .gitignore
4. Push again

### "Can't find module" error on Vercel
1. Make sure package.json is correct
2. Make sure server.js exists
3. Check for typos in filenames

### "Deployment failed"
1. Check Vercel logs
2. Look for error messages
3. Usually it's environment variables not set

---

## 📞 NEED HELP?

Tell me:
1. What step you're on
2. What error you see
3. What you've already done

I'll help fix it! 🚀

---

## ✨ FINAL URLS

Once live:

```
Frontend HTML: https://your-domain.netlify.app (or local)
Backend API: https://insight-halls-backend.vercel.app
Database: https://ejmophbtpghszliuodyn.supabase.co

Login works from anywhere! 🎉
```

---

**YOU'RE READY TO UPLOAD TO GITHUB!** 🚀
