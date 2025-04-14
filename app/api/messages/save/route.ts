import { PineconeStore } from "@/lib/pinecone-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// POST endpoint to save/update messages for a specific chat
export async function POST(request: Request) {
  try {
    const { chatId, messages } = await request.json();
    
    if (!chatId || !messages) {
      return NextResponse.json({ error: "Chat ID and messages are required" }, { status: 400 });
    }
    
    // Initialize Pinecone store
    const pineconeStore = await PineconeStore.getInstance();
    
    // Save messages to Pinecone
    await pineconeStore.saveChatMessages(chatId, messages);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving chat messages:", error);
    return NextResponse.json({ error: "Failed to save messages" }, { status: 500 });
  }
}
