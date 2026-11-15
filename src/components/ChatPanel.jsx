import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, MessageSquare, Bot } from 'lucide-react';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';

export default function ChatPanel() {
  const { messages, sendMessage, roomName } = useRoom();
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText.trim());
    setInputText('');
  };

  const handleQuickEmoji = (emoji) => {
    sendMessage(emoji);
  };

  return (
    <div className="h-full flex flex-col bg-[#11131f] select-none text-xs">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-gray-800/80 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-gray-200 tracking-wide text-xs">Room Discussion</span>
        </div>
        <span className="text-[10px] text-gray-500 font-mono">Live</span>
      </div>

      {/* Message List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 select-text">
        {messages.map((msg) => {
          if (msg.isSystem) {
            return (
              <div key={msg.id} className="flex items-center space-x-2 p-2 rounded-lg bg-gray-900/60 border border-gray-800/60 text-[11px] text-gray-400">
                <Bot className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="flex-1">{msg.text}</span>
                <span className="text-[9px] text-gray-600">{msg.timestamp}</span>
              </div>
            );
          }

          const isMe = msg.senderId === user?.id || msg.senderName.includes('(You)');

          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-2 ${isMe ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              {msg.avatar ? (
                <img
                  src={msg.avatar}
                  alt={msg.senderName}
                  className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-0.5">
                  {msg.senderName.charAt(0)}
                </div>
              )}

              <div className={`max-w-[80%] space-y-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center space-x-1.5 text-[10px] text-gray-400">
                  <span className="font-medium text-gray-300">{msg.senderName}</span>
                  <span className="text-gray-600 font-mono text-[9px]">{msg.timestamp}</span>
                </div>
                <div
                  className={`px-3 py-2 rounded-xl text-xs break-words shadow-sm ${
                    isMe
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none'
                      : 'bg-[#181a29] border border-gray-800 text-gray-200 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick emoji reactions */}
      <div className="px-3 py-1.5 border-t border-gray-800/60 flex items-center space-x-2 bg-gray-900/40">
        {['👍', '🚀', '🔥', '💡', '❤️', '🎉'].map((emoji) => (
          <button
            key={emoji}
            onClick={() => handleQuickEmoji(emoji)}
            className="hover:scale-125 transition-transform text-xs p-1"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input box */}
      <form onSubmit={handleSend} className="p-3 border-t border-gray-800 bg-[#0d0f19]">
        <div className="flex items-center space-x-2 bg-gray-950 border border-gray-800 rounded-xl px-3 py-1.5 focus-within:border-indigo-500 transition-colors">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type message to room..."
            className="flex-1 bg-transparent text-white text-xs outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="text-cyan-400 hover:text-cyan-300 disabled:opacity-40 transition-opacity"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
