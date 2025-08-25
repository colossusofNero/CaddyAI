import { Message } from '../types';

// Simulated AI responses for demo purposes
const AI_RESPONSES = [
  "I'm here to help! What would you like to know?",
  "That's an interesting question. Let me think about that...",
  "Based on what you've shared, I'd suggest considering multiple perspectives on this topic.",
  "I understand your concern. Here's what I think might help...",
  "Great question! This is actually a complex topic with several important aspects to consider.",
  "I'm happy to help you explore this further. Could you provide more context?",
  "From my analysis, there are a few key points worth discussing...",
  "That's a thoughtful approach. Let me add some additional insights...",
  "I see where you're coming from. Here's another way to look at it...",
  "Excellent point! This connects to several important concepts..."
];

export async function generateAIResponse(messages: Message[]): Promise<string> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const lastMessage = messages[messages.length - 1];
  
  if (lastMessage.content.toLowerCase().includes('hello') || 
      lastMessage.content.toLowerCase().includes('hi')) {
    return "Hello! I'm Caddy AI, your personal assistant. How can I help you today?";
  }
  
  if (lastMessage.content.toLowerCase().includes('help')) {
    return "I'm here to assist you with various tasks including answering questions, helping with analysis, creative writing, coding assistance, and much more. What specific area would you like help with?";
  }
  
  // Return a random response for demo
  return AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)];
}

export function generateConversationTitle(firstMessage: string): string {
  const words = firstMessage.split(' ').slice(0, 4);
  return words.join(' ') + (firstMessage.split(' ').length > 4 ? '...' : '');
}