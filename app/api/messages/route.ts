import { PineconeStore } from "@/lib/pinecone-store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// GET endpoint to retrieve messages for a specific chat
export async function GET(request: NextRequest) {
  try {
    // Get chatId from query params
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");
    
    if (!chatId) {
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }
    
    // Initialize Pinecone store
    const pineconeStore = await PineconeStore.getInstance();
    
    // Get messages for the chat with retry mechanism
    let messages = [];
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        messages = await pineconeStore.getChatMessages(chatId);
        
        // If we got messages, break out of retry loop
        if (messages && messages.length > 0) {
          break;
        }
        
        // If no messages and not the last retry, wait briefly and try again
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        retryCount++;
      } catch (fetchError) {
        console.error(`Attempt ${retryCount + 1} failed to fetch messages:`, fetchError);
        if (retryCount >= maxRetries) throw fetchError;
        retryCount++;
      }
    }
    
    // Add cache control headers to prevent stale data
    return NextResponse.json(
      { messages, timestamp: new Date().toISOString() },
      { 
        headers: {
          'Cache-Control': 'no-store, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0'
        } 
      }
    );
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
