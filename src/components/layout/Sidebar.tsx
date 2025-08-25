import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Settings, Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Conversation } from '../../types';

interface SidebarProps {
  conversations: Conversation[];
  currentConversationId: string | null;
  onNewConversation: () => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onOpenSettings: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({
  conversations,
  currentConversationId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  onOpenSettings,
  isOpen,
  onToggle
}: SidebarProps) {
  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onToggle}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : '-100%',
          width: isOpen ? 280 : 0
        }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="fixed left-0 top-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 lg:relative lg:translate-x-0 lg:w-80"
      >
        <div className="flex flex-col h-full p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Caddy AI
            </h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="lg:hidden"
            >
              <X size={20} />
            </Button>
          </div>

          {/* New Conversation Button */}
          <Button
            onClick={onNewConversation}
            className="w-full mb-6 bg-blue-600 hover:bg-blue-700"
          >
            <Plus size={16} className="mr-2" />
            New Conversation
          </Button>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            <h2 className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-3 uppercase tracking-wider">
              Recent Conversations
            </h2>
            <div className="space-y-2">
              {conversations.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  No conversations yet
                </p>
              ) : (
                conversations.map((conversation) => (
                  <motion.div
                    key={conversation.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                      currentConversationId === conversation.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => onSelectConversation(conversation.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <MessageSquare size={16} className="mt-0.5 text-gray-400 dark:text-gray-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {conversation.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {conversation.messages.length} messages
                        </p>
                      </div>
                    </div>
                    
                    {/* Delete button (appears on hover) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation(conversation.id);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Settings Button */}
          <Button
            variant="ghost"
            onClick={onOpenSettings}
            className="w-full justify-start mt-4"
          >
            <Settings size={16} className="mr-2" />
            Settings
          </Button>
        </div>
      </motion.aside>

      {/* Mobile toggle button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="fixed top-4 left-4 z-30 lg:hidden"
      >
        <Menu size={20} />
      </Button>
    </>
  );
}