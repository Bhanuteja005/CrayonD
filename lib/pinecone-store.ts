import { GoogleGenerativeAI } from '@google/generative-ai';
import { Pinecone } from '@pinecone-database/pinecone';

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

  public static async getInstance(): Promise<PineconeStore> {
    if (!PineconeStore.instance) {
      PineconeStore.instance = new PineconeStore();
      await PineconeStore.instance.initialize();
    }
    return PineconeStore.instance;
  }

  private async initialize(): Promise<void> {
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

  public async storeMemory(sessionId: string, userMessage: string, aiResponse: string): Promise<void> {
    try {
      // Always store in in-memory fallback for reliability
      const combinedText = `User: ${userMessage}\nAI: ${aiResponse}`;
      this.inMemoryFallback.storeMemory(sessionId, combinedText);
      
      // Only try Pinecone if initialized
      if (!this.indexInitialized) {
        return;
      }

      if (!sessionId || !userMessage || !aiResponse) {
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
            aiResponse,
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

  public async retrieveMemories(sessionId: string, queryText: string): Promise<string[]> {
    try {
      // If Pinecone not initialized, return in-memory fallback
      if (!this.indexInitialized) {
        console.log("Using in-memory fallback for retrieving memories");
        return this.inMemoryFallback.retrieveMemories(sessionId);
      }
      
      if (!queryText || !sessionId) {
        return this.inMemoryFallback.retrieveMemories(sessionId);
      }
      
      console.log(`Retrieving memories for session ${sessionId}`);
      
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
}
