# 💬 Real-Time Chat Application Backend

A real-time chat backend built with **Node.js, Express, TypeScript, Socket.IO, and MySQL**.

This project was developed as part of a test version for implementing chat rooms into ALLM for the **Node.js Backend Developer**. It implements authentication, chat rooms, real-time messaging, and user presence tracking.

---

## 🌟 Features (Mapped to Requirements)

* **User Authentication**

  * JWT-based authentication
  * Secure password hashing with bcrypt

* **Chat Rooms**

  * Create public/private rooms
  * Join rooms by ID or invite link
  * Track user membership

* **Real-Time Messaging**

  * Instant messaging with Socket.IO
  * Typing indicators
  * Presence system (online/offline + last seen)
  * Messages stored in MySQL with timestamps

* **Socket.IO Events**

  * `join_room`, `send_message`, `receive_message`, `typing`, `user_status`

* **Security & Validation**

  * Rate limiting (max 5 messages / 10s)
  * Request validation (no empty messages, auth for private rooms)
  * CORS + Helmet for API security

* **Database**

  * MySQL with Sequelize ORM
  * Tables: `users`, `rooms`, `room_members`, `messages`

* **(Bonus Implementations)**

  * ✅ Jest test setup for APIs & socket events
  * ✅ Message pagination for chat history
  * ✅ Docker support for containerized deployment

  
  For detailed API documentation, see [`docs/api.md`](docs/api.md)

---

## 🚀 Quick Start

### 1. Prerequisites

* Node.js 18+
* MySQL 8.0+
* Git

### 2. Clone & Setup

```bash
git clone <repo-url>
cd chat-backend
npm install
cp .env.example .env
```

### 3. Configure Environment

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=chat_app
JWT_SECRET=supersecret
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:3000
```

### 4. Run the Application

```bash
# Dev mode
npm run dev

# Production build
npm run build
npm start

# Tests
npm test
```

Server runs at: **[http://localhost:5000](http://localhost:5000)**

---

## 📡 API Endpoints

### Auth

* `POST /api/auth/register` – Register
* `POST /api/auth/login` – Login
* `GET /api/auth/profile` – User profile

### Rooms

* `POST /api/rooms` – Create room
* `POST /api/rooms/join` – Join room
* `GET /api/rooms` – List user’s rooms

### Messages

* `POST /api/messages` – Send message
* `GET /api/messages/room/:id` – Fetch room messages (paginated)

---

## 🔌 Socket.IO Events

| Event             | Direction       | Payload                                |
| ----------------- | --------------- | -------------------------------------- |
| `join_room`       | Client → Server | `{ roomId }`                           |
| `send_message`    | Client → Server | `{ content, roomId }`                  |
| `receive_message` | Server → Client | `{ user, content, roomId, timestamp }` |
| `typing`          | Client ↔ Server | `{ roomId, isTyping }`                 |
| `user_status`     | Server → Client | `{ userId, status, lastSeen }`         |

---

## 🧪 Testing

```bash
npm test
npm run test:coverage
```

* Unit tests (auth, rooms, messages)
* Integration tests (API + DB)
* Socket.IO tests

---

## 🐳 Docker Deployment

```bash
docker-compose up --build
```

Environment variables are loaded from `.env`.

---

## 📂 Project Structure
```
chat_app/        # Project root
├── src/                    # Application source code
│   ├── config/             # Configuration files (DB, JWT, etc.)
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Express middleware (auth, validation, rate limiter)
│   ├── models/             # Sequelize models
│   ├── routes/             # Express routes
│   ├── socket/             # Socket.IO handlers and events
│   ├── types/              # TypeScript type definitions
│   ├── utils/              # Utility functions
│   └── app.ts              # Application entry point
├── database/               # Database setup and SQL scripts
├── tests/                  # Jest tests files
├── doc/                    # api doc abt the project
├── Dockerfile              # Docker container definition
├── .env.example            # Sample environment variables
├── jest.config.js          # jest config
├── package.json            # Node.js project configuration
├── tsconfig.json           # TypeScript configuration
├── docker-compose.yml      # Optional Docker setup
└── README.md               # Project documentation
```
---

## 👨‍💻 Author

* **Idiege Inah** – [GitHub](https://github.com/IdiegeA21)

---

