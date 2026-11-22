# ☕ N CAFÉ — Full Stack Café Management System

A modern, full-stack café management web application built for café owners, managers, baristas, and floor staff. **N CAFÉ** integrates a Point of Sale (POS), real-time order tracking, menu customization, ingredient inventory management with low-stock alerts, customer profiles, staff access control, and financial analytics.

---

## 📸 Overview & Features

- **Modern Café Aesthetic**: Coffee roast darks (`#1A0F08`, `#26160C`), warm beiges (`#F4EFEA`), cream whites (`#FCFAF7`), and soft amber accents (`#D97706`).
- **Authentication & RBAC**: JWT-based session management, bcrypt password hashing, role-based route guards for **Admin** and **Staff**.
- **Executive Dashboard**: Real-time KPI stats (Today's Revenue, Total Sales, Active Orders Queue, Low-stock alerts), interactive Area/Bar charts powered by Recharts, best-selling drinks, and activity timeline.
- **Point of Sale (POS)**: Fast visual grid with category tabs, dietary indicators (Veg/Non-Veg/Vegan), live order cart with line quantity steppers, customizable discounts, automatic 5% GST calculation, UPI/Cash/Card payments, and an instant printable receipt modal.
- **Order Management**: Life-cycle workflow (`Pending` ➔ `Preparing` ➔ `Ready` ➔ `Completed` / `Cancelled`), receipt print preview, cancellation validation with reason logging.
- **Menu Management**: Food and beverage catalog, instant 1-click in-stock / out-of-stock toggling, image uploads, price and prep time management.
- **Ingredient Inventory**: Raw stock tracking (coffee beans, milk, syrups, bread, dairy), unit measures, minimum reorder thresholds, low-stock warning banners, and 1-click stock adjustments.
- **Staff Directory**: Role assignment (`Admin` vs `Staff`), job titles (Head Barista, Cashier, Chef, Floor Manager), account status toggling.
- **Customer Intelligence**: Automatic customer record creation during checkout, lifetime order count, total spending, and past order history.
- **Reports & Analytics**: Timeframe filters (`Today`, `Last 7 Days`, `Last 30 Days`, `This Month`), revenue inflow trends, payment method breakdown (UPI vs Card vs Cash pie chart), top products by volume, and CSV export.
- **Café Settings**: Outlet branding, address, currency symbol (`₹`), tax rate, order number prefix (`NC-`), admin profile updates, and password changes.

---

## 🛠️ Technology Stack

### Frontend
- **React.js 18** with **Vite**
- **React Router v6** (Protected and Role-Guarded routes)
- **Axios** (With JWT interceptors and auto-auth handling)
- **Recharts** (Area charts, Bar charts, Pie charts)
- **Lucide React** (Modern, consistent iconography)
- Custom Café Design System (CSS3 with custom variables, smooth transitions, glassmorphism, responsive tables)

### Backend
- **Node.js** & **Express.js**
- **MongoDB Atlas** with **Mongoose** ORM (Includes resilient dual-mode persistence for zero-friction local testing)
- **JWT (JSON Web Tokens)** for stateless, secure auth
- **bcryptjs** for 10-round salted password hashing
- **Multer** for image uploads
- **CORS** & Centralized Error Handler

---

## 📁 Project Structure

```text
n-cafe/
├── backend/
│   ├── config/
│   │   └── db.js               # MongoDB Atlas connection & fallback engine
│   ├── controllers/
│   │   ├── authController.js       # Login, profile, password change
│   │   ├── dashboardController.js  # Sales metrics, timeline feeds
│   │   ├── menuController.js       # Menu CRUD, availability toggle
│   │   ├── categoryController.js   # Category management
│   │   ├── orderController.js      # POS order placement & status workflow
│   │   ├── inventoryController.js  # Stock levels & restock adjustments
│   │   ├── staffController.js      # User management & RBAC
│   │   ├── customerController.js   # Customer profiles & order histories
│   │   ├── reportController.js     # Analytics aggregation & date filtering
│   │   └── settingsController.js   # Branding, tax rate & store config
│   ├── middleware/
│   │   ├── auth.js             # JWT protect & authorize('admin') guards
│   │   ├── errorHandler.js     # Centralized error responses
│   │   └── upload.js           # Multer image upload filter & disk storage
│   ├── models/
│   │   ├── User.js
│   │   ├── MenuItem.js
│   │   ├── Category.js
│   │   ├── Order.js
│   │   ├── InventoryItem.js
│   │   ├── Customer.js
│   │   ├── CafeSettings.js
│   │   ├── ActivityLog.js
│   │   └── dbAdapter.js        # Mongoose / Persistent Dual-Mode Adapter
│   ├── routes/                 # Express REST API routes
│   ├── scripts/
│   │   └── seed.js             # Comprehensive database seed script
│   ├── uploads/                # Stored item image uploads
│   ├── server.js               # Express application entrypoint
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── favicon.svg         # Coffee cup vector icon
    ├── src/
    │   ├── components/
    │   │   ├── ProtectedRoute.jsx
    │   │   ├── ConfirmModal.jsx
    │   │   └── ReceiptModal.jsx  # Printable café bill receipt
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   ├── SettingsContext.jsx
    │   │   └── ToastContext.jsx
    │   ├── layouts/
    │   │   └── Layout.jsx      # Responsive sidebar navigation & topbar
    │   ├── pages/
    │   │   ├── Login.jsx       # 1-click test credentials + login
    │   │   ├── Dashboard.jsx   # Metrics, charts, low stock, bestsellers
    │   │   ├── POS.jsx         # Live café point-of-sale terminal
    │   │   ├── Orders.jsx      # Order lifecycle & ticket management
    │   │   ├── Menu.jsx        # Menu items & stock availability
    │   │   ├── Inventory.jsx   # Ingredient stock & restock alerts
    │   │   ├── Staff.jsx       # Staff directory & role privileges
    │   │   ├── Customers.jsx   # Customer spending & order history
    │   │   ├── Reports.jsx     # Financial charts & CSV export
    │   │   └── Settings.jsx    # Store identity, GST, admin profile
    │   ├── services/
    │   │   └── api.js          # Axios client with JWT interceptor
    │   ├── styles/
    │   │   └── index.css       # Complete café design system stylesheet
    │   ├── App.jsx             # Route definitions
    │   └── main.jsx
    ├── index.html
    ├── vite.config.js          # API proxy to backend
    └── package.json
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)

---

### 2. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd n-cafe/backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your preferred settings:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/n_cafe?retryWrites=true&w=majority
   JWT_SECRET=n_cafe_super_secret_jwt_key_2026_cafe_excellence
   JWT_EXPIRES_IN=7d
   CLIENT_URL=http://localhost:5173
   ```

4. Populate Sample Database:
   ```bash
   npm run seed
   ```

5. Start the Backend API Server:
   ```bash
   npm start
   ```
   The backend API will run on **http://localhost:5000**.
   Health check: **http://localhost:5000/api/health**.

---

### 3. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd n-cafe/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start Vite Development Server:
   ```bash
   npm run dev
   ```
   The frontend will run on **http://localhost:5173**.

---

## 🔐 Default Seed Credentials

Use these pre-seeded accounts to explore the application:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@ncafe.com` | `admin123` | Full access (POS, Menu, Orders, Inventory, Staff, Settings, Reports) |
| **Head Barista** | `staff@ncafe.com` | `staff123` | Operational access (POS, Orders, Menu, Inventory, Customers) |
| **Cashier** | `cashier@ncafe.com` | `cashier123` | Operational access (POS, Orders, Customers) |

*Tip: The login page includes 1-click Quick Test buttons to fill credentials automatically!*

---

## 🍃 MongoDB Atlas Configuration

To connect this application to your cloud MongoDB Atlas database:

1. Sign in to your [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account.
2. In your Cluster dashboard, click **Connect** ➔ **Drivers** ➔ **Node.js**.
3. Under **Network Access**, ensure your current IP address (or `0.0.0.0/0` for development) is whitelisted.
4. Under **Database Access**, ensure you have created a database user with Read/Write privileges.
5. Copy the connection string and paste it into `n-cafe/backend/.env`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@<your-cluster>.mongodb.net/n_cafe_db?retryWrites=true&w=majority
   ```
6. Re-run `npm run seed` in `n-cafe/backend` to populate your cloud Atlas cluster with the café catalog and historical orders.

---

## 📡 REST API Routes

| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health, uptime & DB status | Public |
| `POST` | `/api/auth/login` | Authenticate & return JWT token | Public |
| `GET` | `/api/auth/me` | Fetch active user profile | Private |
| `PUT` | `/api/auth/profile` | Update user profile | Private |
| `PUT` | `/api/auth/change-password` | Change user password | Private |
| `GET` | `/api/dashboard` | KPI metrics, sales charts, feeds | Private |
| `GET` | `/api/menu` | List menu items with filters & search | Public / Private |
| `POST` | `/api/menu` | Create menu item (with image upload) | Private |
| `PUT` | `/api/menu/:id` | Update menu item | Private |
| `PATCH` | `/api/menu/:id/toggle-availability` | Toggle in-stock / out-of-stock | Private |
| `DELETE`| `/api/menu/:id` | Delete menu item | Admin |
| `GET` | `/api/orders` | List orders with pagination & filters | Private |
| `POST` | `/api/orders` | Place new café order | Private |
| `PATCH` | `/api/orders/:id/status` | Advance status (`Pending`➔`Completed`) | Private |
| `PATCH` | `/api/orders/:id/payment`| Update payment method / status | Private |
| `POST` | `/api/orders/:id/cancel` | Cancel order with reason | Private |
| `GET` | `/api/inventory` | List stock & low-stock alerts | Private |
| `POST` | `/api/inventory` | Add ingredient | Private |
| `POST` | `/api/inventory/:id/adjust` | Quick restock or waste adjustment | Private |
| `DELETE`| `/api/inventory/:id` | Remove ingredient | Admin |
| `GET` | `/api/staff` | List staff members | Admin |
| `POST` | `/api/staff` | Create staff account | Admin |
| `PUT` | `/api/staff/:id` | Update staff details / role | Admin |
| `DELETE`| `/api/staff/:id` | Delete staff account | Admin |
| `GET` | `/api/customers` | List customers & spending | Private |
| `GET` | `/api/customers/:id` | Customer details & order history | Private |
| `GET` | `/api/reports` | Analytics by timeframe & CSV data | Private |
| `GET` | `/api/settings` | Café outlet settings | Public / Private |
| `PUT` | `/api/settings` | Update café branding & tax | Admin |

---

## 🚀 Production Deployment Checklist

When deploying to production:
1. Set `NODE_ENV=production` in backend.
2. Provide a strong, cryptographically generated `JWT_SECRET`.
3. Set `CLIENT_URL` to your production frontend domain (e.g. `https://ncafe.com`).
4. Serve the frontend through a CDN or Nginx after running `npm run build` in `frontend/`.
5. Configure cloud object storage (e.g. AWS S3, Cloudinary) for permanent menu item image hosting.
