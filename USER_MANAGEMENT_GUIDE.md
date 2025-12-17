# User Management System - Quick Reference

## ✅ What Was Added

A complete user management system for administrators to manage user accounts and assign roles.

### Backend Components

**File: `backend-server/routes/users.js`**
- ✅ GET `/api/users` - List all users (with filters)
- ✅ GET `/api/users/:id` - Get single user
- ✅ PATCH `/api/users/:id/role` - Update user role (admin only)
- ✅ PATCH `/api/users/:id/status` - Activate/deactivate user (admin only)
- ✅ PATCH `/api/users/:id` - Update user details (admin only)
- ✅ DELETE `/api/users/:id` - Delete user (admin only)
- ✅ GET `/api/users/stats/overview` - Get user statistics (admin only)

**File: `backend-server/server.js`**
- ✅ Added users route: `app.use('/api/users', usersRoutes)`

### Frontend Components

**File: `frontend-maintenance-software/src/views/Users.jsx`**
- Complete user management interface
- User list with search and filtering
- Role management dropdown (admin only)
- Activate/deactivate users
- Edit user details
- Delete users
- User statistics dashboard

**File: `frontend-maintenance-software/src/services/user.service.js`**
- API service for all user management operations

**File: `frontend-maintenance-software/src/styles/pages/Users.css`**
- Styling for the user management page

**File: `frontend-maintenance-software/src/App.jsx`**
- ✅ Added `/users` route

**File: `frontend-maintenance-software/src/components/Layout.jsx`**
- ✅ Added "Users" navigation link (visible only to admins and managers)

---

## 🔐 Permissions

### Who Can Access User Management?

**View Users (Read-Only):**
- ✅ Administrators
- ✅ Managers

**Manage Users (Full Control):**
- ✅ Administrators only

### What Admins Can Do:
- ✅ View all users
- ✅ Change user roles (operator, supervisor, manager, administrator)
- ✅ Activate/deactivate user accounts
- ✅ Edit user details (name, email, department, phone)
- ✅ Delete users
- ✅ View user statistics

### Safety Features:
- ❌ Admins cannot change their own role
- ❌ Admins cannot deactivate their own account
- ❌ Admins cannot delete their own account

---

## 🎯 How to Use

### Access the User Management Page

1. **Login as Administrator or Manager**
2. **Navigate to "Users"** in the top navigation menu
3. You'll see the user management dashboard

### Features Available:

#### 1. User Statistics
- Total users count
- Active/inactive users
- Users by role breakdown

#### 2. Filter Users
- **Search**: By name or email
- **Role Filter**: Show specific role only
- **Status Filter**: Active or inactive users

#### 3. Manage Individual Users (Admin Only)
- **Change Role**: Click the role dropdown to change user role
- **Edit Details**: Click ✏️ to edit name, email, department, phone
- **Toggle Status**: Click 🔒/🔓 to activate/deactivate
- **Delete User**: Click 🗑️ to permanently remove user

---

## 🚀 Testing the Feature

### 1. Start the Backend
```bash
cd backend-server
npm start
```

### 2. Start the Frontend
```bash
cd frontend-maintenance-software
npm run dev
```

### 3. Create Test Users

**Register some test accounts:**
- Go to http://localhost:3500/signup
- Create accounts with different emails
- All new users start as "operator" role

### 4. Create an Admin Account

**Option A: Update via Database**
1. Connect to MongoDB (Atlas or Compass)
2. Find your user in the `users` collection
3. Change `role` from `"operator"` to `"administrator"`
4. Log out and log back in

**Option B: Update via MongoDB Shell**
```javascript
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { role: "administrator" } }
)
```

### 5. Test User Management

1. Login as administrator
2. Navigate to `/users`
3. You should see all registered users
4. Test changing roles
5. Test activating/deactivating users
6. Test editing user details
7. Test deleting a user

---

## 📊 API Endpoints Reference

### Get All Users
```
GET /api/users
Query Params: ?role=administrator&isActive=true&search=john
```

### Change User Role
```
PATCH /api/users/:id/role
Body: { "role": "manager" }
```

### Toggle User Status
```
PATCH /api/users/:id/status
Body: { "isActive": false }
```

### Update User Details
```
PATCH /api/users/:id
Body: { "name": "New Name", "email": "new@email.com" }
```

### Delete User
```
DELETE /api/users/:id
```

### Get Statistics
```
GET /api/users/stats/overview
```

---

## 🎨 UI Features

### Role Badges (Color-Coded)
- 🔴 **Administrator** - Red
- 🟣 **Manager** - Purple
- 🔵 **Supervisor** - Blue
- 🟢 **Operator** - Green

### Status Indicators
- ✅ **Active** - Green badge
- ⛔ **Inactive** - Red badge

### Actions
- ✏️ Edit user details
- 🔒 Deactivate account
- 🔓 Activate account
- 🗑️ Delete user

---

## 🔒 Security Notes

1. **All endpoints require authentication** (JWT token)
2. **Role-based access control** enforced on backend
3. **Input validation** on all user updates
4. **Email uniqueness** enforced
5. **Self-modification prevented** (can't change own role/status/delete)

---

## ✅ You're Ready!

The user management system is now fully integrated and ready to use. Admins can now:
- ✅ See all users in the system
- ✅ Assign appropriate roles to new users
- ✅ Manage user access and permissions
- ✅ Monitor user activity

**Happy managing! 🎉**
