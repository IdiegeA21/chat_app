import {Request,  Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import Room from '../models/Room';
import RoomMember from '../models/RoomMember';
import User from '../models/User';
import { Op } from 'sequelize';

// interface Request extends Request {
//   user?: { id: string }; // adjust shape to match JWT payload
// }

export const createRoom = async (req: Request, res: Response) => {
  try {
    const { name, description, is_private } = req.body;
    const userId = req.user!.id;

    const invite_code = is_private ? uuidv4().substring(0, 8) : undefined;

    const room = await Room.create({
      name,
      description,
      is_private,
      invite_code,
      created_by: userId
    });

    // Add creator as admin
    await RoomMember.create({
      room_id: room.id,
      user_id: userId,
      role: 'admin'
    });

    res.status(201).json({
      message: 'Room created successfully',
      room: {
        id: room.id,
        name: room.name,
        description: room.description,
        is_private: room.is_private,
        invite_code: room.invite_code,
        created_by: room.created_by
      }
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const joinRoom = async (req: Request, res: Response) => {
  try {
    const { room_id, invite_code } = req.body;
    const userId = req.user!.id;

    let room;
    if (room_id) {
      room = await Room.findByPk(room_id);
    } else if (invite_code) {
      room = await Room.findOne({ where: { invite_code } });
    }

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user is already a member
    const existingMember = await RoomMember.findOne({
      where: { room_id: room.id, user_id: userId }
    });

    if (existingMember) {
      return res.status(400).json({ error: 'Already a member of this room' });
    }

    // For private rooms, require invite code
    if (room.is_private && !invite_code) {
      return res.status(403).json({ error: 'Invite code required for private room' });
    }

    await RoomMember.create({
      room_id: room.id,
      user_id: userId
    });

    res.json({
      message: 'Joined room successfully',
      room: {
        id: room.id,
        name: room.name,
        description: room.description,
        is_private: room.is_private
      }
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserRooms = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const rooms = await Room.findAll({
      include: [
        {
          model: RoomMember,
          where: { user_id: userId },
          attributes: ['role', 'joined_at']
        }
      ]
    });

    res.json({ rooms });
  } catch (error) {
    console.error('Get user rooms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRoomMembers = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const userId = req.user!.id;

    // Check if user is member of this room
    const membership = await RoomMember.findOne({
      where: { room_id: roomId, user_id: userId }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this room' });
    }

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

    res.json({ members });
  } catch (error) {
    console.error('Get room members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const leaveRoom = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const userId = req.user!.id;

    const membership = await RoomMember.findOne({
      where: { room_id: roomId, user_id: userId }
    });

    if (!membership) {
      return res.status(404).json({ error: 'Not a member of this room' });
    }

    await membership.destroy();

    res.json({ message: 'Left room successfully' });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
