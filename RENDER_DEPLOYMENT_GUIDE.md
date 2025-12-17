# 🚀 Deploying SAP Maintenance System to Render

This guide walks you through deploying both the backend API and frontend application to Render.com.

## 📋 Prerequisites

- ✅ GitHub account
- ✅ Render account (free at [render.com](https://render.com))
- ✅ MongoDB Atlas account (free at [mongodb.com/cloud/atlas](https://cloud.mongodb.com))
- ✅ Your code pushed to GitHub repository

---

## 🗄️ Step 1: Set Up MongoDB Atlas

### 1.1 Create Database Cluster
1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Click **"Create"** → **"Shared"** (Free tier)
3. Choose **AWS** as cloud provider
4. Select region closest to your users (e.g., `us-east-1`)
5. Cluster Name: `sap-maintenance-cluster`
6. Click **"Create Cluster"**

### 1.2 Create Database User
1. Go to **Database Access** (left sidebar)
2. Click **"Add New Database User"**
3. Authentication Method: **Password**
4. Username: `sap-admin` (or your choice)
5. Password: **Generate** a strong password (save it securely!)
6. Database User Privileges: **Read and write to any database**
7. Click **"Add User"**

### 1.3 Configure Network Access
1. Go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (for Render deployment)
   - IP Address: `0.0.0.0/0`
   - Comment: `Render deployment`
4. Click **"Confirm"**

⚠️ **Production Note**: For better security, use Render's specific IP ranges instead of `0.0.0.0/0`

### 1.4 Get Connection String
1. Go to **Database** → Click **"Connect"** on your cluster
2. Choose **"Connect your application"**
3. Driver: **Node.js**, Version: **5.5 or later**
4. Copy the connection string:
   ```
   mongodb+srv://sap-admin:<password>@sap-maintenance-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. Add database name: `maintenance-tracker` after `.net/`
   ```
   mongodb+srv://sap-admin:YOUR_PASSWORD@sap-maintenance-cluster.xxxxx.mongodb.net/maintenance-tracker?retryWrites=true&w=majority
   ```

---

## 🔐 Step 2: Generate JWT Secret

Generate a secure random JWT secret (64+ characters):

**Windows PowerShell:**
```powershell
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Linux/Mac:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Copy the output** - you'll need this for environment variables.

---

## 📤 Step 3: Push Code to GitHub

### 3.1 Verify .env is Protected
```powershell
# Check if .env is in .gitignore
Get-Content .gitignore | Select-String ".env"

# Check git status (should NOT show .env file)
git status
```

If `.env` is not in `.gitignore`, add it immediately:
```powershell
Add-Content -Path ".gitignore" -Value "`n.env`n.env.local`n.env.production"
```

### 3.2 Commit and Push
```powershell
git add .
git commit -m "Add Render deployment configuration"
git push origin main
```

---

## 🌐 Step 4: Deploy Backend to Render

### 4.1 Create Backend Web Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure service:
   - **Name**: `sap-maintenance-backend`
   - **Region**: Oregon (US West) or closest to you
   - **Branch**: `main`
   - **Root Directory**: `backend-server`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### 4.2 Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"** and add:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PORT` | `8000` | Backend port |
| `MONGODB_URI` | `mongodb+srv://sap-admin:YOUR_PASSWORD@...` | From Step 1.4 |
| `JWT_SECRET` | `your_64_char_random_string` | From Step 2 |
| `FRONTEND_URL` | Leave empty for now | Will update after frontend deployment |

### 4.3 Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (2-3 minutes)
3. Once live, copy your backend URL:
   ```
   https://sap-maintenance-backend.onrender.com
   ```

### 4.4 Test Backend
Open in browser or use curl:
```powershell
Invoke-WebRequest -Uri "https://sap-maintenance-backend.onrender.com/api/health"
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-16T...",
  "uptime": 123.45,
  "environment": "production"
}
```

---

## 🎨 Step 5: Deploy Frontend to Render

### 5.1 Create Static Site
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"Static Site"**
3. Connect your GitHub repository
4. Configure site:
   - **Name**: `sap-maintenance-frontend`
   - **Region**: Oregon (same as backend for lower latency)
   - **Branch**: `main`
   - **Root Directory**: `frontend-maintenance-software`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

### 5.2 Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://sap-maintenance-backend.onrender.com` |
| `NODE_ENV` | `production` |

### 5.3 Configure Redirects/Rewrites (for SPA)
Render auto-detects `render.yaml` which includes SPA routing configuration.

If not using `render.yaml`, create a `_redirects` file in `frontend-maintenance-software/public/`:
```
/*    /index.html    200
```

### 5.4 Deploy
1. Click **"Create Static Site"**
2. Wait for build and deployment (3-5 minutes)
3. Once live, copy your frontend URL:
   ```
   https://sap-maintenance-frontend.onrender.com
   ```

---

## 🔗 Step 6: Update Backend CORS Configuration

### 6.1 Update Backend Environment Variables
1. Go to your **backend service** on Render
2. Click **"Environment"** (left sidebar)
3. Find `FRONTEND_URL` variable
4. Update value to: `https://sap-maintenance-frontend.onrender.com`
5. Click **"Save Changes"**

Backend will automatically redeploy with new CORS settings.

---

## ✅ Step 7: Verify Deployment

### 7.1 Test Backend Health
```powershell
Invoke-WebRequest -Uri "https://sap-maintenance-backend.onrender.com/api/health"
```

### 7.2 Test Frontend
1. Open browser: `https://sap-maintenance-frontend.onrender.com`
2. You should see the login page
3. Try logging in with test account:
   - Email: `admin@sap-tech.com`
   - Password: `Admin@1234`

### 7.3 Test End-to-End
1. **Login** with admin account
2. **Navigate** to Dashboard (should load stats)
3. **Create** a new machine
4. **View** maintenance records
5. **Check** notifications

---

## 🔒 Step 8: Security Checklist

After deployment, verify:

- [x] ✅ `.env` file is **not** in GitHub repository
- [x] ✅ MongoDB password is **strong** (16+ characters)
- [x] ✅ JWT_SECRET is **64+ characters** and randomly generated
- [x] ✅ MongoDB IP whitelist configured (0.0.0.0/0 or specific IPs)
- [x] ✅ HTTPS enabled (automatic on Render)
- [x] ✅ CORS configured with actual frontend URL
- [x] ✅ Rate limiting active (5 login attempts per 15 minutes)
- [x] ✅ Security headers enabled (helmet.js)
- [x] ✅ Password complexity enforced (8+ chars, mixed case, numbers, symbols)

---

## 🐛 Troubleshooting

### Backend Won't Start
**Check logs**: Render Dashboard → Backend Service → "Logs" tab

Common issues:
- **Missing environment variables**: Verify all required vars are set
- **MongoDB connection failed**: Check connection string and IP whitelist
- **Port binding error**: Ensure `PORT` env var is set to `8000`

### Frontend Shows Blank Page
**Check browser console**: F12 → Console tab

Common issues:
- **API URL not set**: Verify `VITE_API_URL` environment variable
- **CORS errors**: Verify `FRONTEND_URL` is set in backend
- **Build failed**: Check Render logs for npm build errors

### Database Connection Issues
```
MongoServerError: bad auth: Authentication failed
```
**Solution**: Verify MongoDB username/password in connection string

```
MongoServerError: IP not in whitelist
```
**Solution**: Add `0.0.0.0/0` to MongoDB Network Access

### 502 Bad Gateway
**Cause**: Backend service is down or starting up
**Solution**: Wait 1-2 minutes for service to fully start, check backend logs

---

## 🎉 Success!

Your SAP Maintenance System is now live on Render:

- **Frontend**: https://sap-maintenance-frontend.onrender.com
- **Backend**: https://sap-maintenance-backend.onrender.com

### Free Tier Limitations
⚠️ Render free tier services:
- **Spin down after 15 minutes** of inactivity
- **Cold starts** take 30-60 seconds on first request
- **750 hours/month** per service (sufficient for testing)

For production use, upgrade to **Starter plan** ($7/month) for:
- ✅ No spin-down
- ✅ Instant response times
- ✅ Better performance

---

## 📚 Next Steps

1. **Set up monitoring**: Configure Render health checks and alerts
2. **Add custom domain**: Point your domain to Render services
3. **Enable backups**: Set up MongoDB Atlas automated backups
4. **Configure email**: Add Gmail credentials for email notifications
5. **Monitor logs**: Regularly check Render logs for errors

---

## 🆘 Need Help?

- **Render Documentation**: https://render.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com
- **Project Issues**: Open an issue on GitHub
- **Security Guide**: See `SECURITY.md` in repository

---

**Last Updated**: December 16, 2025
**Deployment Status**: ✅ Production Ready
