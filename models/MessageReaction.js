module.exports = (sequelize, DataTypes) => {
  const MessageReaction = sequelize.define("MessageReaction", {
    reaction_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    reaction: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
    },
  });

  MessageReaction.associate = (models) => {
    MessageReaction.belongsTo(models.User, {
      foreignKey: "user_id",
      onDelete: "CASCADE",
    });
    MessageReaction.belongsTo(models.Chat, {
      foreignKey: "message_id",
      onDelete: "CASCADE",
    });
  };

  return MessageReaction;
};
