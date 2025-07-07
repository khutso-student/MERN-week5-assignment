require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const connectDB = require('./config/db');
const authRoutes = require('./routes/AuthRoutes'); 
const { Server } = require('socket.io');
const Message = require('./models/Message');

const app = express();
const server = http.createServer(app);

// ✅ CORS Setup for Vercel and Localhost
const allowedOrigins = [
  'http://localhost:5173',
  'https://week-5-web-sockets-assignment-khuts.vercel.app',
];

app.use(cors({
  origin: function(origin, callback) {
    // allow requests with no origin (like curl or postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
}));

app.use(express.json());

// ✅ Routes
app.use('/api/auth', authRoutes);

app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const onlineUsers = new Map();

io.on('connection', async (socket) => {
  console.log('🟢 New client connected:', socket.id);

  // Send chat history
  try {
    const messages = await Message.find().sort({ timestamp: 1 }).limit(50);
    socket.emit('chatHistory', messages.map(msg => ({
      user: msg.user,
      message: msg.message,
      timestamp: msg.timestamp.toLocaleTimeString(),
    })));
  } catch (err) {
    console.error('Error loading messages:', err);
  }

  socket.on('userConnected', (user) => {
    onlineUsers.set(socket.id, user);
    io.emit('onlineUsers', Array.from(onlineUsers.values()));
  });

  socket.on('chatMessage', async ({ user, message }) => {
    const timestamp = new Date();
    try {
      const newMessage = new Message({ user, message, timestamp });
      await newMessage.save();

      io.emit('chatMessage', {
        user,
        message,
        timestamp: timestamp.toLocaleTimeString(),
      });
    } catch (err) {
      console.error('Error saving message:', err);
    }
  });

  socket.on('typing', (user) => {
    socket.broadcast.emit('typing', user);
  });

  socket.on('stopTyping', () => {
    socket.broadcast.emit('stopTyping');
  });

  socket.on('disconnect', () => {
    console.log('🔴 Client disconnected:', socket.id);
    onlineUsers.delete(socket.id);
    io.emit('onlineUsers', Array.from(onlineUsers.values()));
  });
});

app.set('io', io);

// ✅ Connect to DB and then start server
const PORT = process.env.PORT || 10000;

(async () => {
  try {
    await connectDB(); // Await MongoDB connection before starting
    server.listen(PORT, () => {
      console.log(`✅ Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
