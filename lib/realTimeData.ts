const SERPER_API_KEY = process.env.SERPER_API_KEY;
const NEWS_API_KEY = process.env.NEWS_API_KEY;

export async function searchGoogle(query: string) {
  
  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': SERPER_API_KEY || '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ q: query })
  });

  if (!response.ok) {
    throw new Error('Search API error');
  }

  const data = await response.json();
  return {
    organic: data.organic?.map((result: any) => ({
      title: result.title,
      snippet: result.snippet,
      link: result.link
    })),
    knowledge: data.knowledgeGraph,
    answerBox: data.answerBox
  };
}

export async function getLatestNews(query: string) {
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=3&language=en&apiKey=${NEWS_API_KEY}`;
  
  console.log('Fetching news for query:', query);
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`News API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('News API response:', data);
    
    if (!data.articles) {
      throw new Error('No articles found');
    }

    return {
      articles: data.articles.map((article: any) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.source.name,
        publishedAt: new Date(article.publishedAt).toLocaleDateString(),
      }))
    };
  } catch (error) {
    console.error('News API error:', error);
    throw error;
  }
}
