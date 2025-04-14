import { PineconeStore } from "@/lib/pinecone-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// POST endpoint to create a new chat
export async function POST(request: Request) {
  try {
    const { chatId, title, firstMessage, timestamp } = await request.json();
    
    if (!chatId) {
      return NextResponse.json({ error: "Chat ID is required" }, { status: 400 });
    }
    
    // Initialize Pinecone store
    const pineconeStore = await PineconeStore.getInstance();
    
    // Create chat in Pinecone
    await pineconeStore.createChat(chatId, title || "New Interview Session", firstMessage, timestamp);
    
    return NextResponse.json({ success: true, chatId });
  } catch (error) {
    console.error("Error creating new chat:", error);
    return NextResponse.json({ error: "Failed to create chat" }, { status: 500 });
  }
}
