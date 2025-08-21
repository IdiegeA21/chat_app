import { Request, Response } from 'express';
import Message from '../models/Message';
import User from '../models/User';
import RoomMember from '../models/RoomMember';
// import { AuthRequest } from '../types';

export const getRoomMessages = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Check if user is member of this room
    const membership = await RoomMember.findOne({
      where: { room_id: roomId, user_id: userId }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this room' });
    }

    const messages = await Message.findAll({
      where: { room_id: roomId },
      include: [
        {
          model: User,
          attributes: ['id', 'username']
        }
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    res.json({
      messages: messages.reverse(), // Reverse to show oldest first
      pagination: {
        page,
        limit,
        hasMore: messages.length === limit
      }
    });
  } catch (error) {
    console.error('Get room messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { content, room_id } = req.body;
    const userId = req.user!.id;

    // Check if user is member of this room
    const membership = await RoomMember.findOne({
      where: { room_id, user_id: userId }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this room' });
    }

    const message = await Message.create({
      room_id,
      user_id: userId,
      content,
      message_type: 'text'
    });

    const messageWithUser = await Message.findByPk(message.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'username']
        }
      ]
    });

    res.status(201).json({
      message: 'Message sent successfully',
      data: messageWithUser
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
