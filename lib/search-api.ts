/**
 * Web search using Serper API
 */
export async function searchWeb(query: string) {
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': process.env.SERPER_API_KEY || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        q: query,
        num: 5 // Number of results to return
      })
    });

    if (!response.ok) {
      throw new Error(`Serper API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Search API error:', error);
    throw error;
  }
}
