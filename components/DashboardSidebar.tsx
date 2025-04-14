"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
// Remove Sheet imports as they're no longer needed
import { SidebarContext } from "@/app/dashboard/page"
import { toast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { LogOut, MessageSquarePlus, Search, Settings, Trash2, User, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useContext, useState } from "react"

interface ChatSession {
  id: string
  title: string
  created_at: string
}

interface DashboardSidebarProps {
  chatHistory: ChatSession[]
  activeChat: string | null
  onSelectChat: (chatId: string) => void
  onNewChat: () => void
  profileData?: any
  onCloseMobile?: () => void
}

// Simplified DashboardSidebar component - no need for separate SidebarContent
export function DashboardSidebar({
  chatHistory,
  activeChat,
  onSelectChat,
  onNewChat,
  profileData,
  onCloseMobile,
}: DashboardSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [chatToDelete, setChatToDelete] = useState<string | null>(null)
  const router = useRouter();
  const { setIsMobileMenuOpen } = useContext(SidebarContext);

  const filteredChats = chatHistory.filter((chat) => chat.title.toLowerCase().includes(searchQuery.toLowerCase()))

  const handleDeleteChat = async () => {
    if (!chatToDelete) return

    try {
      // Update stored chat history in localStorage
      const updatedHistory = chatHistory.filter((chat) => chat.id !== chatToDelete)
      localStorage.setItem('chatHistory', JSON.stringify(updatedHistory))
      
      // Also delete the chat messages from localStorage
      localStorage.removeItem(`chat_messages_${chatToDelete}`);

      // If the deleted chat was active, select another chat or null
      if (activeChat === chatToDelete) {
        if (updatedHistory.length > 0) {
          onSelectChat(updatedHistory[0].id)
        } else {
          onSelectChat("")
        }
      }

      // Reset state
      setChatToDelete(null)

      // Refresh the page to update the chat history
      window.location.reload()
    } catch (error) {
      console.error("Error deleting chat:", error)
      toast({
        title: "Delete failed",
        description: "There was an error deleting the chat session.",
        variant: "destructive",
      })
    }
  }

  const handleLogout = () => {
    // Redirect to home page
    router.push('/');
  }

  // Enhanced new chat handler
  const handleCreateNewChat = () => {
    // Clear any local storage for temporary messages
    localStorage.removeItem('tempChatMessages');
    
    // Set a flag to ensure completely fresh chat
    sessionStorage.setItem('forceNewChat', 'true');
    
    // Trigger the new chat creation in the parent component
    onNewChat();
    
    // Close mobile sidebar if function provided
    if (onCloseMobile) {
      onCloseMobile();
    } else {
      setIsMobileMenuOpen(false);
    }
  };

  const handleChatSelect = (chatId: string) => {
    onSelectChat(chatId);
    if (onCloseMobile) {
      onCloseMobile();
    } else {
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-indigo-900">CrayonD AI</h2>
          {/* Close button for mobile */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onCloseMobile ? onCloseMobile() : setIsMobileMenuOpen(false)} 
            className="md:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <Button
          onClick={handleCreateNewChat}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2 py-6"
        >
          <MessageSquarePlus size={18} />
          <span>New Session</span>
        </Button>
      </div>

      <div className="p-4 border-b border-slate-200">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            type="text"
            placeholder="Search sessions..."
            className="pl-8 bg-slate-50 border-slate-200"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Chat list with flex-1 to take up available space */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredChats.length > 0 ? (
          // Chat history
          filteredChats.map((chat) => (
            <div key={chat.id} className="relative group">
              <button
                onClick={() => handleChatSelect(chat.id)}
                className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                  activeChat === chat.id ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-100 text-slate-700"
                }`}
              >
                <div className="font-medium truncate">{chat.title}</div>
                <div className="text-xs text-slate-500">
                  {format(new Date(chat.created_at), "MMM d, yyyy • h:mm a")}
                </div>
              </button>

              {/* Delete button that appears on hover */}
              <AlertDialog open={chatToDelete === chat.id} onOpenChange={(open) => !open && setChatToDelete(null)}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation()
                      setChatToDelete(chat.id)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Chat Session</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this chat session? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteChat} className="bg-red-500 hover:bg-red-600 text-white">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))
        ) : searchQuery ? (
          // No search results
          <div className="flex flex-col items-center justify-center h-40 text-center p-4">
            <p className="text-slate-500 mb-4">No chat sessions found matching "{searchQuery}"</p>
            <Button
              variant="outline"
              onClick={() => setSearchQuery("")}
              className="text-indigo-600 border-indigo-200"
            >
              Clear search
            </Button>
          </div>
        ) : (
          // Empty state
          <div className="flex flex-col items-center justify-center h-40 text-center p-4">
            <div className="bg-indigo-50 rounded-full p-4 mb-4">
              <MessageSquarePlus className="h-8 w-8 text-indigo-600" />
            </div>
            <p className="text-slate-700 font-medium mb-2">No chat sessions yet</p>
            <p className="text-slate-500 mb-4">Start your first interview coaching session</p>
            <Button
              onClick={handleCreateNewChat}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Start your first session
            </Button>
          </div>
        )}
      </div>

      {/* User profile section - locked at bottom */}
      <div className="mt-auto p-4 border-t border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src="/placeholder-user.jpg" />
              <AvatarFallback className="bg-indigo-100 text-indigo-700">
                {profileData?.name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium truncate max-w-[180px]">{profileData?.name || "User"}</div>
              <div className="text-xs text-slate-500 truncate max-w-[180px]">{profileData?.targetRole || ""}</div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={() => router.push('/onboarding')}>
                <User className="mr-2 h-4 w-4" />
                <span>Edit Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-500" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
