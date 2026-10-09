const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');

const env = require('./config/env');
const apiRoutes = require('./routes');
const { notFound, errorHandler } = require('./middleware/error');

const app = express();

// Needed when the app runs behind a reverse proxy (Render, Nginx, ...).
app.set('trust proxy', 1);

// Security headers (Helmet sets safe defaults).
app.use(helmet());

// CORS - only the frontend origin defined in .env may call the API,
// and credentials (the JWT cookie) are allowed.
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);

// Body parsers.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Reads the httpOnly JWT cookie.
app.use(cookieParser());

// Removes $ / . characters from user input => NoSQL injection protection.
app.use(mongoSanitize());

// Request logging in development.
if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// API version 1.
app.use('/api/v1', apiRoutes);

// 404 + central error handler (must be registered last).
app.use(notFound);
app.use(errorHandler);

module.exports = app;
