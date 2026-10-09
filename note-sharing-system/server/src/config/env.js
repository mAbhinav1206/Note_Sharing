/**
 * Central place for all environment variables.
 * Loads `.env` once with dotenv, applies safe defaults for development,
 * and fails fast if a critical secret is missing in production.
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5050,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/note_sharing',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
};

// JWT_SECRET is mandatory - refuse to start without it in production.
if (!env.jwtSecret) {
  if (env.nodeEnv === 'production') {
    throw new Error('JWT_SECRET is required. Add it to your .env file.');
  }
  env.jwtSecret = 'dev_only_insecure_secret_do_not_use_in_production';
}

module.exports = env;
