# StockMaster Pro 📦

A professional full-stack inventory management system built with **React + Vite** (frontend) and **Node.js + Express + MongoDB Atlas** (backend).

## Features

- 📊 **Stock Overview** — Real-time inventory with low-stock alerts
- ➕ **Product Management** — Add, edit, delete products with SKU tracking
- 🏭 **Supplier Management** — Manage vendor directory with contact info
- 📋 **Purchase Orders** — Create and track incoming stock orders
- 🛒 **Sales & Orders** — Create customer orders, track fulfillment status
- 💰 **Financial Dashboard** — Revenue, cost, and profit summaries
- 🌙 **Dark Mode** — Toggle between light and dark themes
- ☁️ **MongoDB Atlas** — Cloud-persisted data across sessions

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 8, React Router, Recharts |
| Backend | Node.js, Express 4, Mongoose 8 |
| Database | MongoDB Atlas |
| Styling | Vanilla CSS |

## Project Structure

```
inventory_project/
├── my-app/          # React + Vite frontend
│   ├── src/
│   │   ├── api/     # API service layer
│   │   ├── components/
│   │   └── styles/
│   └── .env         # VITE_API_URL (not committed)
└── server/          # Express + Mongoose backend
    ├── models/      # Mongoose schemas
    ├── routes/      # REST API routes
    ├── index.js
    └── .env         # MONGO_URI + PORT (not committed)
```

## Getting Started

### Prerequisites
- Node.js 18+
- A [MongoDB Atlas](https://cloud.mongodb.com) account and cluster

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/inventory_project.git
cd inventory_project
```

### 2. Set up the Backend
```bash
cd server
npm install
```

Create a `server/.env` file:
```env
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/stockmaster?retryWrites=true&w=majority
PORT=5000
```
> ⚠️ If your password contains special characters like `@`, URL-encode them (e.g. `@` → `%40`)

Start the server:
```bash
node index.js
```
You should see: `✅ Connected to MongoDB Atlas` and `🚀 Server running on http://localhost:5000`

### 3. Set up the Frontend
```bash
cd my-app
npm install
```

Create a `my-app/.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:
```bash
npm run dev
```

Open **http://localhost:5173** (or the port shown in your terminal).

### Default Login
| Field | Value |
|-------|-------|
| Email | `admin@stockmaster.com` |
| Password | `admin` |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/items` | Get all inventory items |
| POST | `/api/items` | Create item |
| PUT | `/api/items/:id` | Update item |
| DELETE | `/api/items/:id` | Delete item |
| POST | `/api/items/:id/adjust-stock` | Stock in/out |
| GET/POST/PUT/DELETE | `/api/suppliers` | Suppliers CRUD |
| GET/POST/PUT/DELETE | `/api/orders` | Sales orders CRUD |
| PATCH | `/api/orders/:id/status` | Update order status |
| PATCH | `/api/orders/:id/shipping` | Update shipping info |
| GET/POST/PUT/DELETE | `/api/purchase-orders` | Purchase orders CRUD |

## Environment Variables

### `server/.env`
| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB Atlas connection string |
| `PORT` | Server port (default: 5000) |

### `my-app/.env`
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |

## License
MIT
