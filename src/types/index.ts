export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: Date;
  last_seen: Date;
  is_online: boolean;
}

export interface Room {
  id: number;
  name: string;
  description?: string;
  is_private: boolean;
  invite_code?: string;
  created_by: number;
  created_at: Date;
}

export interface RoomMember {
  id: number;
  room_id: number;
  user_id: number;
  joined_at: Date;
  role: 'admin' | 'member';
}

export interface Message {
  id: number;
  room_id: number;
  user_id: number;
  content: string;
  message_type: 'text' | 'system';
  created_at: Date;
  updated_at: Date;
}


export interface SocketUser {
  id: number;
  username: string;
  rooms: number[];
}

export interface TypingData {
  userId: number;
  username: string;
  roomId: number;
}

export interface MessageData {
  id: number;
  content: string;
  userId: number;
  username: string;
  roomId: number;
  createdAt: Date;
}
