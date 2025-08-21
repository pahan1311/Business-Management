/**
 * Notification Model
 */

const { NOTIFICATION_TYPES } = require('../utils/constants');

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    type: {
      type: DataTypes.ENUM(...Object.values(NOTIFICATION_TYPES)),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    relatedId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    relatedType: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {},
    },
  }, {
    tableName: 'notifications',
    timestamps: false,
    underscored: false,
    // Removed indexes to avoid sync issues with manually created DB
    hooks: {
      beforeUpdate: (notification) => {
        if (notification.changed('isRead') && notification.isRead && !notification.readAt) {
          notification.readAt = new Date();
        }
      }
    }
  });

  // Instance methods
  Notification.prototype.markAsRead = function() {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
  };

  // Define associations
  Notification.associate = function(models) {
    Notification.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return Notification;
};
