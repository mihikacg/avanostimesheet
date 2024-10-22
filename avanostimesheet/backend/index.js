const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const router = require('./routes/router');

// Create express app
const app = express();

// Set port
const port = process.env.PORT || 4000;

// Basic CORS configuration - Allow all origins for development
const corsOptions = {
  origin: '*',  // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '10mb' }));

// Simple request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/', router);

// Handle undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'The requested resource does not exist' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Start server
const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Basic error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (server) {
    server.close(() => {
      console.log('Server closed due to error');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

module.exports = app;