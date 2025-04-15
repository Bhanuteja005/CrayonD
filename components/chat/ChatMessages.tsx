import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { AnimatePresence, motion } from "framer-motion"
import { Briefcase, HelpCircle, Lightbulb, Loader2, Star } from "lucide-react"
import ReactMarkdown from 'react-markdown'
import { ChatMessagesProps, Message } from "./types"
import { formatMessageContent } from "./utils/formatMessageContent"

export function ChatMessages({
  messages,
  isLoadingHistory,
  showSuggestions,
  typingIndicator,
  chatId,
  profileData,
  getSuggestions,
  handleSuggestionClick,
  messagesEndRef
}: ChatMessagesProps) {
  // Group consecutive messages from the same sender
  const groupedMessages = messages.reduce((acc: any[], message, index) => {
    // Skip system messages when grouping
    if (message.role === "system") {
      return acc;
    }
    
    const prevMessage = messages[index - 1];
    
    if (index === 0 || !prevMessage || prevMessage.role !== message.role) {
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

  // Function to render message content with appropriate animations
  const renderMessageContent = (message: Message) => {
    if (message.role === "user") {
      return <div className="text-white">{message.content}</div>;
    }
    
    // Don't render system messages
    if (message.role === "system") {
      return null;
    }
    
    return (
      <div className="prose prose-sm max-w-none prose-headings:mb-2 prose-headings:mt-1 prose-headings:text-blue-800 prose-p:my-2 prose-ul:my-2 prose-li:my-1">
        <ReactMarkdown
          components={{
            // Make all links open in a new tab
            a: ({ node, ...props }) => (
              <a {...props} target="_blank" rel="noopener noreferrer" />
            ),
          }}
        >
          {formatMessageContent(message.content)}
        </ReactMarkdown>
      </div>
    );
  };

  return (
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
        ) : (messages.length === 0 || (messages.length === 1 && messages[0].role === 'system')) ? (
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
              
              {/* Show suggestions for new/empty chats */}
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
              {groupedMessages.filter(group => group.role !== "system").map((group, groupIndex) => (
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
  );
}
