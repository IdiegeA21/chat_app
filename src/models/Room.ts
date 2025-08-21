import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

interface RoomAttributes {
  id: number;
  name: string;
  description?: string;
  is_private: boolean;
  invite_code?: string;
  created_by: number;
  created_at: Date;
}

interface RoomCreationAttributes extends Optional<RoomAttributes, 'id' | 'description' | 'invite_code' | 'created_at'> {}

class Room extends Model<RoomAttributes, RoomCreationAttributes> implements RoomAttributes {
  public id!: number;
  public name!: string;
  public description?: string;
  public is_private!: boolean;
  public invite_code?: string;
  public created_by!: number;
  public created_at!: Date;
}

Room.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_private: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  invite_code: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  sequelize,
  modelName: 'Room',
  tableName: 'rooms',
  timestamps: false
});

export default Room;
