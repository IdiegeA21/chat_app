import Joi from 'joi';

export const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const createRoomSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().max(500).optional(),
  is_private: Joi.boolean().default(false)
});

export const joinRoomSchema = Joi.object({
  invite_code: Joi.string().when('room_id', {
    is: Joi.exist(),
    then: Joi.optional(),
    otherwise: Joi.required()
  }),
  room_id: Joi.number().integer().positive().optional()
}).xor('invite_code', 'room_id');

export const sendMessageSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required(),
  room_id: Joi.number().integer().positive().required()
});
