# Fleet Management & Vehicle Tracking System 🚛

[![Live Demo](https://img.shields.io/badge/Vercel-Live%20Demo-brightgreen?style=for-the-badge&logo=vercel)](https://fleet-management-virid-psi.vercel.app)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-blue?style=for-the-badge&logo=github)](https://github.com/saikumar7845/fleet-management-project)

- 🌐 **Production Deployment URL**: [https://fleet-management-virid-psi.vercel.app](https://fleet-management-virid-psi.vercel.app)
- ⚡ **Production API Health**: [https://fleet-management-virid-psi.vercel.app/api/health](https://fleet-management-virid-psi.vercel.app/api/health)
- 🐙 **GitHub Repository**: [https://github.com/saikumar7845/fleet-management-project](https://github.com/saikumar7845/fleet-management-project)

---

## ⚡ Tech Stack
- **Frontend**: React (Vite, Lucide Icons, Recharts)
- **Backend API**: Node.js / Express (MongoDB / In-Memory DB) & Flask Python API
- **Auth**: JWT Authentication + bcrypt password hashing
- **Deployment**: Vercel (Monorepo with Serverless Functions)

---

## ✨ Key Features
- **Fleet Manager/Admin & Driver Dashboards**: Role-based access control and navigation.
- **Vehicle Fleet Management**: Real-time vehicle load tracking, mileage, odometer logging.
- **Driver Management & Registration**: Self-registration with restricted driver permissions.
- **Trip Logging**: Detailed trip start/end locations, distance (km), fuel usage (L), and cargo load status.
- **Maintenance Records & Alerts**: In-place service queue, active maintenance management, and automated release.
- **Visual Analytics**: Interactive fleet utilization donut charts and vehicle usage bar charts.

---

## 🔑 Demo Login Credentials
- **Manager / Admin**: `admin@fleet.com` / `Admin@123`
- **Driver**: `driver@fleet.com` / `Driver@123`

---

## 🚀 Vercel Deployment Instructions

### Automatic GitHub Integration
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New > Project**.
2. Import the GitHub repository: **`saikumar7845/fleet-management-project`**.
3. Vercel automatically detects `vercel.json` and builds both:
   - **Frontend**: Static React build (`client/`)
   - **Backend API**: Serverless Node API (`server/src/index.js`) routed under `/api/*`
4. Click **Deploy**.