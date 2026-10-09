const mongoose = require('mongoose');
const env = require('./env');

/**
 * Connects to MongoDB using the connection string from .env.
 * Works with a local MongoDB server or MongoDB Atlas - just change MONGO_URI.
 */
const connectDB = async () => {
  mongoose.set('strictQuery', true);

  const conn = await mongoose.connect(env.mongoUri);

  console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

  // Log disconnects so we notice if the database goes away while running.
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB disconnected. Trying to reconnect...');
  });

  return conn;
};

module.exports = connectDB;
