import express from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';
import { runAsync, getAsync, allAsync } from '../db.js';

const router = express.Router();

// Cache with 1 hour TTL
const cache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

const OPENALEX_API = 'https://api.openalex.org/works';

// Build OpenAlex search query
function buildOpenAlexQuery(params) {
  const {
    query,
    yearMin,
    yearMax,
    author,
    institution,
    subject,
    openAccessOnly,
    sort = 'cited_by_count',
    page = 1,
    pageSize = 20
  } = params;

  let filterArray = [];

  if (yearMin || yearMax) {
    if (yearMin && yearMax) {
      filterArray.push(`publication_year:[${yearMin} TO ${yearMax}]`);
    } else if (yearMin) {
      filterArray.push(`publication_year:>=${yearMin}`);
    } else if (yearMax) {
      filterArray.push(`publication_year:<=${yearMax}`);
    }
  }

  if (openAccessOnly) {
    filterArray.push('is_oa:true');
  }

  const filters = filterArray.length > 0 ? filterArray.join(',') : '';

  const searchParams = {
    search: query || '',
    per_page: pageSize,
    page: page,
    sort: sort
  };

  if (filters) {
    searchParams.filter = filters;
  }

  return searchParams;
}

// Parse OpenAlex response
function parseOpenAlexResponse(data) {
  return {
    totalCount: data.meta?.count || 0,
    currentPage: data.meta?.page || 1,
    pageSize: data.meta?.per_page || 20,
    results: (data.results || []).map(work => ({
      id: work.id,
      openalexId: work.id,
      title: work.title,
      abstract: work.abstract_inverted_index ? reconstructAbstract(work.abstract_inverted_index) : null,
      authors: (work.authorships || []).map(auth => ({
        name: auth.author?.display_name,
        id: auth.author?.id
      })),
      doi: work.doi,
      journal: work.primary_location?.source?.display_name || work.host_venue?.display_name || null,
      year: work.publication_year,
      citationCount: work.cited_by_count || 0,
      isOa: work.is_oa,
      openAccessUrl: work.open_access?.oa_url,
      publicationDate: work.publication_date,
      subjects: (work.topics || []).map(t => t.display_name)
    }))
  };
}

// Reconstruct abstract from inverted index
function reconstructAbstract(invertedIndex) {
  if (!invertedIndex) return null;
  const words = new Array(Math.max(...Object.values(invertedIndex).flat()) + 1);
  Object.entries(invertedIndex).forEach(([word, positions]) => {
    positions.forEach(pos => {
      words[pos] = word;
    });
  });
  return words.join(' ');
}

// Search papers
router.get('/papers', async (req, res) => {
  try {
    const {
      q,
      year_min,
      year_max,
      author,
      institution,
      subject,
      open_access_only,
      sort = 'cited_by_count',
      page = 1,
      page_size = 20
    } = req.query;

    // Create cache key
    const cacheKey = `search_${JSON.stringify(req.query)}`;
    const cachedResult = cache.get(cacheKey);

    if (cachedResult) {
      return res.json({ ...cachedResult, fromCache: true });
    }

    // Build query
    const queryParams = buildOpenAlexQuery({
      query: q,
      yearMin: year_min ? parseInt(year_min) : null,
      yearMax: year_max ? parseInt(year_max) : null,
      author,
      institution,
      subject,
      openAccessOnly: open_access_only === 'true',
      sort,
      page: parseInt(page),
      pageSize: parseInt(page_size)
    });

    // Fetch from OpenAlex
    const response = await axios.get(OPENALEX_API, {
      params: queryParams,
      timeout: 10000
    });

    const result = parseOpenAlexResponse(response.data);

    // Cache result
    cache.set(cacheKey, result);

    res.json(result);
  } catch (error) {
    console.error('Search error:', error);
    
    if (error.response?.status === 429) {
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }

    res.status(500).json({ error: 'Search failed' });
  }
});

// Get trending topics in Nigeria
router.get('/trending-nigeria', async (req, res) => {
  try {
    // Cache trending results for 6 hours
    const cacheKey = 'trending_nigeria';
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json({ ...cached, fromCache: true });
    }

    // Popular disciplines in Nigeria
    const disciplines = ['Engineering', 'Medicine', 'Law', 'Social Sciences', 'Agriculture', 'Computer Science'];

    const trendingResults = [];

    // Fetch top papers for each discipline (last 2 years)
    for (const discipline of disciplines) {
      try {
        const response = await axios.get(OPENALEX_API, {
          params: {
            search: discipline,
            filter: 'publication_year:>=2023,is_oa:true',
            per_page: 3,
            sort: '-publication_year'
          },
          timeout: 5000
        });

        if (response.data.results?.length > 0) {
          trendingResults.push({
            discipline,
            papers: response.data.results.map(work => ({
              title: work.title,
              year: work.publication_year,
              citationCount: work.cited_by_count,
              id: work.id,
              doi: work.doi
            }))
          });
        }
      } catch (err) {
        console.error(`Error fetching trending for ${discipline}:`, err.message);
      }
    }

    const result = {
      trendingByDiscipline: trendingResults,
      lastUpdated: new Date().toISOString()
    };

    cache.set(cacheKey, result, 21600); // 6 hour TTL

    res.json(result);
  } catch (error) {
    console.error('Trending error:', error);
    res.status(500).json({ error: 'Failed to fetch trending topics' });
  }
});

// Get paper suggestions (autocomplete)
router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({ suggestions: [] });
    }

    const cacheKey = `suggestions_${q}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json({ suggestions: cached, fromCache: true });
    }

    const response = await axios.get(OPENALEX_API, {
      params: {
        search: q,
        per_page: 5,
        sort: '-publication_year'
      },
      timeout: 5000
    });

    const suggestions = (response.data.results || []).map(work => ({
      id: work.id,
      title: work.title,
      year: work.publication_year,
      authors: (work.authorships || []).slice(0, 2).map(a => a.author?.display_name)
    }));

    cache.set(cacheKey, suggestions, 1800); // 30 min cache

    res.json({ suggestions });
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

export default router;