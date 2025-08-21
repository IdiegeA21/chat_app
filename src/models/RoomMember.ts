import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Room from './Room';

interface RoomMemberAttributes {
  id: number;
  room_id: number;
  user_id: number;
  joined_at: Date;
  role: 'admin' | 'member';
}

interface RoomMemberCreationAttributes extends Optional<RoomMemberAttributes, 'id' | 'joined_at' | 'role'> {}

class RoomMember extends Model<RoomMemberAttributes, RoomMemberCreationAttributes> implements RoomMemberAttributes {
  public id!: number;
  public room_id!: number;
  public user_id!: number;
  public joined_at!: Date;
  public role!: 'admin' | 'member';
}

RoomMember.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  room_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Room,
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  joined_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  role: {
    type: DataTypes.ENUM('admin', 'member'),
    defaultValue: 'member'
  }
}, {
  sequelize,
  modelName: 'RoomMember',
  tableName: 'room_members',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['room_id', 'user_id']
    }
  ]
});

export default RoomMember;
