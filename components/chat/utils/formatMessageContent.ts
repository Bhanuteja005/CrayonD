export function formatMessageContent(content: string) {
  // Try to parse JSON content if it looks like JSON
  let parsedContent = content
  
  try {
    // Check if the content is a JSON string
    if (typeof content === 'string' && 
        (content.trim().startsWith('{') && content.trim().endsWith('}'))) {
      const jsonContent = JSON.parse(content)
      if (jsonContent.content) {
        parsedContent = jsonContent.content
      }
    }
  } catch (error) {
    // If parsing fails, use the original content
  }
  
  // Filter out any remaining memory context JSON that might have made it through
  if (parsedContent.includes('{"memoryContext":')) {
    parsedContent = parsedContent.replace(/\n\n\{\"memoryContext\":.+\}$/s, '');
  }
  
  // Filter out system prompt message that shows up at beginning of conversations
  if (parsedContent.includes('You are an Interview Preparation Coach') && 
      parsedContent.includes('politely redirect the conversation back to interview preparation')) {
    return ""; // Return empty content for system prompt messages that leaked through
  }
  
  // If content is already in markdown format (from search results), return as is
  if (parsedContent.startsWith('# 🔍') || parsedContent.startsWith('# 🗞️')) {
    return parsedContent
  }
  
  // Format the greeting part
  let formattedContent = parsedContent
  
  // Format any markdown
  formattedContent = formattedContent
    // Extract name from greeting and make it bold with emoji
    .replace(/^(Hello|Hi|Hey)\s+(\w+)!/i, '## 👋 $1 $2!')
    
    // Format sections and add structure
    .replace(/\n\n## /g, '\n\n## ')
    .replace(/\n\n### /g, '\n\n### ')
    
    // Ensure proper markdown formatting
    .replace(/\*\*(.*?)\*\*/g, '**$1**')
    
    // Format lists properly
    .replace(/^\s*\*\s+/gm, '* ')
    
    // Add better paragraph breaks
    .replace(/\n/g, '\n\n')
    
    // Clean up extra line breaks
    .replace(/\n\s*\n\s*\n/g, '\n\n')
  
  return formattedContent
}
