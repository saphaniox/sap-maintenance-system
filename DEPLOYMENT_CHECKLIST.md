# 🚀 Deployment Checklist

## ✅ Critical Issues Fixed

The following critical security issues have been resolved:

- ✅ **Security vulnerabilities**: All npm package vulnerabilities fixed (4 → 0)
- ✅ **JWT Secret validation**: Server now requires JWT_SECRET before starting
- ✅ **Input validation**: Added express-validator to login and registration endpoints
- ✅ **Port configuration**: Fixed port mismatch (backend: 8000, frontend: 3500)
- ✅ **CORS configuration**: Updated frontend URL to match Vite config
- ✅ **.env security**: Added .env files to .gitignore

---

## 📋 Pre-Deployment Tasks

### 1. Environment Configuration

#### Backend (.env)
Current configuration is set for **local development**. Before deploying:

```bash
cd backend-server
```

Update these values in `.env`:

```env
# Change to production
NODE_ENV=production

# Use your MongoDB Atlas connection string
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority

# SECURITY: Generate NEW JWT_SECRET for production (don't use dev key!)
# Run this command and paste the output:
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<your-new-production-secret>

# Update with your production frontend URL
FRONTEND_URL=https://your-frontend-domain.com

# Configure email if using notifications
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-app-password
```

#### Frontend (.env)
Update the API URL to point to your production backend:

```env
VITE_API_URL=https://your-backend-api-domain.com
```

---

### 2. Database Setup

- [ ] Create MongoDB Atlas account (free tier available)
- [ ] Create a new cluster
- [ ] Create database user with password
- [ ] Whitelist your deployment server's IP (or use 0.0.0.0/0 for any IP)
- [ ] Get connection string and update `MONGODB_URI`
- [ ] Test connection locally first

---

### 3. Build & Test Locally

#### Backend
```bash
cd backend-server
npm install
npm start
```

Should see:
```
✅ Connected to MongoDB successfully
🚀 Server is up and running!
📍 http://localhost:8000
```

If it crashes with "JWT_SECRET is required", you forgot to set it in `.env`.

#### Frontend
```bash
cd frontend-maintenance-software
npm install
npm run build    # Test production build
npm run preview  # Preview production build
```

---

### 4. Security Checklist

- [ ] **JWT_SECRET**: Generated strong random secret for production
- [ ] **Database credentials**: Not exposed in code or public repos
- [ ] **Email credentials**: Using app-specific passwords (not main password)
- [ ] **CORS**: Configured to allow only your frontend domain
- [ ] **.env files**: Never committed to git (check with `git status`)
- [ ] **HTTPS**: Enabled on both frontend and backend
- [ ] **Rate limiting**: Consider adding `express-rate-limit` for production

---

### 5. Deployment Options

#### Recommended Stack:

**Frontend (Vite/React):**
- **Vercel** (Easiest)
  - Connect GitHub repo
  - Auto-deploys on push
  - Free SSL
  - Set environment variable: `VITE_API_URL`

**Backend (Node.js/Express):**
- **Railway.app** (Easiest)
  - Connect GitHub repo
  - Add MongoDB Atlas URL
  - Add all environment variables from `.env`
  - Auto-deploys on push
  
**Database:**
- **MongoDB Atlas** (Free tier: 512MB)

#### Alternative Options:

**Backend:**
- Render.com (free tier, slower cold starts)
- Heroku (paid, easier)
- DigitalOcean App Platform
- AWS EC2 (more control, more complex)

**Frontend:**
- Netlify (similar to Vercel)
- AWS S3 + CloudFront
- GitHub Pages (static only)

---

### 6. Deployment Steps

#### Deploy Backend (Railway Example)

1. Push your code to GitHub
2. Go to [railway.app](https://railway.app)
3. Click "Start a New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables:
   ```
   NODE_ENV=production
   PORT=8000
   MONGODB_URI=<your-mongodb-atlas-uri>
   JWT_SECRET=<your-production-secret>
   FRONTEND_URL=<your-frontend-url>
   EMAIL_USER=<optional>
   EMAIL_PASSWORD=<optional>
   ```
6. Deploy and note your backend URL (e.g., `https://your-app.railway.app`)

#### Deploy Frontend (Vercel Example)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project" → Import your repository
4. Framework: Vite
5. Root Directory: `frontend-maintenance-software`
6. Add environment variable:
   ```
   VITE_API_URL=https://your-backend-url.railway.app
   ```
7. Deploy

---

### 7. Post-Deployment Testing

- [ ] Visit your frontend URL
- [ ] Test user registration
- [ ] Test user login
- [ ] Test creating a machine
- [ ] Test creating maintenance record
- [ ] Test role-based permissions
- [ ] Test file upload (avatar)
- [ ] Check browser console for errors
- [ ] Test on mobile device
- [ ] Verify email notifications (if configured)

---

### 8. Create Admin Account

After deployment, you need an admin account:

1. Register a new account through the UI (will be 'operator' role)
2. Connect to your MongoDB Atlas database
3. Find your user in the `users` collection
4. Change `role` from `"operator"` to `"administrator"`
5. Log out and log back in

Or use MongoDB Compass or the web interface.

---

### 9. Monitoring & Maintenance

#### Recommended Tools:
- **Error tracking**: [Sentry](https://sentry.io) (free tier available)
- **Uptime monitoring**: [UptimeRobot](https://uptimerobot.com) (free)
- **Analytics**: [Google Analytics](https://analytics.google.com) or [Plausible](https://plausible.io)

#### Database Backups:
- MongoDB Atlas has automatic backups (configure in Atlas dashboard)
- Consider setting up daily snapshots

---

### 10. Common Issues & Solutions

#### "Cannot connect to database"
- Check MongoDB Atlas IP whitelist
- Verify connection string format
- Check username/password (no special chars unencoded)

#### "CORS error"
- Update `FRONTEND_URL` in backend .env
- Restart backend after changing .env

#### "JWT_SECRET is required"
- You forgot to set JWT_SECRET in production environment variables
- Check your hosting platform's environment variable settings

#### "502 Bad Gateway"
- Backend might not be running
- Check backend logs
- Verify PORT environment variable

#### Frontend shows blank page
- Check browser console for errors
- Verify `VITE_API_URL` is correct
- Make sure API is accessible from browser (CORS)

---

## 🎉 You're Ready to Deploy!

All critical security issues are fixed. Follow the checklist above and you'll be live in no time.

**Need help?** Check the documentation for:
- [MongoDB Atlas](https://www.mongodb.com/docs/atlas/)
- [Railway](https://docs.railway.app/)
- [Vercel](https://vercel.com/docs)

**Good luck with your deployment! 🚀**
