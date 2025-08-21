require("dotenv").config();
import sequelize from '../src/config/database';
import User from '../src/models/User';
import Room from '../src/models/Room';
import RoomMember from '../src/models/RoomMember';
import Message from '../src/models/Message';


export const setupTestDatabase = async () => {
  // Setup associations
  User.hasMany(Room, { foreignKey: 'created_by' });
  User.hasMany(RoomMember, { foreignKey: 'user_id' });
  User.hasMany(Message, { foreignKey: 'user_id' });

  Room.belongsTo(User, { foreignKey: 'created_by' });
  Room.hasMany(RoomMember, { foreignKey: 'room_id' });
  Room.hasMany(Message, { foreignKey: 'room_id' });

  RoomMember.belongsTo(User, { foreignKey: 'user_id' });
  RoomMember.belongsTo(Room, { foreignKey: 'room_id' });

  Message.belongsTo(User, { foreignKey: 'user_id' });
  Message.belongsTo(Room, { foreignKey: 'room_id' });

  await sequelize.sync({ force: true });
};

export const teardownTestDatabase = async () => {
  await sequelize.close();
};
