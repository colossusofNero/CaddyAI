import React, { useState } from 'react';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useConversations } from '../../hooks/useConversations';
import { generateAIResponse } from '../../utils/ai';

interface ChatAreaProps {
  onOpenSettings: () => void;
}

export function ChatArea({ onOpenSettings }: ChatAreaProps) {
  const { currentConversation, addMessage, createConversation } = useConversations();
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (content: string) => {
    let conversationId = currentConversation?.id;
    
    // Create new conversation if none exists
    if (!conversationId) {
      const newConversation = createConversation();
      conversationId = newConversation.id;
    }

    // Add user message
    addMessage(conversationId, {
      content,
      role: 'user'
    });

    // Generate AI response
    setIsLoading(true);
    try {
      const messages = currentConversation?.messages || [];
      const response = await generateAIResponse([
        ...messages,
        { id: 'temp', content, role: 'user', timestamp: new Date() }
      ]);

      // Add AI response
      addMessage(conversationId, {
        content: response,
        role: 'assistant'
      });
    } catch (error) {
      console.error('Error generating AI response:', error);
      addMessage(conversationId, {
        content: "I'm sorry, I encountered an error while processing your message. Please try again.",
        role: 'assistant'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Messages */}
      <MessageList 
        messages={currentConversation?.messages || []} 
        isLoading={isLoading} 
      />
      
      {/* Input */}
      <ChatInput 
        onSendMessage={handleSendMessage} 
        disabled={isLoading} 
      />
    </div>
  );
}