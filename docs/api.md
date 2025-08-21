# API Documentation

## Base URL
```
http://localhost:5000/api 
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 🔐 Authentication Endpoints

### Register User
**POST** `/auth/register`

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com", 
  "password": "securepassword123"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

**Error Response (400):**
```json
{
  "error": "User already exists"
}
```

### Login User
**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com"
  }
}
```

### Logout User
**POST** `/auth/logout`
- **Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

### Get User Profile
**GET** `/auth/profile`
- **Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "created_at": "2025-01-15T10:30:00.000Z",
  "last_seen": "2025-01-15T15:45:00.000Z",
  "is_online": true
}
```

---

## 🏠 Room Management Endpoints

### Create Room
**POST** `/rooms`
- **Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "name": "General Chat",
  "description": "General discussion room",
  "is_private": false
}
```

**Response (201):**
```json
{
  "message": "Room created successfully",
  "room": {
    "id": 1,
    "name": "General Chat",
    "description": "General discussion room",
    "is_private": false,
    "invite_code": null,
    "created_by": 1
  }
}
```

### Join Room
**POST** `/rooms/join`
- **Headers:** `Authorization: Bearer <token>`

**Request Body (Option 1 - Room ID):**
```json
{
  "room_id": 1
}
```

**Request Body (Option 2 - Invite Code):**
```json
{
  "invite_code": "abc12345"
}
```

**Response (200):**
```json
{
  "message": "Joined room successfully",
  "room": {
    "id": 1,
    "name": "General Chat",
    "description": "General discussion room",
    "is_private": false
  }
}
```

### Get User's Rooms
**GET** `/rooms`
- **Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "rooms": [
    {
      "id": 1,
      "name": "General Chat",
      "description": "General discussion room",
      "is_private": false,
      "invite_code": null,
      "created_by": 1,
      "created_at": "2025-01-15T10:30:00.000Z",
      "RoomMember": {
        "role": "admin",
        "joined_at": "2025-01-15T10:30:00.000Z"
      }
    }
  ]
}
```

### Get Room Members
**GET** `/rooms/:roomId/members`
- **Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "members": [
    {
      "id": 1,
      "username": "john_doe",
      "is_online": true,
      "last_seen": "2025-01-15T15:45:00.000Z",
      "RoomMember": {
        "role": "admin",
        "joined_at": "2025-01-15T10:30:00.000Z"
      }
    }
  ]
}
```

