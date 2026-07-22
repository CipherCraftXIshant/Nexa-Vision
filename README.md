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
   npm run seed    # Seeds default admin, users, visitors, and camera devices
   npm run dev
   ```

3. **Start Web Frontend (React + Vite)**:
   ```bash
   cd client
   npm install
   npm run dev
   ```

Open your browser at `http://localhost:5173`.

### Demo Login Credentials
- **Super Admin**: `admin@nexavision.io` | `Password@123`
- **Security Officer**: `sarah.c@nexavision.io` | `Password@123`

---

## Docker Deployment

To launch the entire platform stack using Docker Compose:

```bash
cd docker
docker-compose up --build -d
```

Services will be accessible at:
- **Client Web App**: `http://localhost:80`
- **Server API Gateway**: `http://localhost:5000`
- **AI Microservice**: `http://localhost:8000`

---

## License
MIT © NexaVision Intelligence Team.
