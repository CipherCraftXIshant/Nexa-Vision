# NexaVision API Reference Manual

## Overview
NexaVision exposes RESTful APIs for authentication, identity management, visitor categorization, real-time facial recognition frame processing, and analytics telemetry.

---

## Base URLs
- **Backend API Gateway**: `http://localhost:5000/api/v1`
- **AI Microservice**: `http://localhost:8000/api/v1`

---

## Authentication Endpoints

### `POST /auth/register`
Creates a new platform user account.

### `POST /auth/login`
Authenticates credentials and returns JWT Access & Refresh Token pair.

### `POST /auth/logout` (authenticated)
Revokes the current server-side session and disconnects its Socket.IO connection.

### `POST /auth/refresh`
Accepts `{ "refreshToken": "..." }`. The token must match a live stored session; successful refresh rotates the token. Reuse of the previous token is rejected.

### `POST /auth/setup-password`
Accepts `{ "token": "...", "password": "..." }` for an unexpired, one-time invitation token. Passwords must contain at least 12 characters.

Public registration only creates `USER` accounts. Administrators change roles through the protected user administration endpoint.

---

## Recognition Endpoints

### `POST /recognition/process-frame`
- **Payload**: `{ image: "data:image/jpeg;base64,...", cameraLocation: "Cam 01 - Main Entrance" }`
- **Response**: Bounding box coordinates, detection confidence, quality & liveness scores, and matched subject profile.

### `POST /recognition/register-face`
- **Payload**: `{ userId: "...", image: "data:image/jpeg;base64,..." }`
- **Response**: 128-d face embedding vector calculation and persistence.
