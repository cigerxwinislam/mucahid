import { tool } from 'ai';
import { z } from 'zod';
import type { ToolContext } from './types';
import FirecrawlApp from '@mendable/firecrawl-js';

/**
 * Creates a tool for searching web pages using search engine
 * @param context - The context needed for tool execution
 * @returns The web search tool
 */
export const createWebSearchTool = (context: ToolContext) => {
  const { dataStream, userCountryCode } = context;

  return tool({
    description:
      'Search web pages using search engine. Use for obtaining latest information or finding references.',
    parameters: z.object({
      query: z
        .string()
        .describe('Search query in Google search style, using 3-5 keywords.'),
      date_range: z
        .enum([
          'all',
          'past_hour',
          'past_day',
          'past_week',
          'past_month',
          'past_year',
        ])
        .optional()
        .describe('(Optional) Time range filter for search results.'),
    }),
    execute: async ({ query, date_range }) => {
      // Initialize Firecrawl client
      if (!process.env.FIRECRAWL_API_KEY) {
        console.error('FIRECRAWL_API_KEY environment variable is not set');
        return 'Failed to perform web search: API key not configured';
      }
      const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

      // Map date_range to Firecrawl's tbs format
      const tbsMap = {
        past_hour: 'qdr:h',
        past_day: 'qdr:d',
        past_week: 'qdr:w',
        past_month: 'qdr:m',
        past_year: 'qdr:y',
        all: undefined,
      };

      try {
        // Perform the search
        const searchResult = await app.search(query, {
          limit: 10,
          ...(userCountryCode && { country: userCountryCode }),
          tbs: date_range ? tbsMap[date_range] : undefined,
        });

        const wrappedContent = `<pgptml:info_search_web query="${query}">${JSON.stringify(searchResult.data)}</pgptml:info_search_web>\n\n`;
        dataStream.writeData({
          type: 'text-delta',
          content: wrappedContent,
        });

        return JSON.stringify(searchResult.data);
      } catch (error) {
        console.error('Web search error:', error);
        return 'Failed to perform web search';
      }
    },
  });
};
