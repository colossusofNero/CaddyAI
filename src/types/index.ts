export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isLoading?: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    fontSize: 'small' | 'medium' | 'large';
    language: string;
  };
}

export interface Settings {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  language: string;
  notifications: boolean;
  soundEnabled: boolean;
}