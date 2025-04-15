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
    const { messages, userProfile, searchType, query, dataSource, chatId, memoryContext } = await req.json();

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
      ? `user-${userProfile.name.toLowerCase().replace(/\s+/g, "-")}-${chatId}`
      : `anonymous-user-${chatId}`;

    // Initialize memory store
    const memoryStore = await PineconeStore.getInstance();

    // Get the latest user message
    const userMessage = formattedMessages.length > 0 ? 
      formattedMessages[formattedMessages.length - 1].content : 
      "";

    // Retrieve relevant memories for context
    const relevantMemories = await memoryStore.retrieveMemories(
      sessionId,
      userMessage  // Pass the user message as queryText
    );

    // Extract memory data from either provided context or retrieved memories
    const memoryData = memoryContext || {
      sessionId,
      memories: relevantMemories,
      lastInteraction: new Date().toISOString()
    };

    // Create system message with context and tools
    const systemMessage = `
      You are an Interview Preparation Coach, designed to help users prepare for job interviews with personalized, actionable advice and context-aware guidance.
      
      User Profile:
      ${
        userProfile
          ? `
      - Name: ${userProfile.name}
      - Target Role: ${userProfile.targetRole}
      - Experience: ${userProfile.experience} years
      - Target Company: ${userProfile.targetCompany || "Not specified"}
      - Top Skills: ${userProfile.topSkill || "Not specified"}
      - Education: ${userProfile.education || "Not specified"}
      - Challenging Trait: ${userProfile.challengingTrait || "Not specified"}
      `
          : "No profile information available yet."
      }
      
      Previous Context:
      ${
        memoryData.memories && memoryData.memories.length > 0
          ? `Here are relevant points from previous conversations: ${memoryData.memories.join("\n")}`
          : relevantMemories.length > 0
          ? `Here are relevant points from previous conversations: ${relevantMemories.join("\n")}`
          : "No previous context available."
      }
      
      ${memoryData.conversationTopic ? `This conversation is primarily about: ${memoryData.conversationTopic}` : ''}
      ${memoryData.lastInteraction ? `The last interaction was on: ${new Date(memoryData.lastInteraction).toDateString()}` : ''}
      ${memoryData.keywords && memoryData.keywords.length > 0 ? `Key topics discussed: ${memoryData.keywords.join(', ')}` : ''}
      
      STRICT GUIDELINES:
      1. You are ONLY allowed to answer questions related to:
         - Job interviews and preparation
         - Career advice and professional development 
         - Resume and cover letter help
         - Company research for interviews
         - Salary negotiation
         - Interview skills and techniques
         - Interview preparation plans and strategies
         - Mock interview practice and feedback
         - Industry trends relevant to job interviews
         - Role-specific interview questions and answers
         - Company-specific preparation advice
      
      2. If the user asks questions completely unrelated to interviews, career, or professional development, 
         politely redirect them back to interview topics. Say: "I'm your Interview Coach, so I'm here to help 
         with interview preparation. Let's focus on how I can help you succeed in your job interviews."
      
      3. You should NOT answer questions about:
         - General knowledge unrelated to careers
         - Political topics
         - Entertainment
         - Personal relationship advice
         - Health advice
         - Any topic unrelated to professional development
      
      Your capabilities:
      1. Provide common interview questions for the user's target role
      2. Give feedback on the user's practice answers
      3. Offer tips for interview success
      4. Remember important details from previous conversations
      5. Create personalized interview preparation plans with timelines
      6. Provide company-specific interview preparation advice
      7. Compare different companies' interview approaches
      8. Analyze industry trends relevant to interviews
      9. Tailor advice based on user's experience level and career goals
      
      INTERVIEW PREPARATION PLANS:
      When asked to create a preparation plan:
      1. Create a structured timeline (1-4 weeks depending on urgency)
      2. Divide into clear phases: Research, Skill Review, Practice, and Final Preparation
      3. Include daily/weekly tasks with estimated time commitments
      4. Recommend specific resources relevant to their role/industry
      5. Include both technical preparation and behavioral question practice
      6. Schedule mock interview sessions throughout the plan
      7. Tailor the plan based on their experience level and target role
      8. Include company-specific research if a target company is mentioned
      9. Present the plan using markdown tables and clear headings
      
      SPECIFIC QUESTION TYPES TO HANDLE WELL:
      
      1. Role-specific technical questions:
         - "What are the most common technical questions for [role] interviews?"
         - "How should I prepare for [specific technical skill] questions?"
         - Be specific to the role, experience level, and industry
      
      2. Company research questions:
         - "What should I know about [Company X] for my interview?"
         - "How do [Company X]'s values compare to [Company Y]?"
         - Provide strategic advice on how to leverage company knowledge
      
      3. Comparative advice requests:
         - "How should I approach interviews differently at startups vs. corporations?"
         - "What's different about interviewing for [Role A] vs [Role B]?"
         - Highlight key differences and provide concrete examples
      
      4. Industry trend analysis:
         - "What are current hiring trends in [industry]?"
         - "What skills are most in-demand for [role] now?"
         - Provide up-to-date, relevant insights with practical application advice
      
      5. Personal background optimization:
         - "How should I discuss my experience in [field] for a [target role]?"
         - "What's the best way to explain my career transition?"
         - Tailor advice to their specific background and goals
      
      Format your responses with proper structure:
      - Use markdown formatting for better readability
      - Use headers (## and ###) for section titles
      - Use bold (**text**) for emphasis
      - Use bullet lists and numbered lists where appropriate
      - Use tables for structured information
      - Separate sections with line breaks
      - Be concise but comprehensive
      
      Be supportive, professional, and provide specific, actionable advice.
      
      IMPORTANT: When the user asks if you remember something from previous conversations, refer to the previous context provided above to demonstrate your memory capabilities. Acknowledge details they've shared before.
    `;

    // Extract keywords for memory if we have a user message
    const extractKeywords = (text: string): string[] => {
      if (!text || text.length < 10) return [];
      
      // Common words to filter out
      const commonWords = ['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 
        'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 
        'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 
        'theirs', 'themselves', 'what', 'which', 'who', 'whom', 'this', 'that', 'these', 
        'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 
        'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 
        'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 
        'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 
        'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 
        'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 
        'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 
        'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 
        'very', 'can', 'will', 'just', 'don', 'should', 'now'];
      
      const words = text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !commonWords.includes(word));
      
      // Count word frequency
      const wordCount: {[key: string]: number} = {};
      words.forEach(word => {
        wordCount[word] = (wordCount[word] || 0) + 1;
      });
      
      // Get top keywords (up to 5)
      return Object.entries(wordCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(entry => entry[0]);
    };

    // Extract keywords and update memory context
    const extractedKeywords = extractKeywords(userMessage);
    const existingKeywords = memoryData.keywords || [];
    
    // Update memory context
    const updatedMemoryContext = {
      ...memoryData,
      sessionId,
      conversationTopic: memoryData.conversationTopic || (userMessage.length > 50 
        ? userMessage.substring(0, 50) + '...' 
        : userMessage),
      keywords: [...new Set([...existingKeywords, ...extractedKeywords])].slice(0, 10),
      lastInteraction: new Date().toISOString(),
    };

    // Add this to your existing API route before calling the LLM
    const enhancedSystemPrompt = (memoryContext: any, basePrompt: string) => {
      if (!memoryContext) return basePrompt;
      
      // Build personalized context based on user details
      let personalContext = "";
      
      if (memoryContext.userDetails) {
        const details = memoryContext.userDetails;
        
        if (details.name) {
          personalContext += `The user's name is ${details.name}. `;
        }
        
        if (details.college) {
          personalContext += `The user studied at ${details.college}. `;
        }
        
        if (details.companies && details.companies.length > 0) {
          personalContext += `The user has mentioned working at or being interested in these companies: ${details.companies.join(', ')}. `;
        }
        
        if (details.preferredCompanyType) {
          personalContext += `The user has mentioned preference for ${details.preferredCompanyType} companies. `;
        }
        
        if (details.preferredRoles && details.preferredRoles.length > 0) {
          personalContext += `The user has mentioned these roles: ${details.preferredRoles.join(', ')}. `;
        }
        
        if (details.experience) {
          personalContext += `The user has ${details.experience} years of experience. `;
        }
      }
      
      // Add previous conversation memories if available
      if (memoryContext.memories && memoryContext.memories.length > 0) {
        personalContext += "\n\nHere are some relevant previous exchanges with this user:\n";
        memoryContext.memories.forEach((memory: string, index: number) => {
          personalContext += `Memory ${index + 1}: ${memory}\n\n`;
        });
      }
      
      // Return enhanced prompt
      return `${basePrompt}\n\nImportant user context: ${personalContext}\n\nRemember to reference this user context naturally in your responses when relevant, but don't explicitly mention that you're using "stored memories". Make your responses personal and contextual.`;
    };

    // Initialize Gemini with the correct model
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    try {
      // Generate response using Gemini
      const systemPrompt = enhancedSystemPrompt(updatedMemoryContext, systemMessage);
      const result = await model.generateContent({
        contents: [
          { role: 'user', parts: [{ text: systemPrompt + "\n\nCurrent user question: " + userMessage }] }
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
          
          // Update memory context with the new conversation
          if (!updatedMemoryContext.memories) {
            updatedMemoryContext.memories = [];
          }
          
          // Add new memory at the beginning
          const newMemory = `USER: ${lastUserMessage.content}\nAI: ${responseText}`;
          updatedMemoryContext.memories = [newMemory, ...(updatedMemoryContext.memories || [])].slice(0, 5);
        }
      }

      // Return the response with memory context as a separate property
      // This prevents the memory context from appearing in the visible message
      return new Response(
        JSON.stringify({
          id: Date.now().toString(),
          role: "assistant",
          content: responseText,
          memoryContext: updatedMemoryContext // Send as a separate property
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
