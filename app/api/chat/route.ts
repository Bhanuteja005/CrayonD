import { InterviewToolkit } from "@/lib/interview-tools";
import { PineconeStore } from "@/lib/pinecone-store";
import { getLatestNews, searchGoogle } from "@/lib/realTimeData";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { type Message } from "ai";

export const runtime = "nodejs";

// Keep track of current search state
interface SearchQueries {
  currentQuery: string;
  searchType: 'web' | 'news' | null;
}

let searchState: SearchQueries = {
  currentQuery: '',
  searchType: null
};

export async function POST(req: Request) {
  try {
    const { messages, userProfile, searchType, query, dataSource } = await req.json();

    // Update search state if query is provided
    if (query) {
      searchState = {
        currentQuery: query,
        searchType: searchType || null
      };
    }
    
    // Handle search requests (web or news)
    if (dataSource === 'search' || searchType) {
      const searchQuery = query || messages[messages.length - 1]?.content || "";
      
      if (searchType === 'news') {
        const newsData = await getLatestNews(searchQuery);
        if (!newsData?.articles?.length) {
          return new Response(JSON.stringify({
            id: Date.now().toString(),
            role: "assistant",
            content: "No news articles found for your query."
          }), { headers: { 'Content-Type': 'application/json' }});
        }

        const formattedNews = `# 🗞️ Latest Industry News\n\n${newsData.articles.map((article: any) => (
          `### ${article.title}\n\n` +
          `📅 ${new Date(article.publishedAt).toLocaleDateString()}\n\n` +
          `${article.description}\n\n` +
          `[Read Full Article](${article.url})`
        )).join('\n\n---\n\n')}`;

        return new Response(JSON.stringify({
          id: Date.now().toString(),
          role: "assistant",
          content: formattedNews,
        }), { headers: { 'Content-Type': 'application/json' }});
      } 
      else if (searchType === 'web') {
        const searchData = await searchGoogle(searchQuery);
        if (!searchData?.organic?.length) {
          return new Response(JSON.stringify({
            id: Date.now().toString(),
            role: "assistant",
            content: "No search results found."
          }), { headers: { 'Content-Type': 'application/json' }});
        }

        const formattedSearch = `# 🔍 Web Search Results\n\n${searchData.organic.map((result: any) => (
          `### ${result.title}\n\n` +
          `${result.snippet}\n\n` +
          `[View Source](${result.link})`
        )).join('\n\n---\n\n')}`;

        return new Response(
          JSON.stringify({
            id: Date.now().toString(),
            role: "assistant",
            content: formattedSearch,
          }),
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }
    }

    // Convert messages to the format expected by the AI SDK
    const formattedMessages = messages.map((message: Message) => ({
      role: message.role,
      content: message.content,
    }));

    // Create a unique session ID for the user
    const sessionId = userProfile?.name
      ? `user-${userProfile.name.toLowerCase().replace(/\s+/g, "-")}`
      : "anonymous-user";

    // Initialize memory store
    const memoryStore = await PineconeStore.getInstance();

    // Retrieve relevant memories for context
    const relevantMemories = await memoryStore.retrieveMemories(
      sessionId,
      formattedMessages[formattedMessages.length - 1]?.content || "",
    );

    // Initialize interview tools
    const interviewTools = new InterviewToolkit();

    // Create system message with context and tools
    const systemMessage = `
      You are an Interview Preparation Coach, designed to help users prepare for job interviews.
      
      User Profile:
      ${
        userProfile
          ? `
      - Name: ${userProfile.name}
      - Target Role: ${userProfile.targetRole}
      - Experience: ${userProfile.experience} years
      - Skills: ${userProfile.skills.join(", ")}
      `
          : "No profile information available yet."
      }
      
      Previous Context:
      ${
        relevantMemories.length > 0
          ? `Here are relevant points from previous conversations: ${relevantMemories.join("\n")}`
          : "No previous context available."
      }
      
      Your capabilities:
      1. Provide common interview questions for the user's target role
      2. Give feedback on the user's practice answers
      3. Offer tips for interview success
      4. Remember important details from previous conversations
      
      Format your responses with proper structure:
      - Use markdown formatting for better readability
      - Use headers (## and ###) for section titles
      - Use bold (**text**) for emphasis
      - Use bullet lists and numbered lists where appropriate
      - Separate sections with line breaks
      - Be concise but comprehensive
      
      Be supportive, professional, and provide specific, actionable advice.
    `;

    // Get the latest user message
    const userMessage = formattedMessages[formattedMessages.length - 1].content;

    // Initialize Gemini with the correct model
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
      // Generate response using Gemini
      const result = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: systemMessage + "\n\nCurrent user question: " + userMessage }] }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1000,
        },
      });

      const response = result.response;
      if (!response) {
        throw new Error('Empty response from Gemini');
      }
      
      const responseText = response.text();

      // Store the conversation in memory
      if (formattedMessages.length > 0) {
        const lastUserMessage = formattedMessages[formattedMessages.length - 1];
        if (lastUserMessage.role === "user") {
          await memoryStore.storeMemory(sessionId, lastUserMessage.content, responseText);
        }
      }

      // Return the response
      return new Response(
        JSON.stringify({
          id: Date.now().toString(),
          role: "assistant",
          content: responseText,
        }),
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error("Error generating response:", error);
      return new Response(
        JSON.stringify({
          id: Date.now().toString(),
          role: "assistant",
          content: "I'm sorry, I'm having trouble right now. Could you please try again?",
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }
  } catch (error) {
    console.error("Error in chat route:", error);
    return new Response(
      JSON.stringify({
        id: Date.now().toString(),
        role: "assistant",
        content: "An error occurred during the chat request",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
