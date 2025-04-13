"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useChat } from "ai/react"
import { BrainCircuit, Globe, Loader2, Newspaper, Send } from "lucide-react"
import type React from "react"
import { useEffect, useRef, useState } from "react"
import ReactMarkdown from 'react-markdown'

export default function InterviewCoach() {
  const [userProfile, setUserProfile] = useState<{
    name: string
    targetRole: string
    experience: string
    skills: string[]
  }>({
    name: "",
    targetRole: "",
    experience: "",
    skills: [],
  })

  const [profileComplete, setProfileComplete] = useState(false)
  const [showProfileDialog, setShowProfileDialog] = useState(true)
  const [searchType, setSearchType] = useState<'web' | 'news' | null>(null)
  const [searchMode, setSearchMode] = useState<'chat' | 'web' | 'news'>('chat')
  const [isSearching, setIsSearching] = useState(false)
  
  // Direct input state management instead of relying on useChat for UI
    const [localInputValue, setLocalInputValue] = useState("")

  // Create reference for tracking API calls to prevent duplicates
  const apiCallInProgress = useRef(false);

  // Modified to directly use the useChat hook as intended
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    body: {
      userProfile: profileComplete ? userProfile : null,
      searchType,
      dataSource: searchType ? 'search' : undefined,
    },
    onFinish: () => {
      // Reset search type after a message is sent
      setSearchType(null);
      setSearchMode('chat');
      setIsSearching(false);
    },
    onResponse: () => {
      setIsSearching(false);
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [messages])

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setProfileComplete(true)
    setShowProfileDialog(false)
  }

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const skillsArray = e.target.value.split(",").map((skill) => skill.trim())
    setUserProfile({ ...userProfile, skills: skillsArray })
  }

  const handleSearch = (type: 'web' | 'news') => {
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
  }

  const handleLocalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Completely rewritten message submission to use the useChat hook properly
  const handleSendMessage = () => {
    if (!input.trim() || isLoading || isSearching) return;
    
    // Set isSearching when performing a search
    if (searchMode !== 'chat') {
      setIsSearching(true);
    }
    
    // Use the submit method from useChat with the form event
    const formEvent = {
      preventDefault: () => {},
      currentTarget: document.createElement('form')
    } as unknown as React.FormEvent<HTMLFormElement>;
    
    handleSubmit(formEvent);
    
    // Focus back on input after submission
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);
  };

  // Enhanced formatting function to handle JSON responses
  const formatMessageContent = (content: string) => {
    // Try to parse JSON content if it looks like JSON
    let parsedContent = content;
    
    try {
      // Check if the content is a JSON string
      if (typeof content === 'string' && 
          (content.trim().startsWith('{') && content.trim().endsWith('}'))) {
        const jsonContent = JSON.parse(content);
        if (jsonContent.content) {
          parsedContent = jsonContent.content;
        }
      }
    } catch (error) {
      // If parsing fails, use the original content
      console.error("Error parsing JSON content:", error);
    }
    
    // If content is already in markdown format (from search results), return as is
    if (parsedContent.startsWith('# 🔍') || parsedContent.startsWith('# 🗞️')) {
      return parsedContent;
    }
    
    // Format the greeting part
    let formattedContent = parsedContent;
    
    // Rest of formatting logic remains the same
    // Extract name from greeting and make it bold with emoji
    formattedContent = formattedContent.replace(
      /^(Hello|Hi|Hey)\s+(\w+)!/i, 
      '## 👋 $1 $2!'
    );

    // Format sections and add structure
    formattedContent = formattedContent
      // Add better paragraph breaks
      .replace(/\n/g, '\n\n')
      
      // Format emphasis/key points
      .replace(/(Given your \d+ years of experience[^\.]+\.)/g, '**$1**')
      
      // Add section heading for interview questions mention
      .replace(/(common interview questions)/gi, '### 📝 $1')
      
      // Format technical terms with emphasis
      .replace(/\b(machine learning|LLMs|software engineering|technical|behavioral)\b/gi, '**$1**')
      
      // Format action questions with emphasis
      .replace(/\b(What would you like to work on first\?|Perhaps we could begin with[^?]+\?)/g, '\n\n### 🤔 $1\n\n')
      
      // Clean up extra line breaks
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      
      // Add dividers before major sections
      .replace(/\n### /g, '\n\n---\n\n### ');
    
    return formattedContent;
  };

  // Get appropriate placeholder text based on current search mode
  const getPlaceholderText = () => {
    switch (searchMode) {
      case 'web':
        return 'Search the web for companies, roles, industry info...';
      case 'news':
        return 'Search for latest news in your industry...';
      default:
        return 'Ask about interview questions, practice answers, or get feedback...';
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-5xl">
      <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold text-center text-blue-800">Interview Preparation Coach</CardTitle>
          <p className="text-center text-gray-600">
            Your AI-powered interview coach with memory to help you prepare for your next job interview
          </p>
        </CardHeader>
      </Card>

      {/* Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Complete Your Profile</DialogTitle>
            <DialogDescription>
              Tell us a bit about yourself so we can tailor the interview coaching to your needs.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                value={userProfile.name}
                onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetRole">Target Role</Label>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                <Input
                  id="targetRole"
                  value={userProfile.targetRole}
                  onChange={(e) => setUserProfile({ ...userProfile, targetRole: e.target.value })}
                  placeholder="Software Engineer"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">Years of Experience</Label>
              <div className="flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-blue-500" />
                <Input
                  id="experience"
                  value={userProfile.experience}
                  onChange={(e) => setUserProfile({ ...userProfile, experience: e.target.value })}
                  placeholder="3"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="skills">Key Skills (comma separated)</Label>
              <Input id="skills" onChange={handleSkillsChange} placeholder="React, Node.js, TypeScript" required />
            </div>

            <DialogFooter>
              <Button type="submit" className="w-full">Start Interview Coaching</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Search Mode Indicator */}
      {searchMode !== 'chat' && (
        <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center">
            {searchMode === 'web' ? (
              <>
                <Globe className="h-5 w-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-800">Web Search Mode</span>
              </>
            ) : (
              <>
                <Newspaper className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-green-800">Industry News Mode</span>
              </>
            )}
            <span className="ml-2 text-sm text-slate-500">
              Enter your search query below
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setSearchMode('chat');
              setSearchType(null);
            }}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Chat Interface */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <ScrollArea className="h-[70vh] pr-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
                <BrainCircuit size={48} className="mb-2 text-blue-500" />
                <p>Your interview coach is ready to help you prepare.</p>
                <p className="text-sm">
                  Ask questions about interview preparation, practice answers, or request feedback.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-4 flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className="flex items-start max-w-[80%]">
                    {message.role !== "user" && (
                      <Avatar className="mr-2 mt-0.5">
                        <AvatarFallback className="bg-blue-600 text-white">IC</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`p-4 rounded-lg ${
                        message.role === "user"
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-gray-100 text-gray-800 rounded-bl-none shadow-md"
                      }`}
                    >
                      {message.role === "user" ? (
                        message.content
                      ) : (
                        <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:mb-3 prose-headings:mt-2 prose-headings:text-blue-800 prose-p:my-2 prose-ul:my-2 prose-li:my-1">
                          <ReactMarkdown>
                            {formatMessageContent(message.content)}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                    {message.role === "user" && (
                      <Avatar className="ml-2 mt-0.5">
                        <AvatarFallback className="bg-green-600 text-white">
                          {userProfile.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              ))
            )}
            {(isLoading || isSearching) && (
              <div className="flex justify-center py-4">
                <div className="bg-white rounded-full px-4 py-2 shadow-sm border border-slate-200 flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span className="text-sm text-slate-600">
                    {isSearching ? (searchType === 'web' ? "Searching the web..." : "Searching industry news...") : "Thinking..."}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>
        </CardContent>
      </Card>

      <div className="flex items-center space-x-2">
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholderText()}
            className={`pr-20 ${
              searchMode === 'web' 
                ? 'border-blue-300 focus:border-blue-500 focus:ring-blue-500' 
                : searchMode === 'news'
                  ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                  : ''
            }`}
            disabled={isLoading || isSearching || !profileComplete}
            type="text"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-2">
            <Button 
              type="button" 
              variant="ghost" 
              size="icon" 
              onClick={() => handleSearch('web')}
              className={searchMode === 'web' ? 'bg-blue-100' : ''}
              title="Search the web"
              disabled={isLoading || isSearching}
            >
              <Globe className={`h-4 w-4 ${searchMode === 'web' ? 'text-blue-700' : 'text-blue-500'}`} />
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              size="icon"
              onClick={() => handleSearch('news')}
              className={searchMode === 'news' ? 'bg-green-100' : ''}
              title="Search for news"
              disabled={isLoading || isSearching}
            >
              <Newspaper className={`h-4 w-4 ${searchMode === 'news' ? 'text-green-700' : 'text-green-500'}`} />
            </Button>
          </div>
        </div>
        <Button 
          type="button" 
          onClick={handleSendMessage}
          disabled={isLoading || isSearching || !input.trim() || !profileComplete}
          className={searchMode === 'web' ? 'bg-blue-600 hover:bg-blue-700' : 
                    searchMode === 'news' ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          {isLoading || isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      
      {/* Helper text */}
      <p className="text-xs text-slate-500 mt-2 text-center">
        {searchMode === 'chat' 
          ? "Your chat history is saved to help personalize your coaching experience." 
          : searchMode === 'web'
            ? "Search for companies, roles, or interview techniques to get more information."
            : "Find the latest industry news to demonstrate awareness in your interviews."}
      </p>
    </div>
  )
}
