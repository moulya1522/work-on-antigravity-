# PROJECT VAULT

**PROJECT VAULT** is a full-stack personal engineering archive built to store, organize, manage, and showcase all your engineering projects, screenshots, links, and PDF documents under permanent shareable URLs.

- **Public visitors** can browse your project collection, search/filter/sort, open unique project URLs (e.g., `/projects/unfazed`), view screenshots, preview/download PDFs, view your profile, and copy share links.
- **Only you (the administrator)** can log in to add, edit, or delete projects, upload/replace/delete images and PDFs, and update your profile.

---

## Project Structure

```text
my work/
├── backend/                # Node.js + Express + Mongoose + Cloudinary REST API
│   ├── src/
│   │   ├── config/         # MongoDB & Cloudinary configuration
│   │   ├── middleware/     # JWT auth guard, Multer upload validation, error handler
│   │   ├── models/         # Admin, Profile, and Project Mongoose schemas
│   │   ├── routes/         # /api/auth, /api/profile, /api/projects
│   │   ├── scripts/        # Optional sample project seed script
│   │   └── utils/          # Slug generator, URL/input validators, DB bootstrap
│   ├── tests/              # Vitest + Supertest + mongodb-memory-server API tests
│   └── .env.example
├── frontend/               # React + Vite + React Router + Axios web app
│   ├── src/
│   │   ├── components/     # Navbar, ProjectCard, Modals, Lightbox, Admin managers
│   │   ├── context/        # Auth, Theme, Toast contexts
│   │   ├── pages/          # Home, ProjectDetails, AdminLogin, AdminDashboard, ProjectForm
│   │   ├── services/       # Axios API client
│   │   └── styles/         # Dark-first CSS design system
│   ├── vercel.json         # SPA routing fallback so direct project URLs never 404
│   └── .env.example
├── render.yaml             # Render Blueprint configuration for backend deployment
└── README.md
```

---

## Step 1: Create Free Cloud Accounts (MongoDB Atlas & Cloudinary)

1. **MongoDB Atlas (Database)**
   - Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free M0 cluster.
   - Under **Database Access**, create a database user with a username and password.
   - Under **Network Access**, allow access from anywhere (`0.0.0.0/0`) so your Render backend can connect.
   - Click **Connect -> Drivers** and copy your connection string (`MONGODB_URI`).

2. **Cloudinary (Permanent File Storage for Images & PDFs)**
   - Sign in to [Cloudinary](https://cloudinary.com/) and open your **Dashboard**.
   - Copy your **Cloud Name**, **API Key**, and **API Secret**.

---

## Step 2: Run Locally on Your Computer

### 1. Configure Backend Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in your values:

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=a_long_random_secret_at_least_32_characters
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=your_email@example.com
ADMIN_USERNAME=admin
ADMIN_PASSWORD=YourStrongAdminPassword123!
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SEED_SAMPLE_PROJECT=false
```

> **Note:** On first startup, the backend automatically creates your administrator account in MongoDB using `ADMIN_EMAIL`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD`. There is no public registration page.

### 2. Configure Frontend Environment Variables

Copy `frontend/.env.example` to `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Install & Start

In one terminal (Backend):

```bash
cd backend
npm install
npm run dev
```

In a second terminal (Frontend):

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

### Optional: Seed the Sample Project (`UNFAZED`)

Your database starts clean by default. If you want to load the sample `UNFAZED` project:
- Either click **"Load Sample Project (UNFAZED)"** inside the Admin Dashboard when empty, **or**
- Run `npm run seed` inside `backend/`.

---

## Step 3: Deploy Online (Render + Vercel)

### A. Deploy Backend on Render

1. Push this project folder to a **GitHub repository** (`.env` files are ignored by `.gitignore`).
2. Log in to [Render](https://render.com/), click **New + -> Web Service** (or **Blueprint** using `render.yaml`), and select your repository.
3. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add all environment variables from `backend/.env.example` in Render's **Environment** tab (`MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `CLOUDINARY_*`, and `CLIENT_URL`).
5. Once deployed, copy your Render backend URL (for example: `https://project-vault-api.onrender.com`).

### B. Deploy Frontend on Vercel

1. Log in to [Vercel](https://vercel.com/), click **Add New -> Project**, and import the same GitHub repository.
2. Configure:
   - **Root Directory:** `frontend`
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add Environment Variable:
   - `VITE_API_URL` = `https://your-render-backend-url.onrender.com/api`
4. Deploy! Copy your live Vercel URL (for example: `https://project-vault.vercel.app`).

### C. Connect CORS

Go back to Render -> **Environment** -> update `CLIENT_URL` to your exact Vercel URL (`https://project-vault.vercel.app`), and trigger a redeploy.

---

## How to Use & Manage PROJECT VAULT

### Logging In as Administrator
1. Click the discreet **Login** link in the top-right header (or visit `/admin/login`).
2. Enter the `ADMIN_EMAIL` (or `ADMIN_USERNAME`) and `ADMIN_PASSWORD` you configured.

### How to Add a New Project
1. In the **Admin Dashboard**, click **Quick Add Project**.
2. Enter the **Project Name** (required) and any optional details: Date, Status, Short & Detailed Descriptions, Technologies, Main/GitHub/Frontend/Backend links, **MongoDB Cluster Link** (web dashboard URL only—never enter passwords or connection strings), and Notes.
3. Upload a **Thumbnail**, **Screenshots**, and **PDF Documents** right inside the form, then click **Create Project**.
4. Your project receives a permanent shareable URL like `/projects/your-project-name`.

### How to Upload, Preview, Replace, and Delete PDFs
- Open **Edit Project** or the **Document Management** tab in the Admin Dashboard.
- Click **Select PDFs**, give each document a clear title (e.g., *Project Report*, *Synopsis*, *Documentation*, *Presentation*, *Certificate*, *Research Paper*), and click **Upload**.
- Click **Edit / Replace** on any document to rename it or swap the PDF file in Cloudinary, or **Delete** to remove it permanently.
- Public visitors can click **Preview PDF** or **Download** on the Project Details page.

### How to Manage Your Profile
- Open the **Manage Profile** tab in the Admin Dashboard.
- Upload or replace your **Profile Photograph**, update your **Name**, **Short Introduction**, **LinkedIn**, and **GitHub** links, and click **Save Profile**.
- Visitors can click your profile pill in the header to view your profile card.

---

## Running Automated Backend Tests

```bash
cd backend
npm test
```