### Leave Room
**DELETE** `/rooms/:roomId/leave`
- **Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "message": "Left room successfully"
}
```

---

## 💬 Message Endpoints

### Get Room Messages
**GET** `/messages/room/:roomId?page=1&limit=50`
- **Headers:** `Authorization: Bearer <token>`
- **Query Parameters:**
  - `page` (optional): Page number (default: 1)
  - `limit` (optional): Messages per page (default: 50, max: 100)

**Response (200):**
```json
{
  "messages": [
    {
      "id": 1,
      "room_id": 1,
      "user_id": 1,
      "content": "Hello everyone!",
      "message_type": "text",
      "created_at": "2025-01-15T10:35:00.000Z",
      "updated_at": "2025-01-15T10:35:00.000Z",
      "User": {
        "id": 1,
        "username": "john_doe"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "hasMore": false
  }
}
```

### Send Message
**POST** `/messages`
- **Headers:** `Authorization: Bearer <token>`

**Request Body:**
```json
{
  "content": "Hello everyone!",
  "room_id": 1
}
```

**Response (201):**
```json
{
  "message": "Message sent successfully",
  "data": {
    "id": 1,
    "room_id": 1,
    "user_id": 1,
    "content": "Hello everyone!",
    "message_type": "text",
    "created_at": "2025-01-15T10:35:00.000Z",
    "updated_at": "2025-01-15T10:35:00.000Z",
    "User": {
      "id": 1,
      "username": "john_doe"
    }
  }
}
```

---

## 🔌 Socket.IO Events

### Client to Server Events

#### Authenticate
```javascript
socket.emit('authenticate', 'your-jwt-token');
```

#### Join Room
```javascript
socket.emit('join_room', { roomId: 1 });
```

#### Leave Room
```javascript
socket.emit('leave_room', { roomId: 1 });
```

#### Send Message
```javascript
socket.emit('send_message', {
  content: 'Hello world!',
  roomId: 1
});
```

#### Typing Events
```javascript
// Start typing
socket.emit('typing_start', { roomId: 1 });

// Stop typing
socket.emit('typing_stop', { roomId: 1 });
```

### Server to Client Events

#### Authentication Success
```javascript
socket.on('authenticated', (data) => {
  console.log(data);
  // {
  //   user: { id: 1, username: 'john_doe' },
  //   rooms: [1, 2, 3]
  // }
});
```

#### Authentication Error
```javascript
socket.on('auth_error', (data) => {
  console.log(data.error);
});
```

#### Room Joined
```javascript
socket.on('room_joined', (data) => {
  console.log(data);
  // {
  //   room: { id: 1, name: 'General Chat', description: '...' },
  //   members: [...]
  // }
});
```

#### New Message Received
```javascript
socket.on('receive_message', (message) => {
  console.log(message);
  // {
  //   id: 1,
  //   content: 'Hello!',
  //   userId: 2,
  //   username: 'alice',
  //   roomId: 1,
  //   createdAt: '2025-01-15T10:35:00.000Z'
  // }
});
```

#### User Typing
```javascript
socket.on('user_typing', (data) => {
  console.log(data);
  // {
  //   userId: 2,
  //   username: 'alice',
  //   roomId: 1,
  //   isTyping: true
  // }
});
```

#### User Status Changes
```javascript
socket.on('user_status', (data) => {
  console.log(data);
  // {
  //   userId: 2,
  //   username: 'alice',
  //   isOnline: true,
  //   timestamp: '2025-01-15T15:45:00.000Z'
  // }
});

socket.on('user_online', (data) => {
  console.log(`${data.username} came online`);
});

socket.on('user_offline', (data) => {
  console.log(`${data.username} went offline`);
});
```

#### Error Events
```javascript
socket.on('error', (data) => {
  console.error(data.error);
});

socket.on('message_error', (data) => {
  console.error('Message error:', data.error);
});
```

---

## 📊 Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 429 | Too Many Requests (Rate Limited) |
| 500 | Internal Server Error |

## 🔄 Rate Limiting

- **Authentication endpoints**: 5 attempts per 15 minutes
- **API endpoints**: 100 requests per minute
- **Socket messages**: 5 messages per 10 seconds
- **Typing events**: 3 events per second

## 📝 Example Usage

### Complete Frontend Integration Example
```javascript
import io from 'socket.io-client';

class ChatAPI {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
    this.socket = io(baseURL);
    this.setupSocketListeners();
  }

  // API Methods
  async createRoom(roomData) {
    const response = await fetch(`${this.baseURL}/api/rooms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify(roomData)
    });
    return response.json();
  }

  async getMessages(roomId, page = 1) {
    const response = await fetch(
      `${this.baseURL}/api/messages/room/${roomId}?page=${page}`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );
    return response.json();
  }

  // Socket Methods
  authenticate() {
    this.socket.emit('authenticate', this.token);
  }

  joinRoom(roomId) {
    this.socket.emit('join_room', { roomId });
  }

  sendMessage(content, roomId) {
    this.socket.emit('send_message', { content, roomId });
  }

  setupSocketListeners() {
    this.socket.on('authenticated', (data) => {
      console.log('Authenticated:', data);
    });

    this.socket.on('receive_message', (message) => {
      this.onNewMessage(message);
    });

    this.socket.on('user_status', (data) => {
      this.onUserStatusChange(data);
    });
  }

  onNewMessage(message) {
    // Handle new message
  }

  onUserStatusChange(data) {
    // Handle user status change
  }
}
```