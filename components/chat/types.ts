import { RefObject } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: Date;
}

export interface ChatInterfaceProps {
  chatId: string;
  onUpdateChatTitle?: (title: string) => void;
}

export interface MemoryContext {
  sessionId: string;
  conversationTopic?: string;
  keywords?: string[];
  lastInteraction?: string;
  memories?: string[];
  userDetails?: {
    name?: string;
    college?: string;
    companies?: string[];
    preferredRoles?: string[];
    experience?: string;
    skills?: string[];
    interests?: string[];
    [key: string]: any; // Allow for flexible additional properties
  };
  userProfile?: any;
}

export interface ChatHeaderProps {
  profileData: any;
  isMobileView: boolean;
  toggleMobileMenu: () => void;
  startTour: () => void;
}

export interface ChatMessagesProps {
  messages: Message[];
  isLoadingHistory: boolean;
  showSuggestions: boolean;
  typingIndicator: boolean;
  chatId: string;
  profileData: any;
  getSuggestions: () => string[];
  handleSuggestionClick: (suggestion: string) => void;
  messagesEndRef: RefObject<HTMLDivElement>;
}

export interface ChatInputProps {
  inputValue: string;
  setInputValue: (value: string) => void;
  searchMode: 'chat' | 'web' | 'news';
  setSearchMode: (mode: 'chat' | 'web' | 'news') => void;
  searchType: 'web' | 'news' | null;
  setSearchType: (type: 'web' | 'news' | null) => void;
  isLoading: boolean;
  isSearching: boolean;
  handleSearch: (type: 'web' | 'news') => void;
  handleSendMessage: () => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  getPlaceholderText: () => string;
  inputRef: RefObject<HTMLInputElement>;
}
