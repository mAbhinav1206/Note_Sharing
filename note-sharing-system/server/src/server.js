/**
 * Entry point: connect to MongoDB, then start the HTTP server.
 * Run with:  npm run dev   (auto-restart via nodemon)
 *            npm start     (plain node, production)
 */
const app = require('./app');
const env = require('./config/env');
const connectDB = require('./config/db');

const start = async () => {
  try {
    // Make sure server/uploads/{tmp,notes,avatars} exist before any upload.
    require('./services/storage').ensureDirs();

    await connectDB();

    const server = app.listen(env.port, () => {
      console.log(`Server running in ${env.nodeEnv} mode on http://localhost:${env.port}`);
      console.log(`Health check: http://localhost:${env.port}/api/v1/health`);
    });

    // Graceful shutdown: close the server and DB connection on Ctrl+C.
    const shutdown = (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(() => {
        require('mongoose').connection
          .close()
          .then(() => process.exit(0))
          .catch(() => process.exit(1));
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

start();
