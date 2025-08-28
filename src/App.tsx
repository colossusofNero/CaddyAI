import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, Send, MessageSquare, Settings, Plus, X, Menu, User, Bot, Loader2 } from 'lucide-react';
import { useVoiceChat } from './hooks/useVoiceChat';
import { useTheme } from './hooks/useTheme';

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

// Simple AI responses for golf caddie
const AI_RESPONSES = [
  "Based on the conditions, I'd recommend a 7-iron with a slight draw. The wind is helping, so club down one.",
  "That's a tough pin position. I'd suggest aiming for the center of the green with an 8-iron for safety.",
  "With that yardage and the elevated green, take one more club. A smooth 6-iron should get you there.",
  "The bunker short is in play. I'd go with a 5-iron and make sure you get it to the back of the green.",
  "Perfect yardage for your pitching wedge. Just make a smooth swing and trust your distance.",
  "That's right in your wheelhouse. 9-iron with confidence - you've got this shot.",
  "The green is running fast today. I'd take a 7-iron and land it short, let it release to the pin.",
  "With the crosswind, aim a little left and let the wind bring it back. 8-iron should be perfect.",
];

async function generateAIResponse(messages: Message[]): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const lastMessage = messages[messages.length - 1];
  
  if (lastMessage.content.toLowerCase().includes('hello') || 
      lastMessage.content.toLowerCase().includes('hi')) {
    return "Hello! I'm your AI golf caddie. I'm here to help you make the best shot decisions on the course. What's your situation?";
  }
  
  if (lastMessage.content.toLowerCase().includes('help')) {
    return "I can help you with club selection, reading greens, course management, and shot strategy. Just describe your lie, distance, and conditions, and I'll give you my recommendation.";
  }
  
  if (lastMessage.content.toLowerCase().includes('distance') || 
      lastMessage.content.toLowerCase().includes('yard')) {
    return AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
  }
  
  // Return a random golf-specific response
  return AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
}

function generateConversationTitle(firstMessage: string): string {
  const words = firstMessage.split(' ').slice(0, 4);
  return words.join(' ') + (firstMessage.split(' ').length > 4 ? '...' : '');
}

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme();
  const { supported: voiceSupported, listening, transcript, start: startListening, stop: stopListening, speak } = useVoiceChat();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentConversation = currentConversationId 
    ? conversations.find(c => c.id === currentConversationId) 
    : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [currentConversation?.messages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  }, [message]);

  const createConversation = () => {
    const newConversation: Conversation = {
      id: crypto.randomUUID(),
      title: 'New Conversation',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    setSidebarOpen(false);
    return newConversation;
  };

  const selectConversation = (id: string) => {
    setCurrentConversationId(id);
    setSidebarOpen(false);
  };

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (currentConversationId === id) {
      setCurrentConversationId(null);
    }
  };

  const addMessage = (conversationId: string, messageData: Omit<Message, 'id' | 'timestamp'>) => {
    const newMessage: Message = {
      ...messageData,
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
        if (conversation.messages.length === 0 && messageData.role === 'user') {
          updatedConversation.title = generateConversationTitle(messageData.content);
        }

        return updatedConversation;
      }
      return conversation;
    }));

    return newMessage;
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    let conversationId = currentConversationId;
    
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

      // Speak the response
      if (voiceSupported) {
        speak(response);
      }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      handleSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleVoiceResult = (transcript: string) => {
    if (transcript.trim()) {
      handleSendMessage(transcript.trim());
    }
  };

  const toggleVoice = async () => {
    if (listening) {
      await stopListening();
    } else {
      await startListening(handleVoiceResult);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-50 lg:relative lg:translate-x-0 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0 w-80' : '-translate-x-full w-0 lg:w-80'
      }`}>
        <div className="flex flex-col h-full p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Golf Caddie AI
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X size={20} />
            </button>
          </div>

          {/* New Conversation Button */}
          <button
            onClick={createConversation}
            className="w-full mb-6 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
          >
            <Plus size={16} className="mr-2" />
            New Conversation
          </button>

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
                  <div
                    key={conversation.id}
                    className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${
                      currentConversationId === conversation.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => selectConversation(conversation.id)}
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
                    
                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conversation.id);
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setSettingsOpen(true)}
            className="w-full justify-start mt-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 flex items-center transition-colors"
          >
            <Settings size={16} className="mr-2" />
            Settings
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <Menu size={20} />
          </button>
          <h1 className="font-semibold text-gray-900 dark:text-white">Golf Caddie AI</h1>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {theme === 'dark' ? <Volume2 size={20} /> : <Volume2 size={20} />}
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {!currentConversation || currentConversation.messages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <Bot size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
                  Welcome to Golf Caddie AI
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Your personal AI golf assistant is ready to help with club selection, course strategy, and shot advice.
                </p>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  Try saying: "I'm 150 yards out, pin is back, slight breeze helping"
                </div>
              </div>
            </div>
          ) : (
            <>
              {currentConversation.messages.map((msg, index) => (
                <div
                  key={msg.id}
                  className={`flex items-start space-x-3 ${
                    msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      msg.role === 'user'
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>

                  {/* Message Content */}
                  <div className={`flex-1 max-w-[80%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                    <div
                      className={`inline-block p-4 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-sm'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-sm'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>
                    </div>
                    <div className="mt-1">
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 flex items-center justify-center">
                    <Bot size={16} />
                  </div>
                  <div className="flex-1">
                    <div className="inline-block p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl rounded-tl-sm">
                      <div className="flex items-center space-x-2">
                        <Loader2 size={16} className="animate-spin text-gray-500" />
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Caddie is thinking...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900">
          <form onSubmit={handleSubmit} className="flex items-end space-x-3">
            {/* Voice button */}
            {voiceSupported && (
              <button
                type="button"
                onClick={toggleVoice}
                disabled={isLoading}
                className={`flex-shrink-0 mb-2 p-2 rounded-full transition-colors ${
                  listening
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {listening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
            )}

            {/* Message input */}
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={listening ? "Listening..." : "Ask your golf caddie... (Shift+Enter for new line)"}
                disabled={isLoading || listening}
                rows={1}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              />
              {transcript && (
                <div className="absolute -top-8 left-0 right-0 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                  {transcript}
                </div>
              )}
            </div>

            {/* Send button */}
            <button
              type="submit"
              disabled={!message.trim() || isLoading || listening}
              className="flex-shrink-0 mb-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white w-10 h-10 rounded-full p-0 flex items-center justify-center transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}