const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/', (req, res) => {
  const isAtlas = mongoose.connection.readyState === 1;

  res.status(200).json({
    status: 'ok',
    app: 'N CAFÉ Backend API',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: isAtlas ? 'connected (MongoDB)' : 'ready (local JSON persistence)',
    engine: isAtlas ? 'MongoDB Atlas / Mongoose' : 'Local File Persistence Engine',
    version: '1.0.0'
  });
});

module.exports = router;
