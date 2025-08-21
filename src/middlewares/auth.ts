import { Request, Response, NextFunction } from 'express';
import jwt from "jsonwebtoken";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
import { JWT_CONFIG } from '../config/jwt';
import User from '../models/User';
// import { AuthRequest } from '../types';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.get('authorization'); 
  const token = authHeader ? authHeader.split(' ')[1] : undefined;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  if (!JWT_CONFIG.secret) {
    return res.status(500).json({ error: 'JWT secret not configured' });
  }

  try {
    const decoded = jwt.verify(token, JWT_CONFIG.secret) as JwtPayload;
    if (!decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }
    const user = await User.findByPk((decoded as any).userId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user.toJSON();
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export const authenticateSocket = async (token: string): Promise<User | null> => {
  if (!JWT_CONFIG.secret) return null;
  try {
    const decoded = jwt.verify(token, JWT_CONFIG.secret) as JwtPayload;
    if (!decoded || typeof decoded !== 'object' || !('userId' in decoded)) {
      return null;
    }
    const user = await User.findByPk((decoded as any).userId);
    return user;
  } catch (error) {
    return null;
  }
};