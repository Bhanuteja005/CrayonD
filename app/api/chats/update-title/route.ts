import { PineconeStore } from "@/lib/pinecone-store";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// POST endpoint to update a chat title
export async function POST(request: Request) {
  try {
    const { chatId, title } = await request.json();
    
    if (!chatId || !title) {
      return NextResponse.json({ error: "Chat ID and title are required" }, { status: 400 });
    }
    
    // Initialize Pinecone store
    const pineconeStore = await PineconeStore.getInstance();
    
    // Update chat title
    await pineconeStore.updateChatTitle(chatId, title);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating chat title:", error);
    return NextResponse.json({ error: "Failed to update chat title" }, { status: 500 });
  }
}
