import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt?: Date;
}

// Create a simple in-memory fallback for when Pinecone is not available
class InMemoryStore {
  private memories: Map<string, Array<{ text: string, timestamp: string }>> = new Map();
  
  storeMemory(sessionId: string, text: string): void {
    if (!this.memories.has(sessionId)) {
      this.memories.set(sessionId, []);
    }
    this.memories.get(sessionId)?.push({
      text,
      timestamp: new Date().toISOString()
    });
    
    // Limit memory to last 10 entries
    const sessionMemories = this.memories.get(sessionId);
    if (sessionMemories && sessionMemories.length > 10) {
      this.memories.set(sessionId, sessionMemories.slice(-10));
    }
  }
  
  retrieveMemories(sessionId: string): Array<string> {
    return (this.memories.get(sessionId) || []).map(m => m.text);
  }
}

/**
 * A utility class to interact with Pinecone for storing and retrieving interview coach data
 */
export class PineconeStore {
  private static instance: PineconeStore;
  private pinecone: Pinecone;
  private genAI: GoogleGenerativeAI;
  private embeddingModel: any;
  private namespace: string = "interview-coach-memory";
  private indexName: string = "chatbot";  // Using your existing index name
  private indexInitialized: boolean = false;
  private dimensions: number = 1024;  // Correct dimensions for your index
  private inMemoryFallback: InMemoryStore;
  private isInitialized = false;

