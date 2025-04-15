import { useCallback, useState } from "react";
import { MemoryContext } from "../types";
import { extractKeywords } from "../utils/extractKeywords";

export function useMemoryContext(chatId: string, profileData: any) {
  const [memoryContext, setMemoryContext] = useState<MemoryContext | null>(null);
  const [memoryActive, setMemoryActive] = useState(false);

  // Function to extract user details from messages
  const extractUserDetails = useCallback((message: string, existingDetails: any = {}) => {
    const details = { ...existingDetails };
    
    // Extract college information
    const collegePatterns = [
      /my college(?:\s+is)?\s+([A-Za-z0-9\s&.'-]+)/i,
      /I(?:'m)? (?:studying|studied) at\s+([A-Za-z0-9\s&.'-]+)/i,
      /I(?:'m)? from\s+([A-Za-z0-9\s&.'-]+)(?:\s+college|\s+university)/i,
      /graduated from\s+([A-Za-z0-9\s&.'-]+)/i
    ];
    
    collegePatterns.forEach(pattern => {
      const match = message.match(pattern);
      if (match && match[1]) {
        details.college = match[1].trim();
      }
    });
    
    // Extract company information
    const companyPatterns = [
      /(?:work(?:ed|ing))? (?:at|for)\s+([A-Za-z0-9\s&.'-]+)/i,
      /my company(?:\s+is)?\s+([A-Za-z0-9\s&.'-]+)/i,
      /(?:interview|offer) (?:at|from|with)\s+([A-Za-z0-9\s&.'-]+)/i,
      /placements? (?:at|with|from)\s+([A-Za-z0-9\s&.'-]+)/i,
      /applying to\s+([A-Za-z0-9\s&.'-]+)/i,
      /job (?:at|with)\s+([A-Za-z0-9\s&.'-]+)/i
    ];
    
    companyPatterns.forEach(pattern => {
      const match = message.match(pattern);
      if (match && match[1]) {
        const company = match[1].trim();
        details.companies = details.companies || [];
        if (!details.companies.includes(company)) {
          details.companies.push(company);
        }
      }
    });
    
    // Extract experience information
    const experiencePatterns = [
      /(\d+)\s+years? of experience/i,
      /(?:worked|working) for\s+(\d+)\s+years?/i,
      /experience (?:of|for)\s+(\d+)\s+years?/i
    ];
    
    experiencePatterns.forEach(pattern => {
      const match = message.match(pattern);
      if (match && match[1]) {
        details.experience = match[1].trim();
      }
    });
    
    // Extract role/position information
    const rolePatterns = [
      /(?:applying|interview) for\s+([A-Za-z0-9\s&.'-]+)\s+(?:position|role)/i,
      /(?:I'm a|I am a|role as a|position as a|work as a)\s+([A-Za-z0-9\s&.'-]+)/i,
      /my role is\s+([A-Za-z0-9\s&.'-]+)/i
    ];
    
    rolePatterns.forEach(pattern => {
      const match = message.match(pattern);
      if (match && match[1]) {
        const role = match[1].trim();
        details.preferredRoles = details.preferredRoles || [];
        if (!details.preferredRoles.includes(role)) {
          details.preferredRoles.push(role);
        }
      }
    });
    
    // Look for explicit mentions of product-based companies
    if (message.toLowerCase().includes("product based company") || 
        message.toLowerCase().includes("product-based company")) {
      details.preferredCompanyType = "product-based";
    }
    
    return details;
  }, []);

  // Enhanced memory update to extract and store more user details
  const updateMemoryWithLatestMessage = useCallback((userMessage: string, aiResponse: string) => {
    if (!memoryContext) return;
    
    const keywords = extractKeywords(userMessage);
    const existingKeywords = memoryContext.keywords || [];
    
    // Combine keywords without duplicates
    const uniqueKeywords = [...new Set([...existingKeywords, ...keywords])].slice(0, 10);
    
    // Update user details using information extraction
    const userDetails = extractUserDetails(userMessage, memoryContext.userDetails || {});
    
    // Update memory context
    const updatedContext: MemoryContext = {
      ...memoryContext,
      lastInteraction: new Date().toISOString(),
      keywords: uniqueKeywords,
      userDetails,
    };
    
    // If this is the first message, capture conversation topic
    if (!updatedContext.conversationTopic && userMessage) {
      updatedContext.conversationTopic = userMessage.length > 50 
        ? userMessage.substring(0, 50) + '...' 
        : userMessage;
    }
    
    // Store memories (last few message pairs)
    const newMemory = `USER: ${userMessage}\nAI: ${aiResponse}`;
    const existingMemories = updatedContext.memories || [];
    updatedContext.memories = [newMemory, ...existingMemories].slice(0, 5);
    
    // Save updated context
    setMemoryContext(updatedContext);
    localStorage.setItem(`memory-context-${chatId}`, JSON.stringify(updatedContext));
    
    // Also update the global user memory to persist across all chats
    if (profileData && profileData.name) {
      localStorage.setItem(
        `global-user-memory-${profileData.name.toLowerCase().replace(/\s+/g, "-") || "anonymous"}`,
        JSON.stringify(userDetails)
      );
    }
    
    setMemoryActive(true);
  }, [memoryContext, chatId, profileData, extractUserDetails]);

  return {
    memoryContext,
    setMemoryContext,
    memoryActive,
    setMemoryActive,
    updateMemoryWithLatestMessage,
    extractUserDetails
  };
}
