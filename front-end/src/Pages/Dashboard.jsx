import { useEffect, useState, useRef } from 'react';
import socket from '../services/socket';
import { useNavigate } from 'react-router-dom';
import { BiSend } from "react-icons/bi";
import { IoMdLogOut } from "react-icons/io";
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import { RiEmojiStickerFill } from "react-icons/ri";

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('user'));
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUser, setTypingUser] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const typingTimeoutRef = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Fetch persisted messages once on mount
  useEffect(() => {
    fetch(`${import.meta.env.VITE_SOCKET_URL}/api/messages`)
      .then(res => res.json())
      .then(data => {
        setMessages(data.map(msg => ({
          user: msg.user,
          message: msg.message,
          timestamp: new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })));
      })
      .catch(err => console.error('❌ Failed to fetch messages:', err));
  }, []);

  useEffect(() => {
    const onConnect = () => {
      console.log('🟢 Connected to socket:', socket.id);
      socket.emit('userConnected', {
        name: user.name,
        id: user.id,
      });
    };

    const onOnlineUsers = (users) => {
      setOnlineUsers(users);
    };

    const onChatMessage = (data) => {
      setMessages((prev) => [...prev, data]);
    };

    const onTyping = (typingUser) => {
      setTypingUser(typingUser);
      setIsTyping(true);
    };

    const onStopTyping = () => {
      setIsTyping(false);
      setTypingUser('');
    };

    socket.on('connect', onConnect);
    socket.on('onlineUsers', onOnlineUsers);
    socket.on('chatMessage', onChatMessage);
    socket.on('typing', onTyping);
    socket.on('stopTyping', onStopTyping);

    return () => {
      socket.off('connect', onConnect);
      socket.off('onlineUsers', onOnlineUsers);
      socket.off('chatMessage', onChatMessage);
      socket.off('typing', onTyping);
      socket.off('stopTyping', onStopTyping);
    };
  }, [user.name, user.id]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleTyping = (e) => {
    setMessage(e.target.value);
    socket.emit('typing', user.name);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping');
    }, 1000);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    socket.emit('chatMessage', {
      user: user.name,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    setMessage('');
    socket.emit('stopTyping');
    setShowEmojiPicker(false); // close emoji picker on send
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const addEmoji = (emoji) => {
    setMessage(prev => prev + emoji.native);
    setShowEmojiPicker(false); // auto-close emoji picker after selection
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gradient-to-r from-purple-100 via-blue-50 to-white">

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white shadow-lg border-r border-gray-300 p-6 flex flex-col">
        <h2 className="text-xl font-bold text-center mb-6 text-gray-800 tracking-wide">Online Users</h2>
        <ul className="flex-1 overflow-auto space-y-3 text-sm text-gray-700">
          {onlineUsers.length === 0 && (
            <li className="text-center text-gray-400 italic">No users online</li>
          )}
          {onlineUsers.map((u, idx) => (
            <li
              key={idx}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg
                ${u.name === user.name ? 'bg-blue-100 font-semibold' : 'hover:bg-gray-100 cursor-pointer'}`}
            >
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <span className="select-none">{u.name === user.name ? `${u.name} (You)` : u.name}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={handleLogout}
          className="mt-6 bg-red-600 hover:bg-red-700 text-white text-sm rounded-md py-2 font-semibold transition"
          aria-label="Logout"
        >
          <IoMdLogOut className="inline-block mr-2 mb-1" /> Logout
        </button>
      </aside>

      {/* Chat content */}
      <main className="flex-1 p-6 max-w-4xl mx-auto flex flex-col justify-between">

        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Hello, <span className="text-indigo-600">{user?.name}</span>
          </h1>
        </header>

        {/* Messages container */}
        <section className="flex-1 overflow-y-auto bg-white rounded-xl shadow-lg p-6 mb-4 max-h-[65vh] md:max-h-[75vh] scrollbar-thin scrollbar-thumb-indigo-300 scrollbar-track-indigo-100">
          {messages.length === 0 ? (
            <p className="text-center text-gray-400 italic select-none">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg, index) => {
              const isCurrentUser = msg.user === user.name;
              return (
                <div
                  key={index}
                  className={`mb-4 flex items-start ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isCurrentUser && (
                    <div className="flex flex-col items-center mr-3">
                      <div className="w-10 h-10 bg-indigo-500 text-white rounded-full flex items-center justify-center font-semibold select-none text-lg">
                        {msg.user.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs mt-1 text-gray-600">{msg.user}</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[70%] p-4 rounded-xl shadow-md break-words
                      ${isCurrentUser ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-900 rounded-bl-none'}`}
                  >
                    <p className="whitespace-pre-line">{msg.message}</p>
                    <span className="block text-xs mt-1 text-gray-400 text-right select-none">{msg.timestamp}</span>
                  </div>
                  {isCurrentUser && (
                    <div className="flex flex-col items-center ml-3">
                      <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold select-none text-lg">
                        {msg.user.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-xs mt-1 text-gray-600">{msg.user} (You)</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </section>

        {/* Typing indicator */}
        {isTyping && typingUser !== user.name && (
          <div className="mb-2 text-sm italic text-gray-500 select-none" aria-live="polite">{typingUser} is typing...</div>
        )}

        {/* Message input form with emoji picker */}
        <form onSubmit={sendMessage} className="relative mt-2">
          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-16 left-0 z-50">
              <Picker data={data} onEmojiSelect={addEmoji} />
            </div>
          )}

          <div className="flex gap-2 items-center">
            {/* Emoji toggle button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(prev => !prev)}
              className="text-2xl p-2 rounded-full cursor-pointer bg-gray-300"
              title="Add emoji"
              aria-label="Toggle emoji picker"
              aria-expanded={showEmojiPicker}
            >
              <RiEmojiStickerFill color='#111111' />
            </button>

            <input
              value={message}
              onChange={handleTyping}
              placeholder="Type a message..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition shadow-sm"
              autoComplete="off"
              aria-label="Message input"
            />

            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 rounded-full p-3 flex items-center justify-center text-white shadow-md transition"
              aria-label="Send message"
              disabled={!message.trim()}
            >
              <BiSend size={20} />
            </button>
          </div>
        </form>

      </main>
    </div>
  );
}
