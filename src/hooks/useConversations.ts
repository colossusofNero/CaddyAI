import { useState, useCallback } from 'react';
import { useLocalStorage } from './useLocalStorage';
import { Conversation, Message } from '../types';
import { generateConversationTitle } from '../utils/ai';

export function useConversations() {
  const [conversations, setConversations] = useLocalStorage<Conversation[]>('conversations', []);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const createConversation = useCallback(() => {
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    return newConversation;
  }, [setConversations]);

  const selectConversation = useCallback((id: string) => {
    setCurrentConversationId(id);
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }
  }, [currentConversationId, setConversations]);

  const addMessage = useCallback((conversationId: string, message: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...message,
      id: crypto.randomUUID(),
      timestamp: new Date()
    };

    setConversations(prev => prev.map(conversation => {
      if (conversation.id === conversationId) {
        const updatedConversation = {
          ...conversation,
          messages: [...conversation.messages, newMessage],
          updatedAt: new Date()
        };

        // Update title based on first user message
        if (conversation.messages.length === 0 && message.role === 'user') {
          updatedConversation.title = generateConversationTitle(message.content);
        }

        return updatedConversation;
      }
      return conversation;
    }));

    return newMessage;
  }, [setConversations]);

  const getCurrentConversation = useCallback(() => {
    if (!currentConversationId) return null;
    return conversations.find(c => c.id === currentConversationId) || null;
  }, [conversations, currentConversationId]);

  return {
    conversations,
    currentConversationId,
    currentConversation: getCurrentConversation(),
    createConversation,
    selectConversation,
    deleteConversation,
    addMessage
  };
}