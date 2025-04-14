"use client"

import { ChatInterface } from "@/components/ChatInterface"
import { DashboardSidebar } from "@/components/DashboardSidebar"
import { useSearchParams } from "next/navigation"
import { createContext, Suspense, useCallback, useEffect, useState } from "react"
import { v4 as uuidv4 } from "uuid"

// Create a context for sidebar state that can be accessed from any component
export const SidebarContext = createContext({
  isMobileMenuOpen: false,
  setIsMobileMenuOpen: (_isOpen: boolean) => {},
  toggleMobileMenu: () => {},
});

// Inner component to handle search params
function DashboardContent() {
  const searchParams = useSearchParams()
  const [activeChat, setActiveChat] = useState<string>("")
  const [chatHistory, setChatHistory] = useState<any[]>([])
  const [profileData, setProfileData] = useState<any>(null)
  const urlChatId = searchParams.get('chatId')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isMobileView, setIsMobileView] = useState(false)
  
  // Toggle function for mobile menu
  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => !prev);
  }, []);
  
  // Detect mobile view
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobileView(window.innerWidth < 768) // 768px is typically md breakpoint
    }
    
    // Initial check
    checkIsMobile()
    
    // Add event listener for resize
    window.addEventListener('resize', checkIsMobile)
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkIsMobile)
    }
  }, [])
  
  // Load user profile
  useEffect(() => {
    const storedProfile = localStorage.getItem('userProfile')
    if (storedProfile) {
      setProfileData(JSON.parse(storedProfile))
    }
  }, [])
  
  // Load chat history from localStorage with better error handling
  useEffect(() => {
    const loadChatHistory = () => {
      try {
        const storedHistory = localStorage.getItem('chatHistory')
        if (storedHistory) {
          try {
            const parsedHistory = JSON.parse(storedHistory)
            
            // Sort by most recent first
            parsedHistory.sort((a: any, b: any) => {
              return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            });
            
            console.log("Dashboard: Loaded chat history", parsedHistory)
            
            // Check if IDs exist for each chat (backward compatibility)
            const cleanedHistory = parsedHistory.filter((chat: any) => chat.id);
            
            // Use functional update to avoid infinite loops
            setChatHistory(prev => {
              if (JSON.stringify(prev) !== JSON.stringify(cleanedHistory)) {
                return cleanedHistory;
              }
              return prev;
            });
          } catch (e) {
            console.error("Error parsing chat history:", e);
            // Initialize an empty array if parsing fails
            setChatHistory([]);
          }
        } else {
          // Check if we need to initialize the history
          if (chatHistory.length === 0) {
            setChatHistory([]);
          }
        }
      } catch (error) {
        console.error("Error loading chat history:", error)
      }
    }
    
    loadChatHistory()
    
    // Listen for storage events and custom events
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chatHistory') {
        loadChatHistory()
      }
    }
    
    const handleCustomEvent = () => loadChatHistory();
    
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('chatHistoryUpdated', handleCustomEvent);
    
    // Check periodically for updates
    const interval = setInterval(loadChatHistory, 5000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('chatHistoryUpdated', handleCustomEvent);
      clearInterval(interval);
    }
  }, [chatHistory.length])
  
  // Set active chat based on URL param or default to the most recent chat
  useEffect(() => {
    if (urlChatId) {
      console.log("Setting active chat from URL:", urlChatId)
      setActiveChat(urlChatId)
    } else if (chatHistory.length > 0) {
      // Select the most recent chat
      console.log("Setting active chat from history:", chatHistory[0].id)
      setActiveChat(chatHistory[0].id)
    } else {
      // Create a new chat if no chat exists
      const newChatId = `new-${uuidv4()}`
      console.log("Creating new chat:", newChatId)
      setActiveChat(newChatId)
      
      // Add to chat history
      const updatedHistory = [
        {
          id: newChatId,
          title: "New Interview Session",
          created_at: new Date().toISOString()
        }
      ]
      setChatHistory(updatedHistory)
      localStorage.setItem('chatHistory', JSON.stringify(updatedHistory))
      
      // Dispatch event to notify about chat history update
      window.dispatchEvent(new Event('chatHistoryUpdated'));
    }
  }, [urlChatId, chatHistory.length])
  
  // Function to handle chat selection
  const handleSelectChat = (chatId: string) => {
    console.log("Selected chat:", chatId)
    setActiveChat(chatId)
    setIsMobileMenuOpen(false) // Close mobile menu when selecting a chat
    
    // Update URL without full page reload
    const url = new URL(window.location.href)
    url.searchParams.set('chatId', chatId)
    window.history.pushState({}, '', url.toString())
  }
  
  // Function to create a new chat
  const handleNewChat = () => {
    const newChatId = `new-${uuidv4()}`
    console.log("Created new chat:", newChatId)
    
    // Clear any existing messages for this new chat ID
    localStorage.removeItem(`chat_messages_${newChatId}`);
    
    // Add to chat history
    const updatedHistory = [
      {
        id: newChatId,
        title: "New Interview Session",
        created_at: new Date().toISOString()
      },
      ...chatHistory
    ]
    setChatHistory(updatedHistory)
    localStorage.setItem('chatHistory', JSON.stringify(updatedHistory))
    
    // Set flags to force fresh state
    sessionStorage.setItem('forceNewChat', 'true');
    
    setActiveChat(newChatId)
    
    // Update URL without full page reload
    const url = new URL(window.location.href)
    url.searchParams.set('chatId', newChatId)
    url.searchParams.set('fresh', 'true')
    window.history.pushState({}, '', url.toString())
    
    // Dispatch event for chat selection
    const event = new CustomEvent('chatSelected', { detail: { chatId: newChatId, isNew: true } });
    window.dispatchEvent(event);
    
    // Close mobile menu
    setIsMobileMenuOpen(false)
  }
  
  // Function to update chat title with localStorage sync
  const handleUpdateChatTitle = useCallback((title: string) => {
    console.log("Updating chat title:", title, "for chat:", activeChat)
    
    setChatHistory(prevHistory => {
      // Find if chat exists
      const existingChatIndex = prevHistory.findIndex(chat => chat.id === activeChat);
      
      // Create new history array to avoid mutations
      let updatedHistory = [...prevHistory];
      
      if (existingChatIndex !== -1) {
        // Update existing chat
        if (updatedHistory[existingChatIndex].title === title) {
          // No change needed
          return prevHistory;
        }
        
        updatedHistory[existingChatIndex] = {
          ...updatedHistory[existingChatIndex],
          title
        };
      } else {
        // If this is a new chat, add it to the history
        updatedHistory.unshift({
          id: activeChat,
          title,
          created_at: new Date().toISOString()
        });
      }
      
      // Save to localStorage
      localStorage.setItem('chatHistory', JSON.stringify(updatedHistory));
      
      // Trigger custom event for other components
      window.dispatchEvent(new CustomEvent('chatHistoryUpdated'));
      
      return updatedHistory;
    });
  }, [activeChat]);

  // Create a sidebar context value
  const sidebarContextValue = {
    isMobileMenuOpen,
    setIsMobileMenuOpen,
    toggleMobileMenu
  };

  return (
    <SidebarContext.Provider value={sidebarContextValue}>
      <div className="flex h-screen bg-slate-50 relative">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block w-80 flex-shrink-0">
          <DashboardSidebar 
            chatHistory={chatHistory}
            activeChat={activeChat}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
            profileData={profileData}
          />
        </div>
        
        {/* Mobile Sidebar - slides in from left when open */}
        <div className={`fixed inset-y-0 left-0 z-50 w-[280px] transform bg-white shadow-xl transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:hidden`}>
          <DashboardSidebar 
            chatHistory={chatHistory}
            activeChat={activeChat}
            onSelectChat={handleSelectChat}
            onNewChat={handleNewChat}
            profileData={profileData}
            onCloseMobile={() => setIsMobileMenuOpen(false)}
          />
        </div>
        
        {/* Backdrop when sidebar is open on mobile */}
        {isMobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        
        {/* Chat Interface */}
        <div className="flex-grow overflow-hidden">
          {activeChat && (
            <ChatInterface 
              key={activeChat} // Keep the key prop to force re-render when chat changes
              chatId={activeChat} 
              onUpdateChatTitle={handleUpdateChatTitle}
            />
          )}
        </div>
      </div>
    </SidebarContext.Provider>
  )
}

// Wrap the content in a suspense boundary
export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardContent />
    </Suspense>
  )
}

// Simple loading component
function DashboardLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
        <p className="text-sm text-slate-500">Loading interview coach...</p>
      </div>
    </div>
  )
}
