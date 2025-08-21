import { Server, Socket } from 'socket.io';
import { authenticateSocket } from '../middlewares/auth';
import User from '../models/User';
import Room from '../models/Room';
import RoomMember from '../models/RoomMember';
import Message from '../models/Message';
import rateLimiter from '../utils/rateLimiter';
import { SOCKET_EVENTS } from './events';
import { SocketUser, TypingData, MessageData } from '../types';

interface AuthenticatedSocket extends Socket {
  user?: SocketUser;
}

class SocketHandler {
  private io: Server;
  private connectedUsers: Map<number, Set<string>> = new Map(); // userId -> Set of socketIds
  private typingUsers: Map<number, Set<number>> = new Map(); // roomId -> Set of userIds

  constructor(io: Server) {
    this.io = io;
    this.setupSocketEvents();
  }

  private setupSocketEvents() {
    this.io.on(SOCKET_EVENTS.CONNECT, (socket: AuthenticatedSocket) => {
      console.log(`Socket connected: ${socket.id}`);
      
      socket.on('authenticate', async (token: string) => {
        await this.handleAuthentication(socket, token);
      });

      socket.on(SOCKET_EVENTS.JOIN_ROOM, (data) => {
        this.handleJoinRoom(socket, data);
      });

      socket.on(SOCKET_EVENTS.LEAVE_ROOM, (data) => {
        this.handleLeaveRoom(socket, data);
      });

      socket.on(SOCKET_EVENTS.SEND_MESSAGE, (data) => {
        this.handleSendMessage(socket, data);
      });

      socket.on(SOCKET_EVENTS.TYPING_START, (data) => {
        this.handleTypingStart(socket, data);
      });

      socket.on(SOCKET_EVENTS.TYPING_STOP, (data) => {
        this.handleTypingStop(socket, data);
      });

      socket.on(SOCKET_EVENTS.DISCONNECT, () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private async handleAuthentication(socket: AuthenticatedSocket, token: string) {
    try {
      const user = await authenticateSocket(token);
      if (!user) {
        socket.emit(SOCKET_EVENTS.AUTH_ERROR, { error: 'Invalid token' });
        socket.disconnect();
        return;
      }

      // Get user's rooms
      const roomMembers = await RoomMember.findAll({
        where: { user_id: user.id },
        include: [{ model: Room }]
      });

      const userRooms = roomMembers.map(rm => rm.room_id);

      socket.user = {
        id: user.id,
        username: user.username,
        rooms: userRooms
      };

      // Track connected user
      if (!this.connectedUsers.has(user.id)) {
        this.connectedUsers.set(user.id, new Set());
      }
      this.connectedUsers.get(user.id)!.add(socket.id);

      // Update user online status
      await User.update(
        { is_online: true, last_seen: new Date() },
        { where: { id: user.id } }
      );

      // Join user to their rooms
      userRooms.forEach(roomId => {
        socket.join(`room_${roomId}`);
      });

      // Notify rooms about user coming online
      this.broadcastUserStatus(user.id, user.username, true, userRooms);

      socket.emit('authenticated', {
        user: { id: user.id, username: user.username },
        rooms: userRooms
      });

      console.log(`User ${user.username} authenticated with socket ${socket.id}`);
    } catch (error) {
      console.error('Authentication error:', error);
      socket.emit(SOCKET_EVENTS.AUTH_ERROR, { error: 'Authentication failed' });
      socket.disconnect();
    }
  }

  private async handleJoinRoom(socket: AuthenticatedSocket, data: { roomId: number }) {
    try {
      if (!socket.user) {
        socket.emit(SOCKET_EVENTS.ERROR, { error: 'Not authenticated' });
        return;
      }

      const { roomId } = data;

      // Check if user is member of this room
      const membership = await RoomMember.findOne({
        where: { room_id: roomId, user_id: socket.user.id }
      });

      if (!membership) {
        socket.emit(SOCKET_EVENTS.ERROR, { error: 'Not a member of this room' });
        return;
      }

      socket.join(`room_${roomId}`);
      
      if (!socket.user.rooms.includes(roomId)) {
        socket.user.rooms.push(roomId);
      }

      // Get room info and members
      const room = await Room.findByPk(roomId);
      const members = await this.getRoomMembersWithStatus(roomId);

      socket.emit(SOCKET_EVENTS.ROOM_JOINED, {
        room: {
          id: room!.id,
          name: room!.name,
          description: room!.description
        },
        members
      });

      // Notify other room members
      socket.to(`room_${roomId}`).emit(SOCKET_EVENTS.USER_ONLINE, {
        userId: socket.user.id,
        username: socket.user.username
      });

    } catch (error) {
      console.error('Join room error:', error);
      socket.emit(SOCKET_EVENTS.ERROR, { error: 'Failed to join room' });
    }
  }

  private handleLeaveRoom(socket: AuthenticatedSocket, data: { roomId: number }) {
    if (!socket.user) {
      socket.emit(SOCKET_EVENTS.ERROR, { error: 'Not authenticated' });
      return;
    }

    const { roomId } = data;
    socket.leave(`room_${roomId}`);
    
    // Remove room from user's rooms
    socket.user.rooms = socket.user.rooms.filter(id => id !== roomId);

    socket.emit(SOCKET_EVENTS.ROOM_LEFT, { roomId });
    
    // Notify other room members
    socket.to(`room_${roomId}`).emit(SOCKET_EVENTS.USER_OFFLINE, {
      userId: socket.user.id,
      username: socket.user.username
    });
  }

  private async handleSendMessage(socket: AuthenticatedSocket, data: { content: string; roomId: number }) {
    try {
      if (!socket.user) {
        socket.emit(SOCKET_EVENTS.MESSAGE_ERROR, { error: 'Not authenticated' });
        return;
      }

      const { content, roomId } = data;

      // Validate message content
      if (!content || content.trim().length === 0) {
        socket.emit(SOCKET_EVENTS.MESSAGE_ERROR, { error: 'Message content cannot be empty' });
        return;
      }

      if (content.length > 1000) {
        socket.emit(SOCKET_EVENTS.MESSAGE_ERROR, { error: 'Message too long' });
        return;
      }

      // Check rate limit
      if (!rateLimiter.checkMessageLimit(socket.user.id)) {
        socket.emit(SOCKET_EVENTS.MESSAGE_ERROR, { error: 'Rate limit exceeded' });
        return;
      }

      // Check if user is member of this room
      const membership = await RoomMember.findOne({
        where: { room_id: roomId, user_id: socket.user.id }
      });

      if (!membership) {
        socket.emit(SOCKET_EVENTS.MESSAGE_ERROR, { error: 'Not a member of this room' });
        return;
      }

      // Save message to database
      const message = await Message.create({
        room_id: roomId,
        user_id: socket.user.id,
        content: content.trim()
      });

      const messageData: MessageData = {
        id: message.id,
        content: message.content,
        userId: socket.user.id,
        username: socket.user.username,
        roomId: roomId,
        createdAt: message.created_at
      };

      // Broadcast message to all room members
      this.io.to(`room_${roomId}`).emit(SOCKET_EVENTS.RECEIVE_MESSAGE, messageData);

      // Clear typing status for this user
      this.handleTypingStop(socket, { roomId });

    } catch (error) {
      console.error('Send message error:', error);
      socket.emit(SOCKET_EVENTS.MESSAGE_ERROR, { error: 'Failed to send message' });
    }
  }

  private handleTypingStart(socket: AuthenticatedSocket, data: { roomId: number }) {
    if (!socket.user) return;

    const { roomId } = data;

    // Check rate limit for typing
    if (!rateLimiter.checkTypingLimit(socket.user.id)) {
      return;
    }

    // Add user to typing list for this room
    if (!this.typingUsers.has(roomId)) {
      this.typingUsers.set(roomId, new Set());
    }
    this.typingUsers.get(roomId)!.add(socket.user.id);

    // Notify other users in the room
    socket.to(`room_${roomId}`).emit(SOCKET_EVENTS.USER_TYPING, {
      userId: socket.user.id,
      username: socket.user.username,
      roomId,
      isTyping: true
    });
  }

  private handleTypingStop(socket: AuthenticatedSocket, data: { roomId: number }) {
    if (!socket.user) return;

    const { roomId } = data;

    // Remove user from typing list
    if (this.typingUsers.has(roomId)) {
      this.typingUsers.get(roomId)!.delete(socket.user.id);
    }

    // Notify other users in the room
    socket.to(`room_${roomId}`).emit(SOCKET_EVENTS.USER_TYPING, {
      userId: socket.user.id,
      username: socket.user.username,
      roomId,
      isTyping: false
    });
  }

  private async handleDisconnect(socket: AuthenticatedSocket) {
    if (!socket.user) return;

    console.log(`User ${socket.user.username} disconnected: ${socket.id}`);

    const userId = socket.user.id;
    const userSockets = this.connectedUsers.get(userId);

    if (userSockets) {
      userSockets.delete(socket.id);

      // If user has no more active connections, mark as offline
      if (userSockets.size === 0) {
        this.connectedUsers.delete(userId);
        
        // Update database
        await User.update(
          { is_online: false, last_seen: new Date() },
          { where: { id: userId } }
        );

        // Clear rate limits
        rateLimiter.clearUserLimits(userId);

        // Clear typing status
        socket.user.rooms.forEach(roomId => {
          if (this.typingUsers.has(roomId)) {
            this.typingUsers.get(roomId)!.delete(userId);
          }
        });

        // Notify rooms about user going offline
        this.broadcastUserStatus(userId, socket.user.username, false, socket.user.rooms);
      }
    }
  }

  private async getRoomMembersWithStatus(roomId: number) {
    const members = await User.findAll({
      include: [
        {
          model: RoomMember,
          where: { room_id: roomId },
          attributes: ['role', 'joined_at']
        }
      ],
      attributes: { exclude: ['password_hash', 'email'] }
    });

    return members.map(member => ({
      id: member.id,
      username: member.username,
      isOnline: member.is_online,
      lastSeen: member.last_seen,
      role: (member as any).RoomMember.role
    }));
  }

  private broadcastUserStatus(userId: number, username: string, isOnline: boolean, rooms: number[]) {
    rooms.forEach(roomId => {
      this.io.to(`room_${roomId}`).emit(SOCKET_EVENTS.USER_STATUS, {
        userId,
        username,
        isOnline,
        timestamp: new Date()
      });
    });
  }

  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  public getUserSocketCount(userId: number): number {
    return this.connectedUsers.get(userId)?.size || 0;
  }
}

export default SocketHandler;
