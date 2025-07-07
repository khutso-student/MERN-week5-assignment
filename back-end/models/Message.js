const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  user: String,
  message: String,
  timestamp: String,
}, { timestamps: true }); // <--- this adds createdAt

module.exports = mongoose.model('Message', messageSchema);
