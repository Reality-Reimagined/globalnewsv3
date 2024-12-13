import type { Article, FeedSource } from '../types';
import { parser } from '../utils/feedParser';
import { parseArticleContent, extractImageUrl } from '../utils/articleParser';

export async function fetchArticles(sources: FeedSource[]): Promise<Article[]> {
  const articles = await Promise.all(
    sources.map(source => fetchFeedArticles(source))
  );
  return articles.flat();
}

async function fetchFeedArticles(source: FeedSource): Promise<Article[]> {
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(source.url)}`;
    const feed = await parser.parseURL(proxyUrl);

    return feed.items.map((item: any, index: number) => {
      // Parse and clean the content
      const { cleanContent, imageUrl: contentImageUrl } = parseArticleContent(
        item.content || item.description || ''
      );

      // Get the best available image
      const imageUrl = extractImageUrl(item) || contentImageUrl;

      // Create a unique ID by combining source ID, article link/guid, and index
      const uniqueId = `${source.id}-${item.guid || item.link || Date.now()}-${index}`;

      return {
        id: uniqueId,
        title: item.title || '',
        link: item.link || '',
        pubDate: item.pubDate || '',
        content: cleanContent,
        contentSnippet: item.contentSnippet || '',
        guid: uniqueId, // Use the same unique ID for guid
        categories: item.categories || [],
        isoDate: item.isoDate || new Date().toISOString(),
        source: source.name,
        country: source.country,
        imageUrl,
        isRead: false,
        isBookmarked: false,
      };
    });
  } catch (error) {
    console.error(`Error fetching feed from ${source.name}:`, error);
    return [];
  }
}