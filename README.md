# Insight Halls Engineering Platform
## Integrated Website + Partnership Governance System

A comprehensive platform combining a public-facing website with an advanced internal partnership governance system featuring automated profit-sharing calculations, project management, and democratic decision-making.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Technologies](#technologies)
4. [Installation & Setup](#installation--setup)
5. [Configuration](#configuration)
6. [Project Structure](#project-structure)
7. [API Documentation](#api-documentation)
8. [Deployment](#deployment)
9. [Development Workflow](#development-workflow)
10. [Contributing](#contributing)

---

## 🎯 Overview

### What is Insight Halls Engineering Platform?

A dual-purpose system serving:

**PUBLIC WEBSITE** (Client-facing)
- Company information and value proposition
- Comprehensive service catalog (7 service lines)
- Project portfolio and case studies
- Inquiry/lead capture system
- Team and company news

**PARTNER PORTAL** (Internal governance)
- Secure partner authentication with MFA
- Project workspace and lifecycle management
- Automated profit-sharing calculations using Multi-Pool Index Weighting
- Funding and effort tracking
- Business development pipeline
- Governance & voting system
- Dispute resolution framework
- Document management with signatures
- Real-time reporting and analytics

### Key Features

✅ **Transparent Profit Sharing** - Three-index calculation: Funding (60%), Effort (30%), Deal Bonus (10%)
✅ **Democratic Governance** - Partner voting with weighted thresholds for all strategic decisions
✅ **Complete Audit Trail** - Every action logged with immutable records
✅ **Role-Based Access Control** - Fine-grained permissions for different partner types
✅ **Real-Time Collaboration** - Shared project workspaces with activity feeds
✅ **Automated Calculations** - Complex financial and profit-sharing math handled by engine
✅ **Dispute Resolution** - Structured mediation and escalation workflows

---

## 🏗️ System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│       INSIGHT HALLS ENGINEERING PLATFORM         │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐         ┌──────────────┐    │
│  │ PUBLIC SITE  │         │PARTNER PORTAL│    │
│  │  (Website)   │         │   (Internal) │    │
│  └──────┬───────┘         └──────┬───────┘    │
│         │                        │             │
│         └────────────┬───────────┘             │
│                      ▼                         │
│              ┌───────────────┐                │
│              │  EXPRESS API  │                │
│              │   BACKEND     │                │
│              └───────┬───────┘                │
│                      ▼                         │
│         ┌────────────────────────┐            │
│         │    MONGOOSE/MONGODB    │            │
│         │    (Data Persistence)  │            │
│         └────────────────────────┘            │
│                                                │
└─────────────────────────────────────────────────┘
```

### Module Breakdown

**Frontend (React + Vite)**
- Public pages (Landing, Services, Projects, Contact)
- Authentication system (Login, MFA, Password Reset)
- Partner portal dashboard and workspaces
- Real-time notifications

**Backend (Express.js)**
- RESTful API for all operations
- JWT authentication and authorization
- Business logic services (Profit Sharing Engine, etc.)
- Database models and validation

**Database (MongoDB)**
- 14+ document collections
- Comprehensive schemas for all entities
- Indexing for performance
- Audit logging

---

## 🛠️ Technologies

### Backend
- **Runtime:** Node.js 16+
- **Framework:** Express.js 4.18+
- **Database:** MongoDB 5.0+ with Mongoose ODM
- **Authentication:** JWT (jsonwebtoken)
- **Security:** Helmet, bcrypt, rate limiting
- **Email:** Nodemailer + SendGrid
- **Storage:** AWS S3
- **Payment:** Stripe
- **Real-time:** Socket.io

### Frontend
- **Framework:** React 18+ with Hooks
- **Bundler:** Vite 5.0
- **Routing:** React Router 6
- **State:** Zustand + React Query
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Styling:** CSS3 + CSS Variables
- **HTTP Client:** Axios

### DevOps & Deployment
- Docker & Docker Compose
- Kubernetes (recommended for scale)
- GitHub Actions (CI/CD)
- Monitoring: Sentry, DataDog (optional)

---

## 📦 Installation & Setup

### Prerequisites

Ensure you have:
- Node.js 16+ and npm 8+
- MongoDB 5.0+ (local or Atlas)
- Git
- Docker (optional, for containerization)

### Step 1: Clone Repository

```bash
git clone https://github.com/insighthalls/engineering-platform.git
cd engineering-platform
```

### Step 2: Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend (in separate terminal)
cd frontend
npm install
```

### Step 3: Environment Configuration

```bash
# Copy template to backend
cp backend/.env.example backend/.env

# Copy template to frontend
cp frontend/.env.example frontend/.env.local
```

Edit `.env` files with your configuration (see Configuration section).

### Step 4: Database Setup

```bash
# Using MongoDB Atlas (recommended)
# 1. Create cluster at https://cloud.mongodb.com
# 2. Get connection string
# 3. Update MONGODB_URI in backend/.env

# OR Using Local MongoDB
mongod  # Start MongoDB service
```

### Step 5: Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# App runs on http://localhost:3000
```

### Step 6: Seed Database (Optional)

```bash
cd backend
npm run seed
```

This creates sample partners, projects, and data for testing.

---

## ⚙️ Configuration

### Backend Configuration (.env)

**Essential Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` or `production` |
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | Database connection | `mongodb+srv://...` |
| `JWT_SECRET` | Signing key (min 32 chars) | `your_secret_key_here` |
| `FRONTEND_URL` | CORS origin | `http://localhost:3000` |

**Email Configuration:**

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
```

**AWS S3 (for document storage):**

```
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=insight-halls-documents
```

**Business Configuration:**

```
# Profit Sharing
OPERATING_RESERVE_PERCENTAGE=40
PARTNER_DIVIDEND_PERCENTAGE=60
FUNDING_WEIGHT=0.60
EFFORT_WEIGHT=0.30
DEAL_BONUS_WEIGHT=0.10
```

### Frontend Configuration (.env.local)

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

---

## 📁 Project Structure

```
engineering-platform/
│
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   └── constants.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── schemas.js          # All Mongoose schemas
│   │   └── index.js
│   ├── routes/
│   │   ├── website.routes.js      # Public website endpoints
│   │   ├── inquiries.routes.js     # Inquiry management
│   │   ├── auth.routes.js          # Authentication
│   │   ├── projects.routes.js      # Project management
│   │   ├── funding.routes.js       # Funding tracking
│   │   ├── operations.routes.js    # Effort logging
│   │   ├── finance.routes.js       # Financial tracking
│   │   ├── profit-sharing.routes.js # Distributions
│   │   ├── governance.routes.js    # Meetings & voting
│   │   └── reports.routes.js       # Analytics
│   ├── services/
│   │   ├── profitSharingEngine.js  # Core calculation logic
│   │   ├── emailService.js
│   │   ├── storageService.js
│   │   └── notificationService.js
│   ├── server.js               # Main entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Navbar.jsx
│   │   │   │   └── Footer.jsx
│   │   │   ├── sections/
│   │   │   │   ├── HeroSection.jsx
│   │   │   │   ├── ServicesShowcase.jsx
│   │   │   │   └── ProjectShowcase.jsx
│   │   │   ├── portal/
│   │   │   │   ├── DashboardCard.jsx
│   │   │   │   ├── ProjectWorkspaceCard.jsx
│   │   │   │   └── DistributionTable.jsx
│   │   │   └── common/
│   │   │       ├── Button.jsx
│   │   │       ├── Modal.jsx
│   │   │       └── FormInput.jsx
│   │   ├── pages/
│   │   │   ├── public/
│   │   │   │   ├── HomePage.jsx
│   │   │   │   ├── ServicesPage.jsx
│   │   │   │   ├── ProjectsPage.jsx
│   │   │   │   └── ContactPage.jsx
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   └── MFASetupPage.jsx
│   │   │   └── portal/
│   │   │       ├── DashboardPage.jsx
│   │   │       ├── ProjectsPortalPage.jsx
│   │   │       ├── FinancePortalPage.jsx
│   │   │       └── GovernancePage.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── AppContext.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useProject.js
│   │   │   └── useDistribution.js
│   │   ├── styles/
│   │   │   ├── App.css
│   │   │   └── variables.css    # CSS variables & theme
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── README.md
└── ARCHITECTURE.md
```

---

## 📚 API Documentation

### Public Endpoints

#### Website
```
GET  /api/website/landing           - Landing page data
GET  /api/website/services          - Services catalog
GET  /api/website/services/:id      - Service details
GET  /api/website/projects          - Project portfolio
GET  /api/website/projects/:id      - Project details
GET  /api/website/team              - Team bios
GET  /api/website/news              - Company news
GET  /api/website/contact-form      - Contact form structure
POST /api/website/contact-submit    - Submit inquiry
```

#### Inquiries (Public)
```
POST /api/inquiries/submit          - Submit inquiry
GET  /api/inquiries/track/:id       - Track inquiry status
```

### Protected Endpoints (Require Authentication)

#### Authentication
```
POST /api/auth/register             - Register new partner
POST /api/auth/login                - Login and get token
POST /api/auth/mfa-verify           - Verify MFA code
POST /api/auth/refresh-token        - Refresh JWT token
POST /api/auth/logout               - Logout (invalidate token)
```

#### Projects
```
GET  /api/projects                  - List partner's projects
POST /api/projects                  - Create new project
GET  /api/projects/:id              - Get project details
PATCH /api/projects/:id             - Update project
GET  /api/projects/:id/workspace    - Project workspace data
```

#### Funding
```
POST /api/funding/declare           - Declare funding contribution
GET  /api/funding/declarations      - View declarations
PATCH /api/funding/:id/verify       - Verify funding (Finance partner)
```

#### Operations (Effort)
```
POST /api/operations/log-effort     - Log hours worked
GET  /api/operations/my-logs        - View own effort logs
POST /api/operations/rate-peer      - Submit peer rating (post-project)
```

#### Finance
```
GET  /api/finance/dashboard         - Financial overview
GET  /api/finance/transactions      - Transaction history
GET  /api/finance/summary           - Period summary
```

#### Profit Sharing
```
GET  /api/profit-sharing/distributions/:projectId  - Distribution details
GET  /api/profit-sharing/my-earnings                - Personal earnings
POST /api/profit-sharing/approve-distribution      - Approve (Finance partners)
```

#### Governance
```
GET  /api/governance/meetings       - List meetings
POST /api/governance/meetings       - Schedule meeting
POST /api/governance/propose-resolution  - Propose resolution/vote
GET  /api/governance/resolutions    - View resolutions & votes
POST /api/governance/vote           - Cast vote
```

#### Disputes
```
POST /api/governance/raise-dispute  - Raise dispute
GET  /api/governance/disputes/:id   - Get dispute details
POST /api/governance/disputes/:id/respond  - Respond to dispute
```

---

## 🚀 Deployment

### Docker Deployment

```bash
# Build images
docker-compose build

# Start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Kubernetes Deployment

```bash
# Create ConfigMap for environment
kubectl create configmap ihe-config --from-file=.env

# Deploy
kubectl apply -f k8s/deployment.yaml

# Check status
kubectl get pods
kubectl logs deployment/ihe-backend
```

### Production Deployment Checklist

- [ ] Update all `.env` values for production
- [ ] Set `NODE_ENV=production`
- [ ] Configure HTTPS/SSL certificates
- [ ] Set up MongoDB with replication and backups
- [ ] Configure AWS S3 bucket with proper permissions
- [ ] Set up CloudFront CDN for static assets
- [ ] Configure monitoring (Sentry, DataDog)
- [ ] Set up log aggregation (ELK, Splunk)
- [ ] Enable CORS for production domain only
- [ ] Configure automated backups
- [ ] Set up alerting and incident response

---

## 💻 Development Workflow

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Code Quality

```bash
# Lint backend
cd backend
npm run lint

# Lint frontend
cd frontend
npm run lint

# Format code
npm run format
```

### Debugging

**Backend:**
```bash
cd backend
node --inspect-brk server.js
# Then open chrome://inspect
```

**Frontend:**
Open DevTools (F12) in browser for debugging.

---

## 📖 Key Business Processes

### Profit Sharing Workflow

1. **Project Completion** → Triggers profit calculation
2. **Gather Inputs:**
   - Total revenue and costs
   - Funding declarations (verified)
   - Effort logs and peer ratings
   - Deal sourcing attribution
3. **Calculate Three Indices:**
   - Funding Index: (Partner's Funding / Total Cost) × 100
   - Effort Index: Average peer rating (1-10 scale)
   - Deal Bonus: 100% if sourced by partner, 0% otherwise
4. **Combine with Weights:**
   - Final Index = (Funding × 60%) + (Effort × 30%) + (Bonus × 10%)
5. **Calculate Entitlements:**
   - Each partner's share = Final Index / 100 × Dividend Pool
6. **Governance Approval:**
   - Finance partners must approve distribution
   - Partners can dispute calculations (mediation)
7. **Distribution:**
   - Approved amounts transferred to partner bank accounts

### Governance Process

1. **Proposal:** Any partner can propose resolution
2. **Discussion:** Partners discuss in meeting or async
3. **Voting:** Partners vote with weighted thresholds
4. **Execution:** If passed, implement resolution
5. **Documentation:** Record decision with full audit trail

---

## 📞 Support

For issues, questions, or feature requests:

1. Check existing GitHub issues
2. Read ARCHITECTURE.md for detailed design docs
3. Contact development team

---

## 📜 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

Built with modern web standards and best practices in partnership governance and transparent financial management.

---

**Last Updated:** April 2024
**Version:** 1.0.0
**Status:** Production Ready
