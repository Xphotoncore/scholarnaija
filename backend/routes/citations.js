import express from 'express';
import axios from 'axios';
import NodeCache from 'node-cache';

const router = express.Router();

// Cache with 24 hour TTL
const cache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 });

const CROSSREF_API = 'https://api.crossref.org/works';

// Get citation from Crossref
async function getCrossrefCitation(doi) {
  try {
    const response = await axios.get(`${CROSSREF_API}/${encodeURIComponent(doi)}`, {
      headers: {
        'User-Agent': 'ScholarNaija (mailto:support@scholarnaija.com)'
      },
      timeout: 5000
    });
    return response.data.message;
  } catch (error) {
    console.error('Crossref error:', error.message);
    return null;
  }
}

// Format citation to APA
function formatAPA(data) {
  const authors = (data.author || [])
    .slice(0, 7)
    .map(a => `${a.family}, ${a.given?.charAt(0) || 'A'}.`)
    .join(', ');

  const title = data.title ? data.title[0] : 'Unknown title';
  const journal = data['container-title'] ? data['container-title'][0] : 'Unknown journal';
  const year = data.issued?.['date-parts']?.[0]?.[0] || 'n.d.';
  const volume = data.volume || '';
  const issue = data.issue ? `(${data.issue})` : '';
  const pages = data.page ? `, ${data.page}` : '';
  const doi = data.DOI ? `, https://doi.org/${data.DOI}` : '';

  const volumeIssue = volume ? ` ${volume}${issue}${pages}` : '';

  return `${authors} (${year}). ${title}. *${journal}*${volumeIssue}${doi}.`;
}

// Format citation to MLA
function formatMLA(data) {
  const authors = (data.author || [])
    .slice(0, 3)
    .map(a => `${a.family}, ${a.given || 'A'}`)
    .join(', and ');

  const title = data.title ? `"${data.title[0]}"` : '"Unknown Title"';
  const journal = data['container-title'] ? data['container-title'][0] : 'Unknown Journal';
  const year = data.issued?.['date-parts']?.[0]?.[0] || 'n.d.';
  const volume = data.volume || '';
  const issue = data.issue || '';
  const pages = data.page ? `, pp. ${data.page}` : '';
  const doi = data.DOI ? `, doi:${data.DOI}` : '';

  const volumeInfo = volume ? ` vol. ${volume}${issue ? `, no. ${issue}` : ''}` : '';

  return `${authors}. ${title}. *${journal}*${volumeInfo}, ${year}${pages}${doi}.`;
}

// Format citation to Chicago
function formatChicago(data) {
  const authors = (data.author || [])
    .map(a => `${a.family}, ${a.given}`)
    .join(', ');

  const title = data.title ? `${data.title[0]}` : 'Unknown Title';
  const journal = data['container-title'] ? data['container-title'][0] : 'Unknown Journal';
  const year = data.issued?.['date-parts']?.[0]?.[0] || 'n.d.';
  const volume = data.volume || '';
  const issue = data.issue || '';
  const pages = data.page ? `, ${data.page}` : '';
  const doi = data.DOI ? `. https://doi.org/${data.DOI}` : '';

  const volumeInfo = volume ? ` ${volume}` : '';
  const issueInfo = issue ? `, no. ${issue}` : '';

  return `${authors}. "${title}." *${journal}*${volumeInfo}${issueInfo} (${year})${pages}${doi}.`;
}

// Format citation to Harvard
function formatHarvard(data) {
  const authors = (data.author || [])
    .map(a => `${a.family}, ${a.given?.charAt(0) || 'A'}.`)
    .join(', ');

  const title = data.title ? data.title[0] : 'Unknown Title';
  const journal = data['container-title'] ? data['container-title'][0] : 'Unknown Journal';
  const year = data.issued?.['date-parts']?.[0]?.[0] || 'n.d.';
  const volume = data.volume || '';
  const issue = data.issue ? `(${data.issue})` : '';
  const pages = data.page ? `, pp.${data.page}` : '';

  const volumeInfo = volume ? ` ${volume}${issue}` : '';

  return `${authors} ${year}, '${title}', *${journal}*${volumeInfo}${pages}.`;
}

// Generate citations endpoint
router.get('/:doi', async (req, res) => {
  try {
    const { doi } = req.params;
    const { format = 'apa' } = req.query;

    if (!doi) {
      return res.status(400).json({ error: 'DOI required' });
    }

    // Check cache
    const cacheKey = `citation_${doi}`;
    let cachedData = cache.get(cacheKey);

    if (!cachedData) {
      cachedData = await getCrossrefCitation(doi);
      if (!cachedData) {
        return res.status(404).json({ error: 'Could not fetch citation data from Crossref' });
      }
      cache.set(cacheKey, cachedData);
    }

    let citation;
    switch (format.toLowerCase()) {
      case 'mla':
        citation = formatMLA(cachedData);
        break;
      case 'chicago':
        citation = formatChicago(cachedData);
        break;
      case 'harvard':
        citation = formatHarvard(cachedData);
        break;
      case 'apa':
      default:
        citation = formatAPA(cachedData);
    }

    res.json({
      citation,
      format,
      doi,
      bibtex: generateBibtex(cachedData)
    });
  } catch (error) {
    console.error('Citation generation error:', error);
    res.status(500).json({ error: 'Failed to generate citation' });
  }
});

// Generate BibTeX format
function generateBibtex(data) {
  const doi = data.DOI || '';
  const key = doi.replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
  const authors = (data.author || []).map(a => `${a.family}, ${a.given}`).join(' and ');
  const title = data.title ? data.title[0] : 'Unknown';
  const journal = data['container-title'] ? data['container-title'][0] : '';
  const year = data.issued?.['date-parts']?.[0]?.[0] || '';
  const volume = data.volume || '';
  const issue = data.issue || '';
  const pages = data.page || '';

  return `@article{${key || 'unknown'},
  author = {${authors}},
  title = {${title}},
  journal = {${journal}},
  year = {${year}},
  volume = {${volume}},
  issue = {${issue}},
  pages = {${pages}},
  doi = {${doi}}
}`;
}

// Batch citation generation
router.post('/batch', async (req, res) => {
  try {
    const { dois, format = 'apa' } = req.body;

    if (!dois || !Array.isArray(dois) || dois.length === 0) {
      return res.status(400).json({ error: 'DOI array required' });
    }

    const citations = [];

    for (const doi of dois.slice(0, 50)) { // Limit to 50
      try {
        const cacheKey = `citation_${doi}`;
        let cachedData = cache.get(cacheKey);

        if (!cachedData) {
          cachedData = await getCrossrefCitation(doi);
          if (cachedData) {
            cache.set(cacheKey, cachedData);
          }
        }

        if (cachedData) {
          let citation;
          switch (format.toLowerCase()) {
            case 'mla':
              citation = formatMLA(cachedData);
              break;
            case 'chicago':
              citation = formatChicago(cachedData);
              break;
            case 'harvard':
              citation = formatHarvard(cachedData);
              break;
            case 'apa':
            default:
              citation = formatAPA(cachedData);
          }

          citations.push({ doi, citation });
        }
      } catch (err) {
        console.error(`Error processing DOI ${doi}:`, err.message);
      }
    }

    res.json({ citations, format, count: citations.length });
  } catch (error) {
    console.error('Batch citation error:', error);
    res.status(500).json({ error: 'Failed to generate citations' });
  }
});

export default router;