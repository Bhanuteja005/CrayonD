/**
 * Fetch news articles using News API
 */
export async function fetchNews(query: string) {
  try {
    const encodedQuery = encodeURIComponent(query);
    
    // Use the News API to fetch relevant news
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodedQuery}&sortBy=publishedAt&language=en&pageSize=5&apiKey=${process.env.NEWS_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`News API returned ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('News API error:', error);
    throw error;
  }
}
