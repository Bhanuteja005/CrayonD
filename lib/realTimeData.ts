import axios from 'axios';

/**
 * Search Google using Serper API
 */
export async function searchGoogle(query: string) {
  try {
    const response = await axios.post(
      "https://google.serper.dev/search",
      { q: query },
      {
        headers: {
          "X-API-KEY": process.env.SERPER_API_KEY || "",
          "Content-Type": "application/json"
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error searching Google:", error);
    return null;
  }
}

/**
 * Get the latest news using NewsAPI
 */
export async function getLatestNews(query: string) {
  try {
    const response = await axios.get(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=5`,
      {
        headers: {
          "X-Api-Key": process.env.NEWS_API_KEY || ""
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching news:", error);
    return null;
  }
}
