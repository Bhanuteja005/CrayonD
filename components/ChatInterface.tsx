"use client"

import { SidebarContext } from "@/app/dashboard/page"
import { TourGuide, TourStep } from "@/components/TourGuide"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { useChat } from "ai/react"
import { AnimatePresence, motion } from "framer-motion"
import { Briefcase, Building, Globe, HelpCircle, Lightbulb, Loader2, Menu, Newspaper, Send, Star, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useContext, useEffect, useRef, useState } from "react"
import ReactMarkdown from 'react-markdown'
import { v4 as uuidv4 } from "uuid"

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: Date;
}

interface ChatInterfaceProps {
  chatId: string
  onUpdateChatTitle?: (title: string) => void
}

// Memory context interface
interface MemoryContext {
  sessionId: string;
  conversationTopic?: string;
  keywords?: string[];
  lastInteraction?: string;
  memories?: string[];
  userProfile?: any;
}

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
  
  // Memory-related state
  const [memoryContext, setMemoryContext] = useState<MemoryContext | null>(null)
  const [memoryActive, setMemoryActive] = useState(false)
  
  // Tour state
  const [runTour, setRunTour] = useState(false);
  const [hasCheckedTour, setHasCheckedTour] = useState(false);
  const [tourSteps] = useState<TourStep[]>([
    {
      target: '.chat-input-area',
      title: 'Chat Input',
      content: 'This is where you can type your interview questions and get AI assistance.',
      placement: 'top',
    },
    {
      target: '.web-search-button',
      title: 'Web Search',
      content: 'Click here to search the web for company information and industry trends.',
      placement: 'bottom'
    },
    {
      target: '.news-search-button',
      title: 'Industry News',
      content: 'Click here to search for the latest industry news that might be relevant for your interviews.',
      placement: 'bottom'
    },
    {
      target: '.send-message-button',
      title: 'Send Message',
      content: 'Click this button to send your message or search query.',
      placement: 'left'
    },
    {
      target: '.chat-messages-area',
      title: 'Chat History',
      content: 'Your conversation with the interview coach will appear here.',
      placement: 'bottom'
    }
  ]);
  
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const apiCallInProgress = useRef(false)
  const router = useRouter()
  const isMountedRef = useRef(false)
  const chatInitializedRef = useRef(false)
  const [messageHistory, setMessageHistory] = useState<Message[]>([])
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([])

  // Start the tour
  const startTour = () => {
    setRunTour(true);
  };

  // Handle tour complete
  const handleTourComplete = () => {
    setRunTour(false);
    localStorage.setItem('hasSeenTour', 'true');
  };

  // Handle tour skip
  const handleTourSkip = () => {
    setRunTour(false);
    localStorage.setItem('hasSeenTour', 'true');
  };

  // Improved check if user has seen the tour before - fixed to work with onboarding
  useEffect(() => {
    if (hasCheckedTour) return; // Only run once
    
    const checkTourStatus = () => {
      const hasSeenTour = localStorage.getItem('hasSeenTour');
      const fromOnboarding = sessionStorage.getItem('fromOnboarding');
    
      // If user is coming from onboarding or never seen tour, show it
      if ((!hasSeenTour || fromOnboarding === 'true') && !isLoadingHistory) {
        // Clear the fromOnboarding flag
        if (fromOnboarding) {
          sessionStorage.removeItem('fromOnboarding');
        }
        
        // Small delay to ensure components have rendered
        setTimeout(() => {
          setRunTour(true);
        }, 1500);
      }
      
      setHasCheckedTour(true);
    };
    
    // Only check tour status once everything is loaded
    if (!isLoadingHistory && profileData) {
      checkTourStatus();
    }
  }, [isLoadingHistory, profileData, hasCheckedTour]);

  // Initialize session ID for memory persistence
  useEffect(() => {
    const generateSessionId = () => {
      // Create unique session ID based on user and chat
      if (profileData) {
        // Use combination of profile name and chat ID for persistence
        const sessionId = `user-${profileData.name?.toLowerCase().replace(/\s+/g, "-") || "anonymous"}-${chatId}`;
        
        setMemoryContext(prev => ({
          ...prev,
          sessionId,
          userProfile: profileData,
        }));
        
        // Load any existing memory context from localStorage
        const storedMemory = localStorage.getItem(`memory-context-${chatId}`);
        if (storedMemory) {
          try {
            const parsedMemory = JSON.parse(storedMemory);
            setMemoryContext(prev => ({
              ...prev,
              ...parsedMemory,
              sessionId, // Always ensure the session ID is correct
              userProfile: profileData,
            }));
            setMemoryActive(true);
          } catch (e) {
            console.error("Error parsing memory context:", e);
          }
        }
      }
    };
    
    if (profileData && chatId) {
      generateSessionId();
    }
  }, [profileData, chatId]);

  // Quick questions suggestions based on profile
  const getSuggestions = () => {
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
  };
  
  const defaultSuggestions = [
    "What are the most common technical interview questions for my role?",
    "Help me prepare a STAR format answer for leadership challenges",
    "What should I ask the interviewer at the end?", 
    "Tips for handling salary negotiation questions"
  ];

  // Enhanced function to extract keywords from user messages
  const extractKeywords = (text: string): string[] => {
    // Skip extraction if text is too short
    if (!text || text.length < 10) return [];
    
    // Common words to filter out
    const commonWords = ['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 
      'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 
      'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 
      'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 
      'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 
      'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 
      'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 
      'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 
      'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 
      'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 
      'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 
      'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 
      'very', 'can', 'will', 'just', 'don', 'should', 'now'];
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word));
    
    // Count word frequency
    const wordCount: {[key: string]: number} = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    // Get top keywords (up to 5)
    return Object.entries(wordCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
  };

  // Enhance memory when new messages are detected
  const updateMemoryWithLatestMessage = (userMessage: string, aiResponse: string) => {
    if (!memoryContext) return;
    
    const keywords = extractKeywords(userMessage);
    const existingKeywords = memoryContext.keywords || [];
    
    // Combine keywords without duplicates
    const uniqueKeywords = [...new Set([...existingKeywords, ...keywords])].slice(0, 10);
    
    // Update memory context
    const updatedContext: MemoryContext = {
      ...memoryContext,
      lastInteraction: new Date().toISOString(),
      keywords: uniqueKeywords,
    };
    
    // If this is the first message, capture conversation topic
    if (!updatedContext.conversationTopic && userMessage) {
      updatedContext.conversationTopic = userMessage.length > 50 
        ? userMessage.substring(0, 50) + '...' 
        : userMessage;
    }
    
    // Store memories (last few message pairs)
    const newMemory = `USER: ${userMessage}\nAI: ${aiResponse}`;
    const existingMemories = updatedContext.memories || [];
    updatedContext.memories = [newMemory, ...existingMemories].slice(0, 5);
    
    // Save updated context
    setMemoryContext(updatedContext);
    localStorage.setItem(`memory-context-${chatId}`, JSON.stringify(updatedContext));
    setMemoryActive(true);
  };

  // Set up the chat hook with initial messages
  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    id: chatId, 
    api: "/api/chat",
    initialMessages: savedMessages,
    body: {
      userProfile: profileData,
      searchType,
      query: searchType ? inputValue : null,
      dataSource: searchType ? 'search' : undefined,
      chatId,
      memoryContext, // Pass memory context to API
    },
    onResponse: (response) => {
      setIsSearching(false)
      setTypingIndicator(false)
      
      // Try to extract memory info from response if present
      try {
        const responseObj = JSON.parse(response);
        if (responseObj.memoryContext) {
          setMemoryContext(prev => ({
            ...prev,
            ...responseObj.memoryContext
          }));
          
          // Update localStorage
          localStorage.setItem(`memory-context-${chatId}`, 
            JSON.stringify({
              ...memoryContext,
              ...responseObj.memoryContext
            }));
            
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
    if (!chatId) return
    
    // Reset the chat initialized ref when chatId changes
    chatInitializedRef.current = false
    
    const fetchMessagesFromServer = async () => {
      try {
        setIsLoadingHistory(true)
        
        console.log(`Fetching messages for chat ${chatId}...`)
        
        // First try to load from localStorage as a fallback
        const localMessages = localStorage.getItem(`chat_messages_${chatId}`)
        if (localMessages) {
          console.log(`Found ${JSON.parse(localMessages).length} messages in localStorage for chat ${chatId}`)
          const parsedMessages = JSON.parse(localMessages)
          if (parsedMessages.length > 0) {
            setSavedMessages(parsedMessages)
            setMessageHistory(parsedMessages)
            
            // Immediately update useChat's messages to ensure they appear
            setMessages(parsedMessages)
            
            setIsLoadingHistory(false)
            return
          }
        }
        
        // No need to check server if it's a new chat
        if (chatId.startsWith('new-') || !process.env.NEXT_PUBLIC_USE_PINECONE) {
          console.log('New chat or Pinecone disabled, skipping server fetch')
          setSavedMessages([])
          setMessages([]) // Ensure messages are reset for new chats
          setIsLoadingHistory(false)
          setShowSuggestions(true) // Show suggestions for new chats
          return
        }
        
        // Then try to fetch from server (Pinecone) if available
        try {
          const response = await fetch(`/api/messages?chatId=${chatId}`, {
            method: 'GET',
          })
          
          if (!response.ok) {
            throw new Error('Failed to fetch messages from server')
          }
          
          const data = await response.json()
          if (data.messages && data.messages.length > 0) {
            console.log(`Loaded ${data.messages.length} messages from server`)
            setSavedMessages(data.messages)
            setMessages(data.messages) 
          } else {
            setSavedMessages([])
          }
        } catch (error) {
          console.error('Error fetching chat history from server:', error)
          // If server fetch fails, try local storage again
          const localMessages = localStorage.getItem(`chat_messages_${chatId}`)
          if (localMessages) {
            setSavedMessages(JSON.parse(localMessages))
            setMessages(JSON.parse(localMessages))
          } else {
            setSavedMessages([])
          }
        }
      } catch (error) {
        console.error('Error in fetchMessagesFromServer:', error)
        toast({
          title: "Couldn't load chat history",
          description: "Starting with an empty chat.",
          variant: "destructive",
        })
        
        setSavedMessages([])
        setMessages([]) // Reset messages on error
      } finally {
        setIsLoadingHistory(false)
      }
    }
    
    fetchMessagesFromServer()
  }, [chatId, setMessages])

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

  // Synchronize input state with local state
  useEffect(() => {
    setInputValue(input)
  }, [input])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Simplify the messages sync effect to avoid race conditions
  useEffect(() => {
    // Only save after we've loaded initial history and have new messages
    if (isLoadingHistory || !chatId) return;
    
    // Save to localStorage whenever messages change
    if (messages.length > 0) {
      console.log(`Saving ${messages.length} messages to localStorage for chat ${chatId}`)
      localStorage.setItem(`chat_messages_${chatId}`, JSON.stringify(messages));
    }
    
    // Create a new chat record when we have the first user message
    if (messages.length === 1 && messages[0].role === 'user') {
      const createNewChat = async () => {
        try {
          await fetch('/api/chats/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chatId,
              title: messages[0].content.length > 30 
                ? `${messages[0].content.substring(0, 30)}...` 
                : messages[0].content,
              firstMessage: messages[0].content,
              timestamp: new Date().toISOString()
            }),
          });
        } catch (error) {
          console.error('Error creating new chat in server:', error);
        }
      };
      
      createNewChat();
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
              memoryContext, // Include memory context
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
      setMessages(savedMessages)
    }
  }, [savedMessages, messages.length, setMessages, isInitialFetch])
  
  // Once we load messages, reset initialFetch flag
  useEffect(() => {
    if (!isLoadingHistory && isInitialFetch) {
      setIsInitialFetch(false)
    }
  }, [isLoadingHistory, isInitialFetch])

  const handleSearch = (type: 'web' | 'news') => {
    if (searchMode === type) {
      // Toggle off if already selected
      setSearchMode('chat')
      setSearchType(null)
    } else {
      // Switch to this search mode
      setSearchMode(type)
      setSearchType(type)
    }
    
    // Focus the input element after selecting a search type
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 100)
  }

  const handleLocalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    handleInputChange(e) // Also update useChat's input state
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSendMessage = () => {
    if (!inputValue.trim() || isLoading || isSearching || apiCallInProgress.current) return
    
    // Set API call in progress
    apiCallInProgress.current = true
    
    // Set isSearching when performing a search
    if (searchMode !== 'chat') {
      setIsSearching(true)
    }
    
    // Show typing indicator
    setTypingIndicator(true)
    
    // Use the submit method from useChat with the form event
    const formEvent = {
      preventDefault: () => {},
      currentTarget: document.createElement('form')
    } as unknown as React.FormEvent<HTMLFormElement>
    
    handleSubmit(formEvent)
    setShowSuggestions(false)
    
    // Reset API call in progress after a short delay
    setTimeout(() => {
      apiCallInProgress.current = false
    }, 300)
    
    // Focus back on input after submission
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 100)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
    
    // Schedule to send the message after state update
    setTimeout(() => {
      // Create a fake form event
      const formEvent = {
        preventDefault: () => {},
        currentTarget: document.createElement('form')
      } as unknown as React.FormEvent<HTMLFormElement>
      
      handleInputChange({ target: { value: suggestion } } as React.ChangeEvent<HTMLInputElement>)
      handleSubmit(formEvent)
      setShowSuggestions(false)
      setTypingIndicator(true)
    }, 100)
  }

  // Enhanced formatting function for better message display
  const formatMessageContent = (content: string) => {
    // Try to parse JSON content if it looks like JSON
    let parsedContent = content
    
    try {
      // Check if the content is a JSON string
      if (typeof content === 'string' && 
          (content.trim().startsWith('{') && content.trim().endsWith('}'))) {
        const jsonContent = JSON.parse(content)
        if (jsonContent.content) {
          parsedContent = jsonContent.content
        }
      }
    } catch (error) {
      // If parsing fails, use the original content
    }
    
    // Filter out any remaining memory context JSON that might have made it through
    if (parsedContent.includes('{"memoryContext":')) {
      parsedContent = parsedContent.replace(/\n\n\{\"memoryContext\":.+\}$/s, '');
    }
    
    // If content is already in markdown format (from search results), return as is
    if (parsedContent.startsWith('# 🔍') || parsedContent.startsWith('# 🗞️')) {
      return parsedContent
    }
    
    // Format the greeting part
    let formattedContent = parsedContent
    
    // Format any markdown
    formattedContent = formattedContent
      // Extract name from greeting and make it bold with emoji
      .replace(/^(Hello|Hi|Hey)\s+(\w+)!/i, '## 👋 $1 $2!')
      
      // Format sections and add structure
      .replace(/\n\n## /g, '\n\n## ')
      .replace(/\n\n### /g, '\n\n### ')
      
      // Ensure proper markdown formatting
      .replace(/\*\*(.*?)\*\*/g, '**$1**')
      
      // Format lists properly
      .replace(/^\s*\*\s+/gm, '* ')
      
      // Add better paragraph breaks
      .replace(/\n/g, '\n\n')
      
      // Clean up extra line breaks
      .replace(/\n\s*\n\s*\n/g, '\n\n')
    
    return formattedContent
  }

  // Get appropriate placeholder text based on current search mode
  const getPlaceholderText = () => {
    switch (searchMode) {
      case 'web':
        return 'Search the web for companies, roles, industry info...'
      case 'news':
        return 'Search for latest news in your industry...'
      default:
        return 'Ask about interview questions, practice answers, or get feedback...'
    }
  }
  
  // Function to render message content with appropriate animations
  const renderMessageContent = (message: Message) => {
    if (message.role === "user") {
      return <div className="text-white">{message.content}</div>
    }
    
    return (
      <div className="prose prose-sm max-w-none prose-headings:mb-2 prose-headings:mt-1 prose-headings:text-blue-800 prose-p:my-2 prose-ul:my-2 prose-li:my-1">
        <ReactMarkdown>{formatMessageContent(message.content)}</ReactMarkdown>
      </div>
    )
  }
  
  // Group consecutive messages from the same sender
  const groupedMessages = messages.reduce((acc: any[], message, index) => {
    const prevMessage = messages[index - 1];
    
    if (index === 0 || prevMessage.role !== message.role) {
      // Start a new group
      acc.push({
        role: message.role,
        messages: [message]
      });
    } else {
      // Add to existing group
      acc[acc.length - 1].messages.push(message);
    }
    
    return acc;
  }, []);

  // Function to load chat history from localStorage - improve to ensure we get data
  useEffect(() => {
    const loadChatHistory = () => {
      try {
        // Try to get chat history from localStorage
        const storedHistory = localStorage.getItem('chatHistory')
        
        if (storedHistory) {
          try {
            const parsedHistory = JSON.parse(storedHistory)
            // Don't update state if the data is the same
            const currentHistoryStr = JSON.stringify(chatHistory);
            const newHistoryStr = JSON.stringify(parsedHistory);
            
            if (currentHistoryStr !== newHistoryStr) {
              setChatHistory(parsedHistory)
            }
          } catch (e) {
            console.error("Error parsing chat history:", e)
          }
        }
      } catch (error) {
        console.error("Error loading chat history:", error)
      }
    }
    
    loadChatHistory()
    
    // Only add event listener for storage changes, not focus
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chatHistory') {
        loadChatHistory()
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, []) // Remove chatHistory dependency to prevent infinite loop

  // Make sure chat history is updated when the chat title is updated
  // This function was causing an infinite loop - simplified it
  useEffect(() => {
    if (onUpdateChatTitle && messages.length === 2 && messages[0].role === 'user') {
      const firstUserMessage = messages[0].content
      const title = firstUserMessage.length > 30 
        ? `${firstUserMessage.substring(0, 30)}...` 
        : firstUserMessage
      
      // Check if current chat has different title
      const existingChat = chatHistory.find(chat => chat.id === chatId);
      if (!existingChat || existingChat.title !== title) {
        onUpdateChatTitle(title)
      }
    }
  }, [messages]) // Only depend on messages, not chatHistory

  // Handler to select a chat from the sidebar - improved version
  const handleSelectChat = (selectedChatId: string) => {
    if (selectedChatId !== chatId) {
      // Navigate to the selected chat
      router.push(`/dashboard?chatId=${selectedChatId}`)
    }
  }
  
  // Handler to create a new chat - improved version
  const handleNewChat = () => {
    const newChatId = `new-${uuidv4()}`
    
    // Clear any existing messages and set flags
    localStorage.removeItem(`chat_messages_${newChatId}`);
    sessionStorage.setItem('forceNewChat', 'true');
    
    // Directly update local state
    setSavedMessages([]);
    setMessages([]);
    setShowSuggestions(true);
    setInputValue('');
    
    // Navigate to new chat
    router.push(`/dashboard?chatId=${newChatId}&fresh=true`)
  }

  // Ensure we are starting with a fresh chat when requested
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isFresh = urlParams.get('fresh') === 'true';
    
    // Reset messages if a fresh start is requested
    if (isFresh && chatId.startsWith('new-')) {
      setSavedMessages([]);
      setMessages([]);
      setShowSuggestions(true);
      
      // Clear the flag from sessionStorage
      sessionStorage.removeItem('forceNewChat');
      
      // Clean URL parameter but keep chatId
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('fresh');
      window.history.replaceState({}, '', cleanUrl.toString());
    }
  }, [chatId]);
  const [activeChat, setActiveChat] = useState<string>("")

  // Reset input field when chatId changes
  useEffect(() => {
    setInputValue('');
    if (chatId.startsWith('new-') && sessionStorage.getItem('forceNewChat') === 'true') {
      setSavedMessages([]);
      setMessages([]);
      setShowSuggestions(true);
      sessionStorage.removeItem('forceNewChat');
    }
  }, [chatId]);

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Custom Tour Guide */}
      <TourGuide 
        steps={tourSteps}
        run={runTour}
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
      />

      {/* Chat Header with Profile Summary */}
      <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
        <div className="p-4 max-w-3xl mx-auto flex items-center">
          {/* Mobile hamburger menu button - directly toggles menu in parent component */}
          <div className="md:hidden mr-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMobileMenu}>
              <Menu className="h-5 w-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </div>

          <div className="flex-1">
            <h2 className="font-medium text-lg text-slate-800">
              CrayonD AI
            </h2>
          </div>
          
          {/* Help button to start tour */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-slate-500 hover:text-blue-600" 
            onClick={startTour}
          >
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">Start tour</span>
          </Button>
        </div>
         
        {profileData && !isMobileView && (
          <motion.div 
            className="mt-0 mb-2 px-4 max-w-3xl mx-auto flex flex-wrap gap-2"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {profileData.targetRole && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Briefcase className="h-3 w-3 mr-1" />
                {profileData.targetRole}
              </Badge>
            )}
            {profileData.experience && (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <User className="h-3 w-3 mr-1" />
                {profileData.experience} years exp.
              </Badge>
            )}
            {profileData.targetCompany && (
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                <Building className="h-3 w-3 mr-1" />
                Target: {profileData.targetCompany}
              </Badge>
            )}
          </motion.div>
        )}
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent chat-messages-area">
        <div className="max-w-3xl mx-auto space-y-6">
          {isLoadingHistory ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center py-4 flex-col items-center"
            >
              <div className="bg-white rounded-full px-4 py-2 shadow-sm border border-slate-200 flex items-center space-x-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-sm text-slate-600">Loading chat history...</span>
              </div>
              <p className="text-xs text-slate-400">Chat ID: {chatId.substring(0, 8)}...</p>
            </motion.div>
          ) : messages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center py-8"
            >
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <HelpCircle className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-2">Interview Coach</h3>
                <p className="text-slate-600 mb-6">I can help you prepare for interviews with personalized advice and real-time information.</p>
                
                {/* Quick start suggestions */}
                {showSuggestions && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">Try asking about:</p>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {getSuggestions().map((suggestion, index) => (
                        <motion.button
                          key={index}
                          className="text-left p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg text-slate-700 hover:text-blue-700 transition-colors"
                          onClick={() => handleSuggestionClick(suggestion)}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index }}
                          whileHover={{ scale: 1.01 }}
                        >
                          <div className="flex">
                            {index === 0 ? 
                              <Briefcase className="mr-2 h-4 w-4 text-blue-600 flex-shrink-0" /> :
                              index === 1 ? 
                                <Star className="mr-2 h-4 w-4 text-amber-500 flex-shrink-0" /> :
                                index === 2 ? 
                                  <HelpCircle className="mr-2 h-4 w-4 text-purple-500 flex-shrink-0" /> :
                                  <Lightbulb className="mr-2 h-4 w-4 text-emerald-500 flex-shrink-0" />
                            }
                            <span>{suggestion}</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <>
              <AnimatePresence mode="popLayout">
                {groupedMessages.map((group, groupIndex) => (
                  <motion.div
                    key={`group-${groupIndex}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col gap-1"
                  >
                    {group.role === "user" ? (
                      <div className="flex justify-end">
                        <motion.div 
                          className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-[85%] shadow-sm"
                          initial={{ opacity: 0, scale: 0.95, x: 20 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          {group.messages.map((msg: Message, i: number) => (
                            <div key={msg.id} className={i > 0 ? "mt-2 pt-2 border-t border-blue-500" : ""}>
                              {renderMessageContent(msg)}
                            </div>
                          ))}
                        </motion.div>
                      </div>
                    ) : (
                      <div className="flex items-start">
                        <motion.div 
                          className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 mt-1 flex-shrink-0 border border-blue-200"
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.25 }}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="/ai.avif" />
                            <AvatarFallback className="bg-blue-100 text-blue-800">IC</AvatarFallback>
                          </Avatar>
                        </motion.div>
                        <motion.div
                          className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] shadow-sm"
                          initial={{ opacity: 0, scale: 0.95, x: -20 }}
                          animate={{ opacity: 1, scale: 1, x: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          {group.messages.map((msg: Message, i: number) => (
                            <Card key={msg.id} className={i > 0 ? "mt-3 bg-white border-0 shadow-none" : "bg-white border-0 shadow-none"}>
                              <CardContent className="p-0">
                                {renderMessageContent(msg)}
                              </CardContent>
                            </Card>
                          ))}
                          
                          
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Typing indicator */}
              {typingIndicator && (
                <motion.div 
                  className="flex items-start"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-2 flex-shrink-0 border border-blue-200">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/ai.avif" />
                      <AvatarFallback className="bg-blue-100 text-blue-800">IC</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex space-x-1">
                      <motion.div 
                        className="h-2 w-2 bg-blue-400 rounded-full"
                        animate={{ y: [0, -5, 0] }} 
                        transition={{ repeat: Infinity, duration: 0.8, delay: 0 }}
                      />
                      <motion.div 
                        className="h-2 w-2 bg-blue-400 rounded-full"
                        animate={{ y: [0, -5, 0] }} 
                        transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                      />
                      <motion.div 
                        className="h-2 w-2 bg-blue-400 rounded-full"
                        animate={{ y: [0, -5, 0] }} 
                        transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="max-w-3xl mx-auto relative chat-input-area">
          {/* Input wrapper */}
          <div className="relative flex items-center">
            {/* Search indicator with label directly in the input field */}
            {searchMode !== 'chat' && (
              <div className="absolute left-3 flex items-center">
                {searchMode === 'web' ? (
                  <>
                    <Globe className="h-5 w-5 text-blue-500" />
                    <span className="ml-2 text-blue-700 text-sm font-medium">Web:</span>
                  </>
                ) : (
                  <>
                    <Newspaper className="h-5 w-5 text-green-500" />
                    <span className="ml-2 text-green-700 text-sm font-medium">News:</span>
                  </>
                )}
              </div>
            )}
            
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleLocalInputChange}
              onKeyDown={handleKeyDown}
              placeholder={getPlaceholderText()}
              className={cn(
                "pr-12 py-6 rounded-full border-slate-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 transition-all",
                searchMode !== 'chat' ? "pl-20" : "pl-20", // Always provide space for icons
                searchMode === 'web' ? "border-blue-300 focus:border-blue-400" : "",
                searchMode === 'news' ? "border-green-300 focus:border-green-400" : ""
              )}
              disabled={isLoading || isSearching}
            />
            
            {/* Mode selection buttons directly in the input field */}
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex space-x-2">
              {searchMode === 'chat' && (
                <>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setSearchMode('web');
                            setSearchType('web');
                            handleSearch('web');
                          }}
                          className="h-7 w-7 rounded-full hover:bg-blue-50 web-search-button"
                        >
                          <Globe className="h-4 w-4 text-slate-500 hover:text-blue-600" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="center" className="bg-blue-50 border-blue-200 text-blue-700 font-medium">
                        <p>Search the web for company info</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setSearchMode('news');
                            setSearchType('news');
                            handleSearch('news');
                          }}
                          className="h-7 w-7 rounded-full hover:bg-green-50 news-search-button"
                        >
                          <Newspaper className="h-4 w-4 text-slate-500 hover:text-green-600" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" align="center" className="bg-green-50 border-green-200 text-green-700 font-medium">
                        <p>Search industry news</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </>
              )}
            </div>
            
            {/* Cancel search button */}
            {searchMode !== 'chat' && (
              <Button 
                variant="ghost"
                size="icon"
                className="absolute right-14 h-8 w-8 rounded-full hover:bg-slate-100"
                onClick={() => {
                  setSearchMode('chat');
                  setSearchType(null);
                }}
              >
                <span className="sr-only">Cancel search</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </Button>
            )}
            
            {/* Loading indicator or send button */}
            <div className="absolute right-2">
              {isLoading || isSearching ? (
                <div className={cn(
                  "rounded-full p-2 shadow-md",
                  searchMode === 'web' ? "bg-blue-500" :
                  searchMode === 'news' ? "bg-green-500" : "bg-blue-500"
                )}>
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                </div>
              ) : (
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim()}
                  className={cn(
                    "rounded-full text-white shadow-md transition-all send-message-button",
                    !inputValue.trim() ? "opacity-70" : "",
                    searchMode === 'web' ? "bg-blue-500 hover:bg-blue-600" :
                    searchMode === 'news' ? "bg-green-500 hover:bg-green-600" : 
                    "bg-blue-500 hover:bg-blue-600"
                  )}
                >
                  <Send className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Character count and message mode */}
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <div className="flex items-center space-x-3">
              {searchMode === 'chat' && (
                <div className="flex space-x-1 items-center">
                  <span className="text-xs text-slate-500">Chat Mode: Ask interview questions or get feedback</span>
                </div>
              )}
              {searchMode === 'web' && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <Globe className="h-3 w-3 mr-1" />
                  Web Search Mode
                </Badge>
              )}
              {searchMode === 'news' && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <Newspaper className="h-3 w-3 mr-1" />
                  Industry News Mode
                </Badge>
              )}
            </div>
            <div className="flex items-center">
              {inputValue.length > 0 && (
                <span className={inputValue.length > 4000 ? "text-red-500" : ""}>
                  {inputValue.length} / 4000
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}