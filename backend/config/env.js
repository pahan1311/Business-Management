// Environment variables
require('dotenv').config();

module.exports = {
  DB_URI: process.env.DB_URI,
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'secret',
};
