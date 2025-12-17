# SAP Maintenance Tracking System - Test Accounts

## 🔐 Login Credentials

The database has been populated with realistic sample data. Use these accounts to test different roles:

### Administrator Account
- **Email:** `admin@sap-tech.com`
- **Password:** `admin123`
- **Access:** Full system access - all features unlocked

### Manager Account
- **Email:** `manager@sap-tech.com`
- **Password:** `manager123`
- **Access:** Can approve requisitions, manage teams, view all reports

### Supervisor Account
- **Email:** `supervisor@sap-tech.com`
- **Password:** `supervisor123`
- **Access:** Can create/edit maintenance tasks, manage inventory

### Operator Account
- **Email:** `operator@sap-tech.com`
- **Password:** `operator123`
- **Access:** Can view machines, create requisitions, update maintenance status

---

## 📊 Sample Data Included

### Sites (3)
- **TWSA Tangi** - Medium scale waste processing (50 tonnes/day)
- **TWSA Buliisa** - Large scale waste processing (100 tonnes/day)
- **TWSA DSB Kampala** - High capacity central hub (200 tonnes/day)

### Machines (7)
- 5 Tonne Composter Unit-A (Tangi) - Operational
- Shredder Machine-1 (Tangi) - Operational
- 10 Tonne Composter Unit-B (Buliisa) - Operational
- Conveyor Belt System-A (Buliisa) - Under Maintenance
- Industrial Compactor-1 (DSB) - Operational
- Sorting Conveyor System (DSB) - Operational
- Backup Generator (DSB) - Out of Service

### Inventory Items (8)
- Air Filter (Heavy Duty) - 15 in stock
- Conveyor Belt (20m) - 2 in stock ⚠️ Low stock
- Hydraulic Oil (20L) - 8 in stock ⚠️ Below minimum
- Shredder Blades (Set of 4) - 12 in stock
- Engine Oil (5L) - 20 in stock
- Grease (5kg) - 10 in stock
- Safety Gloves (Pair) - 50 in stock
- Safety Helmets - 25 in stock

### Maintenance Activities (6)
- ✅ Completed: Air filter replacement
- ✅ Completed: Shredder blade replacement
- ✅ Completed: Lubrication service
- 🔧 In Progress: Belt replacement on conveyor
- ⏳ Pending: Hydraulic system maintenance
- 🔴 Pending: Generator engine overhaul (Critical)

### Requisitions (3)
- ✅ Approved: Hydraulic oil for maintenance (REQ-2024-001)
- ✅ Approved: Emergency conveyor belt (REQ-2024-002)
- ⏳ Pending: PPE replenishment (REQ-2024-003)

---

## 🚀 Quick Start

1. **Start Backend Server:**
   ```powershell
   cd backend-server
   npm run dev
   ```
   Server runs on: `http://localhost:4000`

2. **Start Frontend:**
   ```powershell
   cd frontend-maintenance-software
   npm run dev
   ```
   Frontend runs on: `http://localhost:2000`

3. **Login:**
   - Navigate to `http://localhost:2000`
   - Use any of the test accounts above
   - Explore the system with real data!

---

## 🔄 Re-seeding Database

If you need to reset the database with fresh sample data:

```powershell
cd backend-server
node scripts/seed.js
```

This will clear all existing data and populate with new sample data.

---

## 📝 Notes

- All passwords are simple for testing purposes only
- Data is stored in MongoDB Atlas cloud database
- Sample data represents realistic waste management operations
- Low stock alerts are intentionally included for testing
- Different maintenance statuses are included for comprehensive testing

---

**Developed by SAP-Technologies Uganda**  
🌐 www.sap-technologies.com
