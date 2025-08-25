import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Paperclip } from 'lucide-react';
import { Button } from '../ui/Button';

interface ChatInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [message]);

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
      <form onSubmit={handleSubmit} className="flex items-end space-x-3">
        {/* Attachment button (placeholder for future feature) */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled
          className="flex-shrink-0 mb-2 opacity-50"
        >
          <Paperclip size={18} />
        </Button>

        {/* Message input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message... (Shift+Enter for new line)"
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>

        {/* Send button */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            type="submit"
            disabled={!message.trim() || disabled}
            className="flex-shrink-0 mb-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed w-10 h-10 rounded-full p-0 flex items-center justify-center"
          >
            <Send size={16} />
          </Button>
        </motion.div>
      </form>
    </div>
  );
}