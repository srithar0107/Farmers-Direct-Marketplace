# Farmers' Direct Marketplace

A MERN + Bootstrap web application connecting farmers directly with consumers and businesses, featuring role-based access control (Admin, Farmer, Customer).

---

## 🚀 Quick Start Guide

### 1. Configure MongoDB Connection

Create a `.env` file inside the `backend/` folder (or copy from `backend/.env.example`):

```bash
cp backend/.env.example backend/.env
```

Set your MongoDB connection string in `backend/.env`:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/farmers_direct_marketplace?retryWrites=true&w=majority
PORT=5000
JWT_SECRET=your_jwt_secret_key_here
```

*(Note: Both `MONGODB_URI` and `MONGO_URI` are supported).*

---

### 2. Verify Your MongoDB Connection

Run the built-in database check script to test connectivity instantly:

```bash
npm run check-db
```
or:
```bash
node backend/checkConnection.js
```

**Expected output:**
```
✅ SUCCESS: MongoDB connected in XXXms!
   Database Name : farmers_direct_marketplace
   Host          : cluster0.xxxx.mongodb.net
   Ready State   : Connected (1)
```

---

### 3. Seed Default Admin Account (Optional)

```bash
npm run seed
```
or:
```bash
node backend/seedAdmin.js
```

Default credentials:
- **Email:** `admin@farmers.com`
- **Password:** `Admin@123`

---

### 4. Start the Application

You can start the backend and frontend separately:

#### Start Backend:
```bash
npm start
```
or:
```bash
cd backend && node index.js
```
Server runs at `http://localhost:5000`. You can test connection health in your browser at:
`http://localhost:5000/api/health`

#### Start Frontend:
```bash
npm run frontend
```
or:
```bash
cd frontend && npm run dev
```
Frontend runs at `http://localhost:5173`.

---

## 👥 User Roles & Access

| Role | Default Landing | Capabilities |
| :--- | :--- | :--- |
| **Customer** | `/marketplace` | Browse products, search & filter by category, view farmer details |
| **Farmer** | `/farmer/dashboard` | Add, edit, and delete own farm products, view stock status |
| **Admin** | `/admin/dashboard` | Manage all users and product listings, view marketplace statistics |

---

## 🔒 Security Best Practices

- All database credentials are kept exclusively in `backend/.env` which is ignored by Git (`.gitignore`).
- Passwords are encrypted using `bcryptjs` with salt rounds.
- Protected endpoints require Bearer JWT tokens in authorization headers.
- Passwords are automatically excluded from user queries.
