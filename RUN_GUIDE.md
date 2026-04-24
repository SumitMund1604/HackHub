# 🚀 HackHub - Complete Run Guide

## Prerequisites

Make sure you have these installed:
- **Node.js** (v14+) → [Download](https://nodejs.org)
- **PostgreSQL** (v12+) → [Download](https://www.postgresql.org/download/)

---

## Step 1: Set Up the Database

Open **Command Prompt** or **PowerShell** and run these commands one by one:

```bash
# Connect to PostgreSQL (enter your password when prompted)
psql -U postgres
```

Once inside the `psql` prompt (`postgres=#`), run:

```sql
-- Drop old database if it exists
DROP DATABASE IF EXISTS hackhub;

-- Create fresh database
CREATE DATABASE hackhub;

-- Connect to it
\c hackhub

-- Exit psql
\q
```

---

## Step 2: Create Tables & Load Seed Data

Still in Command Prompt, navigate to the backend folder and run the SQL files:

```bash
cd "c:\Users\ASUS\OneDrive\Desktop\Work\New folder\HackHub-Backend"

# Create all tables
psql -U postgres -d hackhub -f table.sql

# Load sample data
psql -U postgres -d hackhub -f seed.sql
```

> **Note:** If `psql` is not recognized, add PostgreSQL's bin folder to your PATH.  
> Typical path: `C:\Program Files\PostgreSQL\16\bin` (adjust version number).

---

## Step 3: Check Database Password

Open `HackHub-Backend\db.js` and verify the password matches your PostgreSQL password:

```javascript
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    database: 'hackhub',
    user: 'postgres',
    password: 'sam2026'    // ← Change this to YOUR PostgreSQL password
});
```

---

## Step 4: Install Backend Dependencies

```bash
cd "c:\Users\ASUS\OneDrive\Desktop\Work\New folder\HackHub-Backend"

npm install
```

This installs: `express`, `pg`, `cors`, `bcryptjs`

---

## Step 5: Start the Backend Server

```bash
node server.js
```

You should see:
```
Connected to PostgreSQL - hackhub database
HackHub Backend running on http://localhost:3000
API ready at http://localhost:3000/api
```

> **Keep this terminal open!** The server must stay running.

---

## Step 6: Open the Frontend

Open a **new** terminal/command prompt:

```bash
cd "c:\Users\ASUS\OneDrive\Desktop\Work\New folder\HackHub-Frontend"

# Option A: Using Python (if installed)
python -m http.server 8080

# Option B: Using Node.js
npx -y serve .

# Option C: Just open the file directly
start index.html
```

Then open your browser and go to:
- **With server:** `http://localhost:8080` (or the port shown)
- **Without server:** Just double-click `index.html`

---

## Step 7: Test Login

Use any of these test accounts (all passwords are `password123`):

| Email | Role | Name |
|-------|------|------|
| `sumit@email.com` | Student | Sumit Mund |
| `ankit@email.com` | Student | Ankit Patel |
| `rajesh@email.com` | Organizer | Prof. Rajesh Kumar |
| `admin@hackhub.com` | Admin | Admin User |
| `vikram@email.com` | Student | Vikram Reddy |

---

## Quick Start (All Commands Together)

```bash
# 1. Database setup
psql -U postgres -c "DROP DATABASE IF EXISTS hackhub;"
psql -U postgres -c "CREATE DATABASE hackhub;"
psql -U postgres -d hackhub -f "c:\Users\ASUS\OneDrive\Desktop\Work\New folder\HackHub-Backend\table.sql"
psql -U postgres -d hackhub -f "c:\Users\ASUS\OneDrive\Desktop\Work\New folder\HackHub-Backend\seed.sql"

# 2. Backend
cd "c:\Users\ASUS\OneDrive\Desktop\Work\New folder\HackHub-Backend"
npm install
node server.js
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `psql` not recognized | Add `C:\Program Files\PostgreSQL\16\bin` to system PATH |
| Connection refused on port 5432 | Make sure PostgreSQL service is running (check Services app) |
| Password authentication failed | Update password in `db.js` to match your PostgreSQL password |
| `Cannot find module 'express'` | Run `npm install` in the HackHub-Backend folder |
| Frontend shows "Server error" | Make sure backend is running on port 3000 |
| CORS error in browser | Backend already has `cors()` middleware — just restart it |
