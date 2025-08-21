import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
dotenv.config();
import sequelize from './config/database';
import SocketHandler from './socket/socketHandler';
import { apiLimiter } from './middlewares/rateLimiter';

// Import routes
import authRoutes from './routes/auth';
import roomRoutes from './routes/rooms';
import messageRoutes from './routes/messages';

// Import models to ensure they're loaded
import User from './models/User';
import Room from './models/Room';
import RoomMember from './models/RoomMember';
import Message from './models/Message';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || "http://localhost:3000",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
// app.use(apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/messages', messageRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
  "success": false,
  "message": "Internal server error",
  "details": "Optional extra info"
});
});

// 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({ error: 'Route not found' });
// });

// Setup database associations
const setupAssociations = () => {
  // User associations
  User.hasMany(Room, { foreignKey: 'created_by' });
  User.hasMany(RoomMember, { foreignKey: 'user_id' });
  User.hasMany(Message, { foreignKey: 'user_id' });

  // Room associations
  Room.belongsTo(User, { foreignKey: 'created_by' });
  Room.hasMany(RoomMember, { foreignKey: 'room_id' });
  Room.hasMany(Message, { foreignKey: 'room_id' });

  // RoomMember associations
  RoomMember.belongsTo(User, { foreignKey: 'user_id' });
  RoomMember.belongsTo(Room, { foreignKey: 'room_id' });

  // Message associations
  Message.belongsTo(User, { foreignKey: 'user_id' });
  Message.belongsTo(Room, { foreignKey: 'room_id' });
};

// Initialize Socket.IO handler
const socketHandler = new SocketHandler(io);

// Database connection and server startup
const startServer = async () => {
  try {
    // Setup model associations
    setupAssociations();

    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Sync database (create tables if they don't exist)
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Database synchronized successfully.');

    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });

  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  try {
    await sequelize.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// startServer();

export { app, server, io };
