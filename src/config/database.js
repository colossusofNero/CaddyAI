const knex = require('knex');
const knexConfig = require('../../knexfile');
const logger = require('../utils/logger');

const environment = process.env.NODE_ENV || 'development';
const config = knexConfig[environment];

const db = knex(config);

const connectDB = async () => {
  try {
    await db.raw('SELECT 1+1 AS result');
    logger.info('✅ Database connected successfully');
    return db;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
};

const closeDB = async () => {
  await db.destroy();
  logger.info('Database connection closed');
};

module.exports = {
  db,
  connectDB,
  closeDB
};