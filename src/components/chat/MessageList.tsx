import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Message } from '../../types';
import { User, Bot, Loader2 } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {messages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Bot size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
              Welcome to Caddy AI
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your personal AI assistant is ready to help. Start a conversation!
            </p>
          </div>
        </div>
      ) : (
        <>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-start space-x-3 ${
                message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  message.role === 'user'
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                }`}
              >
                {message.role === 'user' ? (
                  <User size={16} />
                ) : (
                  <Bot size={16} />
                )}
              </div>

              {/* Message Content */}
              <div
                className={`flex-1 max-w-[80%] ${
                  message.role === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                <div
                  className={`inline-block p-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-sm'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-sm'
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </p>
                </div>
                <div className="mt-1">
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start space-x-3"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center">
                <Bot size={16} />
              </div>
              <div className="flex-1">
                <div className="inline-block p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm">
                  <div className="flex items-center space-x-2">
                    <Loader2 size={16} className="animate-spin text-gray-500" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Caddy is thinking...
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </>
      )}
    </div>
  );
}