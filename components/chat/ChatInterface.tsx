"use client"

import { SidebarContext } from "@/app/dashboard/page"
import { TourGuide } from "@/components/TourGuide"
import { toast } from "@/components/ui/use-toast"
import { useChat } from "ai/react"
import { useRouter } from "next/navigation"
import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { v4 as uuidv4 } from "uuid"

// Import sub-components
import { ChatHeader } from "./ChatHeader"
import { ChatInput } from "./ChatInput"
import { ChatMessages } from "./ChatMessages"
import { INTERVIEW_COACH_SYSTEM_PROMPT, defaultSuggestions, interviewKeywords } from "./constants"
import { useMemoryContext } from "./hooks/useMemoryContext"
import { useTourGuide } from "./hooks/useTourGuide"
import { ChatInterfaceProps, Message } from "./types"

export function ChatInterface({ chatId, onUpdateChatTitle }: ChatInterfaceProps) {
  // Use the sidebar context to control mobile menu
  const { toggleMobileMenu } = useContext(SidebarContext);
  
  const [searchType, setSearchType] = useState<'web' | 'news' | null>(null)
  const [searchMode, setSearchMode] = useState<'chat' | 'web' | 'news'>('chat')
  const [isSearching, setIsSearching] = useState(false)
  const [profileData, setProfileData] = useState<any>(null)
  const [savedMessages, setSavedMessages] = useState<Message[]>([])
  const [isInitialFetch, setIsInitialFetch] = useState(true)
  const [isLoadingHistory, setIsLoadingHistory] = useState(true)
  const [inputValue, setInputValue] = useState("") 
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [typingIndicator, setTypingIndicator] = useState(false)
  
  // Tour state
  const { 
    runTour, 
    tourSteps, 
    startTour, 
    handleTourComplete, 
    handleTourSkip 
  } = useTourGuide();

  // Memory context
  const {
    memoryContext,
    setMemoryContext,
    memoryActive,
    setMemoryActive,
    updateMemoryWithLatestMessage,
    extractUserDetails
  } = useMemoryContext(chatId, profileData);
  
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const apiCallInProgress = useRef(false)
  const router = useRouter()
  const isMountedRef = useRef(false)
  const chatInitializedRef = useRef(false)
  const [messageHistory, setMessageHistory] = useState<Message[]>([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileView, setIsMobileView] = useState(false)
  const [chatHistory, setChatHistory] = useState<any[]>([])
  const [activeChat, setActiveChat] = useState<string>("")

  // Function to update chat title on the server
  const updateChatTitleOnServer = async (chatId: string, title: string) => {
    try {
      await fetch('/api/chats/update-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId, title }),
      })
    } catch (error) {
      console.error('Error updating chat title on server:', error)
    }
  }

  // Quick questions suggestions based on profile
  const getSuggestions = useCallback(() => {
    if (!profileData) return defaultSuggestions;
    
    // Generate personalized suggestions based on profile data
    const suggestions = [
      `What are common ${profileData.targetRole || 'interview'} questions I should prepare for?`,
      `How can I highlight my ${profileData.topSkill || 'key skills'} in interviews?`,
      `Give me tips for behavioral questions about ${profileData.challengingTrait || 'leadership'}`,
    ];
    
    if (profileData.targetCompany) {
      suggestions.push(`What should I know about ${profileData.targetCompany} for my interview?`);
    }
    
    if (profileData.experience) {
      suggestions.push(`How do I explain my experience of ${profileData.experience} years effectively?`);
    }
    
    return suggestions;
  }, [profileData]);

  // Set up the chat hook with initial messages and system prompt
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    id: chatId, 
    api: "/api/chat",
    initialMessages: savedMessages.length > 0 ? savedMessages : [
      { id: 'system-1', role: 'system', content: INTERVIEW_COACH_SYSTEM_PROMPT }
    ],
    body: {
      userProfile: profileData,
      searchType,
      query: searchType ? inputValue : null,
      dataSource: searchType ? 'search' : undefined,
      chatId,
      memoryContext,
    },
    onResponse: (response) => {
      setIsSearching(false)
      setTypingIndicator(false)
      
      // Try to extract memory info from response if present
      try {
        const responseObj = JSON.parse(response);
        if (responseObj.memoryContext) {
          // Merge with existing memory context
          const updatedMemoryContext = {
            ...memoryContext,
            ...responseObj.memoryContext,
            userDetails: {
              ...(memoryContext?.userDetails || {}),
              ...(responseObj.memoryContext.userDetails || {})
            }
          };
          
          setMemoryContext(updatedMemoryContext);
          
          // Update localStorage for both chat-specific and global user memory
          localStorage.setItem(`memory-context-${chatId}`, JSON.stringify(updatedMemoryContext));
          
          if (profileData && profileData.name && updatedMemoryContext.userDetails) {
            localStorage.setItem(
              `global-user-memory-${profileData.name.toLowerCase().replace(/\s+/g, "-") || "anonymous"}`,
              JSON.stringify(updatedMemoryContext.userDetails)
            );
          }
            
          setMemoryActive(true);
          
          // Remove memoryContext from response object to prevent it from appearing in the message
          delete responseObj.memoryContext;
          return JSON.stringify(responseObj);
        }
      } catch (e) {
        // Silent fail - not all responses will have context
      }
      
      return response;
    },
    onFinish: () => {
      // Reset search type after a message is sent
      setSearchType(null)
      setSearchMode('chat')
      setIsSearching(false)
      
      // Update chat title if this is the first user message
      if (messages.length === 2 && messages[0].role === 'user' && onUpdateChatTitle) {
        const firstUserMessage = messages[0].content
        const title = firstUserMessage.length > 30 
          ? `${firstUserMessage.substring(0, 30)}...` 
          : firstUserMessage
        onUpdateChatTitle(title)
        
        // Also update the chat title in the server
        updateChatTitleOnServer(chatId, title).catch(console.error)
      }
      
      // Update memory with new interaction
      if (messages.length >= 2) {
        const lastUserMsg = messages.findLast(m => m.role === 'user');
        const lastAiMsg = messages.findLast(m => m.role === 'assistant');
        
        if (lastUserMsg && lastAiMsg) {
          updateMemoryWithLatestMessage(lastUserMsg.content, lastAiMsg.content);
        }
      }
    }
  })

  // Optimize profile loading - memoize to prevent unnecessary re-renders
  const loadProfileData = useCallback(async () => {
    try {
      const storedProfile = localStorage.getItem('userProfile');
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile);
        setProfileData(parsedProfile);
      } else {
        router.push('/onboarding');
        return;
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      router.push('/onboarding');
    }
  }, [router]);

  // Load profile data and prepare to fetch messages - optimized
  useEffect(() => {
    setIsInitialFetch(true);
    setIsLoadingHistory(true);
    chatInitializedRef.current = false;
    
    // Load profile data
    loadProfileData();
    
    // Initialize
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, [chatId, loadProfileData]);
  
  // Fetch messages from backend/Pinecone for this specific chat
  useEffect(() => {
    if (!chatId) return;
    
    // Reset the chat initialized ref when chatId changes
    chatInitializedRef.current = false;
    
    const fetchMessagesFromServer = async () => {
      try {
        setIsLoadingHistory(true);
        
        console.log(`Fetching messages for chat ${chatId}...`);
        
        // First try to load from localStorage as a fallback
        const localMessages = localStorage.getItem(`chat_messages_${chatId}`);
        let loadedMessages = [];
        
        if (localMessages) {
          console.log(`Found messages in localStorage for chat ${chatId}`);
          try {
            loadedMessages = JSON.parse(localMessages);
            
            // Ensure the system prompt is included
            if (!loadedMessages.some((msg: Message) => msg.role === 'system')) {
              loadedMessages.unshift({ 
                id: 'system-1', 
                role: 'system', 
                content: INTERVIEW_COACH_SYSTEM_PROMPT 
              });
            }
            
            // Always set messages from localStorage first for immediate display
            setSavedMessages(loadedMessages);
            setMessages(loadedMessages);
            setMessageHistory(loadedMessages);
          } catch (error) {
            console.error('Error parsing local messages:', error);
            // If parsing fails, initialize with system prompt
            const initialMessages = [{ 
              id: 'system-1', 
              role: 'system', 
              content: INTERVIEW_COACH_SYSTEM_PROMPT 
            }];
            setSavedMessages(initialMessages);
            setMessages(initialMessages);
          }
        }
        
        // If it's a new chat, initialize with the system prompt
        if (chatId.startsWith('new-') || !process.env.NEXT_PUBLIC_USE_PINECONE) {
          console.log('New chat or Pinecone disabled, initializing with system prompt');
          if (!localMessages) {
            const initialMessages: Message[] = [{ 
              id: 'system-1', 
              role: "system" as "system", 
              content: INTERVIEW_COACH_SYSTEM_PROMPT 
            }];
            setSavedMessages(initialMessages as Message[]);
            setMessages(initialMessages as Message[]);
          }
          setIsLoadingHistory(false);
          setShowSuggestions(true);
          return;
        }
        
        // Then try to fetch from server (Pinecone) if available
        try {
          const response = await fetch(`/api/messages?chatId=${chatId}`, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache'
            }
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch messages from server');
          }
          
          const data = await response.json();
          if (data.messages && data.messages.length > 0) {
            console.log(`Loaded ${data.messages.length} messages from server`);
            
            // Ensure the system prompt is included
            let serverMessages = data.messages;
            if (!serverMessages.some((msg: Message) => msg.role === 'system')) {
              serverMessages.unshift({ 
                id: 'system-1', 
                role: 'system', 
                content: INTERVIEW_COACH_SYSTEM_PROMPT 
              });
            }
            
            setSavedMessages(serverMessages);
            setMessages(serverMessages);
            setMessageHistory(serverMessages);
            
            // Save the fresh server messages to localStorage
            localStorage.setItem(`chat_messages_${chatId}`, JSON.stringify(serverMessages));
          } else if (loadedMessages.length === 0) {
            // If we didn't get messages from server and don't have local ones
            // Initialize with system prompt
            const initialMessages = [{ 
              id: 'system-1', 
              role: 'system', 
              content: INTERVIEW_COACH_SYSTEM_PROMPT 
            }];
            setSavedMessages(initialMessages as Message[]);
            setMessages(initialMessages as Message[]);
          }
        } catch (error) {
          console.error('Error fetching chat history from server:', error);
          // If server fetch fails and we don't have local messages yet
          if (loadedMessages.length === 0) {
            const initialMessages = [{ 
              id: 'system-1', 
              role: 'system', 
              content: INTERVIEW_COACH_SYSTEM_PROMPT 
            }];
            setSavedMessages(initialMessages as Message[]);
            setMessages(initialMessages as Message[]);
          }
        }
      } catch (error) {
        console.error('Error in fetchMessagesFromServer:', error);
        toast({
          title: "Couldn't load chat history",
          description: "Starting with an empty chat.",
          variant: "destructive",
        });
        
        // Always initialize with system prompt on error
        const initialMessages = [{ 
          id: 'system-1', 
          role: 'system', 
          content: INTERVIEW_COACH_SYSTEM_PROMPT 
        }];
        setSavedMessages(initialMessages);
        setMessages(initialMessages);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    // Delay fetch slightly to ensure all state is properly updated
    const fetchTimeout = setTimeout(() => {
      fetchMessagesFromServer();
    }, 100);
    
    return () => clearTimeout(fetchTimeout);
  }, [chatId, setMessages, INTERVIEW_COACH_SYSTEM_PROMPT]);

  // Improved message sync effect to avoid race conditions
  useEffect(() => {
    // Only save after we've loaded initial history and have new messages
    if (isLoadingHistory || !chatId) return;
    
    // Save to localStorage whenever messages change
    if (messages.length > 0) {
      console.log(`Saving ${messages.length} messages to localStorage for chat ${chatId}`);
      localStorage.setItem(`chat_messages_${chatId}`, JSON.stringify(messages));
    }
    
    // Create a new chat record when we have the first user message
    if (messages.length > 1 && messages.some(msg => msg.role === 'user')) {
      const userMessages = messages.filter(msg => msg.role === 'user');
      if (userMessages.length === 1) {
        const createNewChat = async () => {
          try {
            await fetch('/api/chats/create', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                chatId,
                title: userMessages[0].content.length > 30 
                  ? `${userMessages[0].content.substring(0, 30)}...` 
                  : userMessages[0].content,
                firstMessage: userMessages[0].content,
                timestamp: new Date().toISOString()
              }),
            });
          } catch (error) {
            console.error('Error creating new chat in server:', error);
          }
        };
        
        createNewChat();
      }
    }
    
    // Save to server (Pinecone) if enabled
    if (messages.length > 0 && process.env.NEXT_PUBLIC_USE_PINECONE) {
      const saveMessagesToServer = async () => {
        try {
          await fetch('/api/messages/save', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chatId,
              messages,
              memoryContext,
            }),
          });
        } catch (error) {
          console.error('Error saving messages to server:', error);
        }
      };
      
      // Only attempt to save to server if we're not in the initial loading phase
      if (!isLoadingHistory) {
        saveMessagesToServer();
      }
    }
  }, [messages, chatId, isLoadingHistory, memoryContext]);

  // Effect to populate messages from savedMessages
  useEffect(() => {
    if (savedMessages.length > 0 && messages.length === 0 && !isInitialFetch) {
      setMessages(savedMessages);
    }
  }, [savedMessages, messages.length, setMessages, isInitialFetch]);
  
  // Once we load messages, reset initialFetch flag
  useEffect(() => {
    if (!isLoadingHistory && isInitialFetch) {
      setIsInitialFetch(false);
    }
  }, [isLoadingHistory, isInitialFetch]);

  // Function to validate if a question is interview-related
  const isInterviewRelatedQuestion = useCallback((question: string): boolean => {
    // Skip validation for search modes
    if (searchMode !== 'chat') return true;
    
    // Always allow short questions - they might be follow-ups
    if (question.length < 15) return true;
    
    // Simple check if any of the keywords are in the question
    const lowerQuestion = question.toLowerCase();
    return interviewKeywords.some(keyword => lowerQuestion.includes(keyword));
  }, [searchMode]);

  // Handler for search type changes
  const handleSearch = useCallback((type: 'web' | 'news') => {
    if (searchMode === type) {
      // Toggle off if already selected
      setSearchMode('chat');
      setSearchType(null);
    } else {
      // Switch to this search mode
      setSearchMode(type);
      setSearchType(type);
    }
    
    // Focus the input element after selecting a search type
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  }, [searchMode]);

  // Enhanced handler for new chat - preserve memory context
  const handleNewChat = useCallback(() => {
    // Always save current chat state before creating a new one
    if (messages.length > 0 && chatId) {
      localStorage.setItem(`chat_messages_${chatId}`, JSON.stringify(messages));
    }
    
    const newChatId = `new-${uuidv4()}`;
    
    // Clear any existing messages and set flags
    localStorage.removeItem(`chat_messages_${newChatId}`);
    sessionStorage.setItem('forceNewChat', 'true');
    sessionStorage.setItem('extractTitleFromFirstMessage', 'true');
    
    // Preserve memory context but clear chat-specific memories
    if (memoryContext) {
      const newMemoryContext = {
        ...memoryContext,
        conversationTopic: undefined,
        memories: [],
        lastInteraction: new Date().toISOString()
      };
      
      localStorage.setItem(`memory-context-${newChatId}`, JSON.stringify(newMemoryContext));
    }
    
    // Directly update local state
    setSavedMessages([]);
    setMessages([]);
    setShowSuggestions(true);
    setInputValue('');
    
    // Navigate to new chat
    router.push(`/dashboard?chatId=${newChatId}&fresh=true`);
  }, [messages, chatId, memoryContext, router, setMessages]);

  // Enhanced chat message handler
  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || isLoading || isSearching || apiCallInProgress.current) return;
    
    // Set API call in progress
    apiCallInProgress.current = true;
    
    // Check if this is the first message and we should extract a title
    const shouldExtractTitle = sessionStorage.getItem('extractTitleFromFirstMessage') === 'true';
    
    // For chat mode, validate that the question is interview-related
    if (searchMode === 'chat' && !isInterviewRelatedQuestion(inputValue)) {
      toast({
        title: "Interview Coach Focus",
        description: "I'm your Interview Coach! Please ask me about job interviews, career advice, or professional development.",
        variant: "default",
      });
      
      // Add a system message that redirects
      setMessages((prev: Message[]) => [
        ...prev,
        { 
          id: `user-${Date.now()}`, 
          role: 'user', 
          content: inputValue 
        },
        { 
          id: `system-redirect-${Date.now()}`, 
          role: 'assistant', 
          content: "I'm your Interview Coach, so I'm here to help specifically with interview preparation and career questions. Please ask me something related to job interviews, career development, or professional skills." 
        }
      ]);
      
      // Reset input and API call flag
      setInputValue("");
      apiCallInProgress.current = false;
      return;
    }
    
    // Set isSearching when performing a search
    if (searchMode !== 'chat') {
      setIsSearching(true);
    }
    
    // Show typing indicator
    setTypingIndicator(true);
    
    // Ensure system prompt is present
    if (messages.length === 0 || !messages.some(msg => msg.role === 'system')) {
      setMessages(prev => [
        { id: 'system-1', role: 'system', content: INTERVIEW_COACH_SYSTEM_PROMPT },
        ...prev.filter(msg => msg.role !== 'system')
      ]);
    }
    
    // If this is the first message and the flag is set, update the chat title
    if (shouldExtractTitle && messages.length <= 1 && onUpdateChatTitle) {
      // Extract title from first message
      const title = inputValue.length > 40 
        ? `${inputValue.substring(0, 40)}...` 
        : inputValue;
      
      // Update chat title
      onUpdateChatTitle(title);
      
      // Clear the flag
      sessionStorage.removeItem('extractTitleFromFirstMessage');
      
      // Also update the title in server
      updateChatTitleOnServer(chatId, title).catch(console.error);
    }
    
    // Use the submit method from useChat with the form event
    const formEvent = {
      preventDefault: () => {},
      currentTarget: document.createElement('form')
    } as unknown as React.FormEvent<HTMLFormElement>;
    
    handleSubmit(formEvent);
    setShowSuggestions(false);
    
    // Reset API call in progress after a short delay
    setTimeout(() => {
      apiCallInProgress.current = false;
    }, 300);
    
    // Focus back on input after submission
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  }, [
    inputValue, 
    isLoading, 
    isSearching, 
    searchMode, 
    messages, 
    chatId, 
    onUpdateChatTitle, 
    handleSubmit, 
    isInterviewRelatedQuestion,
    updateChatTitleOnServer,
    setMessages
  ]);

  // Handle suggestion clicks
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setInputValue(suggestion);
    
    // Schedule to send the message after state update
    setTimeout(() => {
      // Always allow suggestions since they're pre-defined interview questions
      handleInputChange({ target: { value: suggestion } } as React.ChangeEvent<HTMLInputElement>);
      
      // Use the submit method with the form event
      const formEvent = {
        preventDefault: () => {},
        currentTarget: document.createElement('form')
      } as unknown as React.FormEvent<HTMLFormElement>;
      
      handleSubmit(formEvent);
      setShowSuggestions(false);
      setTypingIndicator(true);
    }, 100);
  }, [handleInputChange, handleSubmit]);

  // Synchronize input state with local state
  useEffect(() => {
    setInputValue(input);
  }, [input]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load chat history
  useEffect(() => {
    const loadChatHistory = () => {
      try {
        // Try to get chat history from localStorage
        const storedHistory = localStorage.getItem('chatHistory');
        
        if (storedHistory) {
          try {
            const parsedHistory = JSON.parse(storedHistory);
            // Don't update state if the data is the same
            const currentHistoryStr = JSON.stringify(chatHistory);
            const newHistoryStr = JSON.stringify(parsedHistory);
            
            if (currentHistoryStr !== newHistoryStr) {
              setChatHistory(parsedHistory);
            }
          } catch (e) {
            console.error("Error parsing chat history:", e);
          }
        }
      } catch (error) {
        console.error("Error loading chat history:", error);
      }
    };
    
    loadChatHistory();
    
    // Only add event listener for storage changes, not focus
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chatHistory') {
        loadChatHistory();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []); // Remove chatHistory dependency to prevent infinite loop

  // Update chat title when first user message is sent
  useEffect(() => {
    if (onUpdateChatTitle && messages.length === 2 && messages[0].role === 'user') {
      const firstUserMessage = messages[0].content;
      const title = firstUserMessage.length > 30 
        ? `${firstUserMessage.substring(0, 30)}...` 
        : firstUserMessage;
      
      // Check if current chat has different title
      const existingChat = chatHistory.find(chat => chat.id === chatId);
      if (!existingChat || existingChat.title !== title) {
        onUpdateChatTitle(title);
      }
    }
  }, [messages, chatId, chatHistory, onUpdateChatTitle]);

  // Fresh chat handling
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isFresh = urlParams.get('fresh') === 'true';
    
    // Reset messages if a fresh start is requested
    if (isFresh && chatId.startsWith('new-')) {
      setSavedMessages([]);
      setMessages([{ 
        id: 'system-1', 
        role: 'system', 
        content: INTERVIEW_COACH_SYSTEM_PROMPT 
      }]);
      setShowSuggestions(true);
      
      // Clear the flag from sessionStorage
      sessionStorage.removeItem('forceNewChat');
      
      // Clean URL parameter but keep chatId
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('fresh');
      window.history.replaceState({}, '', cleanUrl.toString());
    }
  }, [chatId, setMessages]);

  // Reset input field when chatId changes
  useEffect(() => {
    setInputValue('');
    if (chatId.startsWith('new-') && sessionStorage.getItem('forceNewChat') === 'true') {
      setSavedMessages([]);
      setMessages([{
        id: 'system-1',
        role: 'system',
        content: INTERVIEW_COACH_SYSTEM_PROMPT
      }]);
      setShowSuggestions(true);
      sessionStorage.removeItem('forceNewChat');
    }
  }, [chatId, setMessages]);

  // Always show suggestions for new chats
  useEffect(() => {
    if (chatId.startsWith('new-') || messages.length === 0 || 
        (messages.length === 1 && messages[0].role === 'system')) {
      setShowSuggestions(true);
    }
  }, [chatId, messages]);

  // Save messages on component unmount
  useEffect(() => {
    return () => {
      // Save messages to localStorage when component unmounts
      if (messages.length > 0 && chatId) {
        localStorage.setItem(`chat_messages_${chatId}`, JSON.stringify(messages));
      }
    };
  }, [messages, chatId]);

  // Window event listener for saving before navigation
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Save current chat state to localStorage before navigating away
      if (messages.length > 0 && chatId) {
        localStorage.setItem(`chat_messages_${chatId}`, JSON.stringify(messages));
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload(); // Also save on component unmount
    };
  }, [messages, chatId]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Tour Guide */}
      <TourGuide 
        steps={tourSteps}
        run={runTour}
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
      />

      {/* Chat Header */}
      <ChatHeader 
        profileData={profileData} 
        isMobileView={isMobileView}
        toggleMobileMenu={toggleMobileMenu}
        startTour={startTour}
      />
      
      {/* Messages Area */}
      <ChatMessages 
        messages={messages}
        isLoadingHistory={isLoadingHistory}
        showSuggestions={showSuggestions}
        typingIndicator={typingIndicator}
        chatId={chatId}
        profileData={profileData}
        getSuggestions={getSuggestions}
        handleSuggestionClick={handleSuggestionClick}
        messagesEndRef={messagesEndRef}
      />

      {/* Input Area */}
      <ChatInput 
        inputValue={inputValue}
        setInputValue={setInputValue}
        searchMode={searchMode}
        setSearchMode={setSearchMode}
        searchType={searchType}
        setSearchType={setSearchType}
        isLoading={isLoading}
        isSearching={isSearching}
        handleSearch={handleSearch}
        handleSendMessage={handleSendMessage}
        handleInputChange={handleInputChange}
        inputRef={inputRef}
        handleKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
          }
        }}
        getPlaceholderText={() => {
          switch (searchMode) {
            case 'web':
              return 'Search the web for companies, roles, industry info...';
            case 'news':
              return 'Search for latest news in your industry...';
            default:
              return 'Ask about interview questions, practice answers, or get feedback...';
          }
        }}
      />
    </div>
  );
}
