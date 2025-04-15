import { PineconeStore } from "@/lib/pinecone-store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { chatId, messages, memoryContext } = await request.json();

    if (!chatId || !messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    // Initialize Pinecone store
    const pineconeStore = await PineconeStore.getInstance();
    
    // Ensure system messages are included when saving
    const systemMessages = messages.filter(msg => msg.role === 'system');
    if (systemMessages.length === 0 && messages.length > 0) {
      console.warn("No system messages found, recommend including system prompt for context");
    }
    
    // Ensure chatId is valid and formatted correctly
    const sanitizedChatId = chatId.replace(/[^a-zA-Z0-9-]/g, '');
    if (sanitizedChatId !== chatId) {
      console.warn("ChatId was sanitized");
    }
    
    // Save to Pinecone with retry
    let savedSuccessfully = false;
    let retryCount = 0;
    const maxRetries = 2;
    
    while (!savedSuccessfully && retryCount <= maxRetries) {
      try {
        await pineconeStore.saveChatMessages(sanitizedChatId, messages, memoryContext);
        savedSuccessfully = true;
      } catch (saveError) {
        console.error(`Attempt ${retryCount + 1} failed to save messages:`, saveError);
        if (retryCount >= maxRetries) throw saveError;
        await new Promise(resolve => setTimeout(resolve, 500));
        retryCount++;
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving chat messages:", error);
    return NextResponse.json({ error: "Failed to save messages" }, { status: 500 });
  }
}
