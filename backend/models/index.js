/**
 * Database Models Index
 */

const { Sequelize } = require('sequelize');
const config = require('../config/database.js')[process.env.NODE_ENV || 'development'];
const logger = require('../utils/logger');

// Initialize Sequelize instance
let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

// Import models
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Customer = require('./Customer')(sequelize, Sequelize.DataTypes);
const Product = require('./Product')(sequelize, Sequelize.DataTypes);
const Inventory = require('./Inventory')(sequelize, Sequelize.DataTypes);
const Order = require('./Order')(sequelize, Sequelize.DataTypes);
const OrderItem = require('./OrderItem')(sequelize, Sequelize.DataTypes);
const Delivery = require('./Delivery')(sequelize, Sequelize.DataTypes);
const QRCode = require('./QRCode')(sequelize, Sequelize.DataTypes);
const Inquiry = require('./Inquiry')(sequelize, Sequelize.DataTypes);
const Notification = require('./Notification')(sequelize, Sequelize.DataTypes);

// Define associations
const models = {
  User,
  Customer,
  Product,
  Inventory,
  Order,
  OrderItem,
  Delivery,
  QRCode,
  Inquiry,
  Notification,
};

// Set up associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Export models and sequelize instance
models.sequelize = sequelize;
models.Sequelize = Sequelize;

module.exports = models;
