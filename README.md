# AI Studio - Modelia Inc.

A mini AI Studio web application for fashion image generation simulation.

## Features

- 🔐 Secure user authentication (register/login)
- 🖼️ Image upload with validation
- ✨ Simulated AI generation (2-4 second processing)
- 🎲 20% random error simulation
- 📜 Recent generations history (last 5)
- 🎨 Responsive UI with Tailwind CSS
- ✅ Comprehensive testing

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Quick Start

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Setup Database

```bash
# Create database
createdb ai_studio
```

### 3. Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit http://localhost:3000

## Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Tech Stack

**Backend**: Node.js, Express, TypeScript, PostgreSQL, JWT
**Frontend**: React, TypeScript, Tailwind CSS, Vite
**Testing**: Jest, Vitest, React Testing Library

## Documentation

- `SETUP_GUIDE.md` - Detailed setup instructions
- `API_DOCUMENTATION.md` - Complete API reference
- `QUICK_START_COMMANDS.md` - Command reference

## Project Structure

```
ai-studio/
├── backend/          # Express API
├── frontend/         # React app
└── database/         # Migrations
```
