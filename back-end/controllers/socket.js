// Import Server class from socket.io to create a socket server
const { Server } = require('socket.io');

// Import the Message model to interact with MongoDB messages collection
const Message = require('./models/Message');

// Create a map to store online users by their socket ID
const onlineUsers = new Map();

// Function to set up and return a socket.io server
function setupSocket(server) {
  // Initialize a new socket.io server with CORS config
  const io = new Server(server, {
    cors: {
      origin: 'http://localhost:5173', // Frontend address
      methods: ['GET', 'POST'], // Allowed HTTP methods
    },
  });

  // Listen for new client socket connections
  io.on('connection', async (socket) => {
    console.log('🟢 New client connected:', socket.id);

    // On connection, send last 50 messages as chat history
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

    // Listen for when a user connects (sends their info)
    socket.on('userConnected', (user) => {
      // Store user with their socket ID
      onlineUsers.set(socket.id, user);
      // Broadcast updated list of online users to everyone
      io.emit('onlineUsers', Array.from(onlineUsers.values()));
    });

    // Listen for chat messages sent from the client
    socket.on('chatMessage', async ({ user, message }) => {
      const timestamp = new Date(); // Add current time
      try {
        // Save message to MongoDB
        const newMessage = new Message({ user, message, timestamp });
        await newMessage.save();

        // Broadcast the message to all clients
        io.emit('chatMessage', {
          user,
          message,
          timestamp: timestamp.toLocaleTimeString(),
        });
      } catch (err) {
        console.error('Error saving message:', err);
      }
    });

    // Listen for "typing" event and broadcast to others
    socket.on('typing', (user) => {
      socket.broadcast.emit('typing', user); // Notify others only
    });

    // Listen for "stopTyping" event and broadcast to others
    socket.on('stopTyping', () => {
      socket.broadcast.emit('stopTyping');
    });

    // Listen for user disconnecting
    socket.on('disconnect', () => {
      console.log('🔴 Client disconnected:', socket.id);
      // Remove the user from the online users list
      onlineUsers.delete(socket.id);
      // Broadcast updated online users list
      io.emit('onlineUsers', Array.from(onlineUsers.values()));
    });
  });

  // Return the io instance so it can be used in server.js
  return io;
}

// Export the setupSocket function so it can be imported elsewhere
module.exports = setupSocket;
