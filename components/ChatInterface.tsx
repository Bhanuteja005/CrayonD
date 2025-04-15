"use client"

// This file is a wrapper for backward compatibility
// It imports the new modular ChatInterface and exports it

import { ChatInterface as ModularChatInterface } from "@/components/chat/ChatInterface";

// Re-export all types from the new interface
export type { ChatInterfaceProps, MemoryContext, Message } from "@/components/chat/types";

// Export the interface with the same props to maintain compatibility
export function ChatInterface(props: React.ComponentProps<typeof ModularChatInterface>) {
  return <ModularChatInterface {...props} />;
}