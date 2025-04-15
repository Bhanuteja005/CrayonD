import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { Globe, Loader2, Newspaper, Send } from "lucide-react"
import { ChatInputProps } from "./types"

export function ChatInput({
  inputValue,
  setInputValue,
  searchMode,
  setSearchMode,
  searchType,
  setSearchType,
  isLoading,
  isSearching,
  handleSearch,
  handleSendMessage,
  handleInputChange,
  inputRef
}: ChatInputProps) {
  
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleLocalInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
    handleInputChange(e) // Also update useChat's input state
  }

  return (
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
  );
}
