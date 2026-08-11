# ⚡ Jedlik Motors — Inventory Management System

> A complete inventory management web app built with Next.js, deployed on Vercel, with Google Sheets as the database backend.

---

## Overview

This system lets Jedlik Motors engineers manage lab inventory using QR codes and their phones. Each storage location (box, drawer, shelf, pegboard, etc.) has a printed QR code. Employees scan the QR code with their phone camera, enter their employee code, and take/return/expense items — all of which updates the master Google Sheet in real-time.

---

## Tech Stack

- **Frontend**: Next.js 16 (App Router) + React
- **Backend**: Next.js API Routes
- **Database**: Google Sheets (via Google Sheets API)
- **Hosting**: Vercel
- **QR Codes**: QuickChart.io API
- **Design**: Custom dark industrial theme (vanilla CSS)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-org/jedlik-inventory.git
cd jedlik-inventory
npm install
```

### 2. Set up Google Sheets Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Enable the **Google Sheets API**
4. Create a **Service Account** under IAM & Admin → Service Accounts
5. Create a JSON key for the service account
6. Share your Google Sheet with the service account email (as Editor)

### 3. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in:
- `GOOGLE_SHEETS_SPREADSHEET_ID` — Your Google Sheet ID (from the URL)
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` — The service account email
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` — The private key from the JSON key file
- `NEXT_PUBLIC_APP_URL` — Your deployed URL (or `http://localhost:3000` for local dev)

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add environment variables in Vercel project settings
4. Deploy!

---

## Project Structure

```
jedlik-inventory/
├── app/
│   ├── layout.js              # Root layout (dark theme, providers)
│   ├── globals.css             # Full design system
│   ├── page.js                 # Dashboard
│   ├── scan/page.js            # Transaction (QR scan landing)
│   ├── search/page.js          # Inventory search
│   ├── reports/page.js         # Report generation
│   ├── admin/page.js           # Admin panel
│   ├── print/page.js           # QR label printing
│   └── api/
│       ├── inventory/route.js       # Inventory CRUD
│       ├── inventory/search/route.js # Search
│       ├── locations/route.js       # Location CRUD
│       ├── employees/route.js       # Employee CRUD
│       ├── employees/validate/route.js # Employee validation
│       ├── transactions/route.js    # Transaction processing
│       ├── dashboard/route.js       # Dashboard data
│       ├── reports/route.js         # Report generation
│       ├── alerts/route.js          # System alerts
│       └── qr/route.js             # QR code management
├── components/
│   ├── Navbar.js              # Bottom navigation
│   ├── Toast.js               # Toast notifications
│   ├── LoadingOverlay.js      # Loading spinner
│   └── ConfirmModal.js        # Confirmation dialog
├── lib/
│   ├── sheets.js              # Google Sheets API client
│   ├── sheets-service.js      # Data access layer (CRUD)
│   ├── transaction-service.js # Transaction processing
│   ├── dashboard-service.js   # Dashboard & reports
│   ├── qr-service.js          # QR code generation
│   ├── notification-service.js # Alert system
│   └── utils.js               # Client-side utilities
├── .env.example               # Environment variable template
└── package.json
```

---

## Features

| Feature | Description |
|---------|-------------|
| 📦 Inventory Management | Track components, tools, consumables with stock levels |
| 📱 QR Code System | Auto-generated QR codes for every storage location |
| 🔄 Transactions | Take, Return, Expense workflows with validation |
| 👤 Employee Auth | Simple employee code verification |
| 📊 Dashboard | KPI cards, activity feed, charts, alerts |
| 🔍 Search | Search by name, part #, location, category, item ID |
| 📋 Reports | 7 report types with date filtering and CSV export |
| 🔔 Alerts | Low stock, out of stock, negative inventory, duplicate IDs |
| 🖨️ Print Labels | Batch QR label printing |

---

## Google Sheets Schema

Your Google Sheet should have these tabs:

| Sheet | Purpose |
|-------|---------|
| **Inventory** | Master item database |
| **Storage Locations** | Physical locations with QR status |
| **Employees** | Employee registry |
| **Transaction History** | Immutable audit log |
| **Config** | System settings (key-value) |
| **Dashboard Data** | Pre-computed metrics |

---

## License

Internal use — Jedlik Motors Private Limited. Built with ⚡ for India's EV future.
