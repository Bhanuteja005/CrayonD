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
    
    // Get messages for the chat
    const messages = await pineconeStore.getChatMessages(chatId);
    
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
