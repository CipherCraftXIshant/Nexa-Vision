# NexaVision — AI-Powered Vision Intelligence Platform

NexaVision is an enterprise-grade AI Vision Intelligence Platform providing real-time facial recognition, secure identity management, visitor categorization, real-time alert dispatching, and security telemetry analytics.

---

## System Architecture

```
NexaVision/
├── client/          # React 19 + TypeScript + Vite + Tailwind CSS Dashboard
├── server/          # Node.js + Express + TypeScript + Socket.IO + MongoDB Mongoose API Gateway
├── ai-service/      # Python 3.10 + FastAPI + OpenCV + MediaPipe + NumPy Microservice
├── shared/          # Shared TypeScript type definitions
├── docs/            # OpenAPI Swagger specs & API documentation
├── docker/          # Docker Compose orchestration manifests
└── .github/         # GitHub Actions CI workflow definitions
```

---

## Core Features

- **Real-Time Facial Recognition**: Live video WebRTC canvas stream processing, bounding boxes, FPS counters, detection latency, anti-spoofing liveness checks.
- **Visitor Categorization**: Automatic identification of unregistered faces, snapshot capture, visitor queue, and one-click visitor-to-user conversion.
- **Role-Based Access Control (RBAC)**: Super Admin, Admin, Operator, User roles with JWT authentication, refresh token rotation, and password security.
- **Operational Analytics & Telemetry**: Dynamic dashboard graphs (Recharts), accuracy metrics, camera health status, and filterable audit trail logs with CSV export.
- **Real-Time Websocket Notifications**: Socket.IO alert hub for instant unknown face detection and system offline alerts.

---

## Quick Start Guide

### Prerequisites
- Node.js >= 20.x
- Python >= 3.10
- MongoDB Atlas or local MongoDB instance (`mongodb://localhost:27017/nexavision`)

### Running Locally

Create `server/.env` from `server/.env.example`, then set `MONGODB_URI`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` before starting the API. Use two different random secrets with at least 32 characters. For example, generate each with `openssl rand -hex 32` and place the outputs in the local environment file. The API exits during startup if the secrets are absent or invalid.

1. **Start AI Microservice (Python FastAPI)**:
   ```bash
   cd ai-service
   pip install -r requirements.txt
   uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```

2. **Start Backend API Gateway (Express + TypeScript)**:
   ```bash
   cd server
   npm install
   SEED_PASSWORD='choose-a-unique-password-at-least-12-chars' npm run seed
   npm run dev
   ```

3. **Start Web Frontend (React + Vite)**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

Open your browser at `http://localhost:5173`.

The seed command clears existing seeded collections. It requires `SEED_PASSWORD` and uses that value for the seeded accounts. Do not run it against a database containing data you need to keep.

---

## Docker Deployment

To launch the entire platform stack using Docker Compose:

```bash
cd docker
JWT_SECRET="$(openssl rand -hex 32)" JWT_REFRESH_SECRET="$(openssl rand -hex 32)" docker compose up --build -d
```

For a persistent deployment, set both secrets and `CLIENT_URL` in your deployment environment. Never commit those values.

Services will be accessible at:
- **Client Web App**: `http://localhost:80`
- **Server API Gateway**: `http://localhost:5000`
- **AI Microservice**: `http://localhost:8000`

---

## License
MIT © NexaVision Intelligence Team.