  private constructor() {
    // Initialize in-memory fallback first for reliability
    this.inMemoryFallback = new InMemoryStore();
    
    // Initialize Pinecone client without environment parameter
    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY || "",
    });
    
    // Initialize Google Generative AI for embeddings
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
    this.embeddingModel = this.genAI.getGenerativeModel({ model: "embedding-001" });
  }

  /**
   * Get a singleton instance of PineconeStore
   */
  public static async getInstance(): Promise<PineconeStore> {
    if (!PineconeStore.instance) {
      PineconeStore.instance = new PineconeStore();
      await PineconeStore.instance.initialize();
    }
    return PineconeStore.instance;
  }

  /**
   * Initialize the Pinecone client
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log("Initializing PineconeStore...");
      
      if (!process.env.PINECONE_API_KEY) {
        console.error("Missing PINECONE_API_KEY environment variable");
        return;
      }
      
      try {
        // Check if index exists
        console.log("Checking Pinecone index...");
        const indexesResponse = await this.pinecone.listIndexes();
        console.log("Available indexes:", indexesResponse);
        
        // Check if our index exists in the indexes array
        const indexNames = indexesResponse.indexes?.map(index => index.name) || [];
        if (indexNames.includes(this.indexName)) {
          console.log(`Using existing index: ${this.indexName}`);
          this.indexInitialized = true;
        } else {
          console.log(`Index ${this.indexName} not found, will use in-memory fallback`);
        }
      } catch (error) {
        console.error("Error with Pinecone operation:", error);
      }
    } catch (error) {
      console.error("Error initializing Pinecone:", error);
    }
  }

  private async getEmbedding(text: string): Promise<number[]> {
    try {
      const result = await this.embeddingModel.embedContent(text);
      const embedding = result.embedding.values;
      
      // Handle dimension mismatch
      if (embedding.length !== this.dimensions) {
        if (embedding.length < this.dimensions) {
          return [...embedding, ...Array(this.dimensions - embedding.length).fill(0)];
        } else {
          return embedding.slice(0, this.dimensions);
        }
      }
      
      return embedding;
    } catch (error) {
      console.error("Error generating embedding:", error);
      return Array(this.dimensions).fill(0).map((_, i) => Math.sin(i));
    }
  }

  /**
   * Save chat messages to Pinecone
   */
  public async saveChatMessages(chatId: string, messages: Message[]): Promise<void> {
    if (!this.isInitialized) {
      console.warn("Pinecone store not initialized, using local storage fallback");
      return;
    }

    try {
      const index = this.pinecone.Index(this.indexName);
      
      // Format messages for upsert
      const vectors = messages.map((message, i) => ({
        id: `${chatId}-${message.id}`,
        values: new Array(1536).fill(0), // Simple vector placeholder
        metadata: {
          chatId,
          messageId: message.id,
          role: message.role,
          content: message.content,
          order: i,
          timestamp: new Date().toISOString(),
        },
      }));
      
      if (vectors.length === 0) return;
      
      // Split into batches of 100 to avoid limits
      for (let i = 0; i < vectors.length; i += 100) {
        const batch = vectors.slice(i, i + 100);
        await index.upsert({
          vectors: batch,
          namespace: this.namespace,
        });
      }
    } catch (error) {
      console.error("Error saving messages to Pinecone:", error);
      // Fall back to local storage in the client
    }
  }

  /**
   * Get chat messages from Pinecone
   */
  public async getChatMessages(chatId: string): Promise<Message[]> {
    if (!this.isInitialized) {
      console.warn("Pinecone store not initialized, using local storage fallback");
      return [];
    }

    try {
      const index = this.pinecone.Index(this.indexName);

      // Query for messages for this chat
      const queryResponse = await index.query({
        topK: 100,
        vector: new Array(1536).fill(0), // Simple vector placeholder
        filter: {
          chatId: { $eq: chatId },
        },
        includeMetadata: true,
        namespace: this.namespace,
      });

      if (!queryResponse.matches || queryResponse.matches.length === 0) {
        return [];
      }

      // Convert to messages and sort by order
      const messages = queryResponse.matches
        .map((match) => {
          const metadata = match.metadata as any;
          return {
            id: metadata.messageId,
            role: metadata.role,
            content: metadata.content,
            order: metadata.order,
          };
        })
        .sort((a, b) => a.order - b.order)
        .map(({ id, role, content }) => ({ id, role, content }));

      return messages;
    } catch (error) {
      console.error("Error retrieving messages from Pinecone:", error);
      return [];
    }
  }

  /**
   * Update chat title in Pinecone
   */
  public async updateChatTitle(chatId: string, title: string): Promise<void> {
    if (!this.isInitialized) {
      console.warn("Pinecone store not initialized, using local storage fallback");
      return;
    }

    try {
      const index = this.pinecone.Index(this.indexName);
      
      // Store chat metadata
      await index.upsert({
        vectors: [{
          id: `chat-metadata-${chatId}`,
          values: new Array(1536).fill(0), // Simple vector placeholder
          metadata: {
            type: 'chat-metadata',
            chatId,
            title,
            updatedAt: new Date().toISOString(),
          },
        }],
        namespace: 'chat-metadata',
      });
    } catch (error) {
      console.error("Error updating chat title in Pinecone:", error);
    }
  }

  /**
   * Create a new chat in Pinecone
   */
  public async createChat(chatId: string, title: string, firstMessage?: string, timestamp?: string): Promise<void> {
    if (!this.isInitialized) {
      console.warn("Pinecone store not initialized, using local storage fallback");
      return;
    }

    try {
      const index = this.pinecone.Index(this.indexName);
      
      // Store chat metadata
      await index.upsert({
        vectors: [{
          id: `chat-metadata-${chatId}`,
          values: new Array(1536).fill(0), // Simple vector placeholder
          metadata: {
            type: 'chat-metadata',
            chatId,
            title,
            firstMessage: firstMessage || "",
            createdAt: timestamp || new Date().toISOString(),
            updatedAt: timestamp || new Date().toISOString(),
            isActive: true
          },
        }],
        namespace: 'chat-metadata',
      });
      
      console.log(`Created new chat ${chatId} in Pinecone`);
    } catch (error) {
      console.error("Error creating chat in Pinecone:", error);
    }
  }

  /**
   * Retrieve chat memory for context
   */
  public async retrieveMemories(sessionId: string, queryText?: string): Promise<string[]> {
    try {
      // If Pinecone not initialized, return in-memory fallback
      if (!this.indexInitialized) {
        console.log("Using in-memory fallback for retrieving memories");
        return this.inMemoryFallback.retrieveMemories(sessionId);
      }
      
      // If no sessionId provided, return empty array
      if (!sessionId) {
        console.log("No sessionId provided, returning empty memories array");
        return [];
      }
      
      // If no queryText provided, we'll try to retrieve all memories for the session
      // or return the in-memory fallback
      if (!queryText) {
        console.log(`No queryText provided, retrieving all memories for session ${sessionId}`);
        try {
          const index = this.pinecone.index(this.indexName);
          
          // Create a dummy vector filled with zeros for metadata-only filtering
          // This is needed because Pinecone API requires a vector even when filtering by metadata
          const dummyVector = new Array(this.dimensions).fill(0);
          
          // Query with dummy vector, using metadata filter
          const queryResponse = await index.query({
            vector: dummyVector,  // Include a dummy vector to satisfy the type requirements
            topK: 10,
            includeMetadata: true,
            filter: {
              sessionId: { $eq: sessionId }
            }
          });
          
          // Process the results
          const memories = queryResponse.matches
            .filter(match => match.metadata && match.metadata.text)
            .map(match => match.metadata.text as string);
          
          console.log(`Retrieved ${memories.length} memories from Pinecone via metadata query`);
          
          // If no results from metadata query, fall back to in-memory
          if (memories.length === 0) {
            console.log("No results from Pinecone metadata query, using in-memory fallback");
            return this.inMemoryFallback.retrieveMemories(sessionId);
          }
          
          return memories;
        } catch (error) {
          console.error("Error during metadata query operation:", error);
          return this.inMemoryFallback.retrieveMemories(sessionId);
        }
      }
      
      console.log(`Retrieving memories for session ${sessionId} with queryText`);
      
      try {
        const index = this.pinecone.index(this.indexName);
        const queryEmbedding = await this.getEmbedding(queryText);
        
        const queryResponse = await index.query({
          vector: queryEmbedding,
          topK: 5,  // Get more results for better context
          includeMetadata: true,
          filter: {
            sessionId: { $eq: sessionId }
          }
        });
        
        // First try getting results from Pinecone
        const memories = queryResponse.matches
          .filter(match => match.metadata && match.metadata.text)
          .map(match => match.metadata.text as string);
        
        console.log(`Retrieved ${memories.length} memories from Pinecone`);
        
        // If no results from Pinecone, fall back to in-memory
        if (memories.length === 0) {
          console.log("No results from Pinecone, using in-memory fallback");
          return this.inMemoryFallback.retrieveMemories(sessionId);
        }
        
        return memories;
      } catch (error) {
        console.error("Error during query operation:", error);
        return this.inMemoryFallback.retrieveMemories(sessionId);
      }
    } catch (error) {
      console.error("Error retrieving memories:", error);
      return this.inMemoryFallback.retrieveMemories(sessionId);
    }
  }

  /**
   * Store memory in Pinecone
   */
  public async storeMemory(sessionId: string, userMessage: string, assistantResponse: string): Promise<void> {
    try {
      // Always store in in-memory fallback for reliability
      const combinedText = `User: ${userMessage}\nAI: ${assistantResponse}`;
      this.inMemoryFallback.storeMemory(sessionId, combinedText);
      
      // Only try Pinecone if initialized
      if (!this.indexInitialized) {
        return;
      }

      if (!sessionId || !userMessage || !assistantResponse) {
        return;
      }
      
      console.log(`Storing memory for session ${sessionId}`);
      const index = this.pinecone.index(this.indexName);
      
      // Store both individual messages and the combined conversation
      const embedding = await this.getEmbedding(combinedText);
      const memoryId = `memory-${sessionId}-${Date.now()}`;
      
      try {
        await index.upsert([{
          id: memoryId,
          values: embedding,
          metadata: {
            sessionId,
            text: combinedText,
            userMessage,
            assistantResponse,
            timestamp: new Date().toISOString(),
            type: 'conversation'
          }
        }]);
        
        console.log(`Memory stored with ID: ${memoryId}`);
      } catch (error) {
        console.error("Error during upsert operation:", error);
      }
    } catch (error) {
      console.error("Error storing memory:", error);
    }
  }
}

// Make sure to run:
// npm install @pinecone-database/pinecone
// npm install @google/generative-ai
